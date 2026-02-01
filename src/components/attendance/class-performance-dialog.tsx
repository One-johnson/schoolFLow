'use client';

import { JSX, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { generateClassPerformancePDF } from '@/lib/pdf-generators/attendance-reports';
import type { DateRange } from 'react-day-picker';

interface ClassPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function ClassPerformanceDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName
}: ClassPerformanceDialogProps): JSX.Element {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const classes = useQuery(
    api.classes.getClassesBySchool,
    { schoolId }
  );

  const attendance = useQuery(
    api.attendance.getAttendanceBySchool,
    dateRange?.from && dateRange?.to
      ? { schoolId }
      : 'skip'
  );

  const handleGenerate = async (): Promise<void> => {
    if (!dateRange?.from || !dateRange?.to || !attendance || !classes) {
      toast.error('Please select a date range');
      return;
    }

    if (attendance.length === 0) {
      toast.error('No attendance records found for the selected period');
      return;
    }

    setIsGenerating(true);

    try {
      // Calculate statistics for each class
      const classStats = classes.map((classItem) => {
        const classAttendance = attendance.filter((a) => a.classId === classItem._id);
        
        const totalPresent = classAttendance.reduce((sum, a) => sum + a.presentCount, 0);
        const totalAbsent = classAttendance.reduce((sum, a) => sum + a.absentCount, 0);
        const totalStudentsRecorded = classAttendance.reduce((sum, a) => sum + a.totalStudents, 0);
        
        const attendanceRate = totalStudentsRecorded > 0
          ? (totalPresent / totalStudentsRecorded) * 100
          : 0;

        return {
          className: classItem.className,
          totalDays: classAttendance.length,
          attendanceRate,
          totalPresent,
          totalAbsent
        };
      }).filter((stat) => stat.totalDays > 0); // Only include classes with attendance records

      if (classStats.length === 0) {
        toast.error('No classes with attendance records in this period');
        return;
      }

      generateClassPerformancePDF({
        schoolName,
        startDate: format(dateRange.from, 'MMMM dd, yyyy'),
        endDate: format(dateRange.to, 'MMMM dd, yyyy'),
        classes: classStats
      });

      toast.success('Class performance report generated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalDays = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  const classesWithRecords = attendance && classes
    ? new Set(attendance.map((a) => a.classId)).size
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Class Performance Report</DialogTitle>
          <DialogDescription>
            Compare attendance performance across all classes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              {totalDays} days selected
            </p>
          </div>

          {/* Preview Info */}
          {attendance && classes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-blue-900">Report Preview</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>Total Classes: {classes.length}</div>
                <div>With Records: {classesWithRecords}</div>
                <div>Attendance Records: {attendance.length}</div>
                <div>Date Range: {totalDays} days</div>
              </div>
            </div>
          )}

          {attendance && attendance.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠ No attendance records found for the selected period
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!dateRange?.from || !dateRange?.to || isGenerating || !attendance || attendance.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
