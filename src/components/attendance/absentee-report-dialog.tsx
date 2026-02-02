'use client';

import { JSX, useState } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateAbsenteeReportPDF } from '@/lib/pdf-generators/attendance-reports';

interface AbsenteeReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function AbsenteeReportDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName
}: AbsenteeReportDialogProps): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const convex = useConvex();

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  // Query attendance sessions for the selected date
  const attendance = useQuery(
    api.attendance.getAttendanceByDate,
    selectedDate
      ? {
          schoolId,
          startDate: formattedDate,
          endDate: formattedDate
        }
      : 'skip'
  );

  const handleGenerate = async (): Promise<void> => {
    if (!attendance || attendance.length === 0) {
      toast.error('No attendance records found for this date');
      return;
    }

    setIsGenerating(true);

    try {
      // Collect all absentees from all attendance sessions
      const absentees: Array<{
        className: string;
        studentName: string;
        status: 'absent' | 'excused';
        remarks?: string;
      }> = [];

      // Fetch records for each attendance session
      for (const att of attendance) {
        const records = await convex.query(api.attendance.getAttendanceRecords, {
          attendanceId: att._id
        });

        if (records) {
          records
            .filter((r) => r.status === 'absent' || r.status === 'excused')
            .forEach((r) => {
              absentees.push({
                className: att.className,
                studentName: r.studentName,
                status: r.status as 'absent' | 'excused',
                remarks: r.remarks
              });
            });
        }
      }

      if (absentees.length === 0) {
        toast.success('No students were absent on this date! 🎉');
        onOpenChange(false);
        setIsGenerating(false);
        return;
      }

      generateAbsenteeReportPDF({
        schoolName,
        date: format(selectedDate, 'MMMM dd, yyyy'),
        absentees
      });

      toast.success(`Absentee report generated with ${absentees.length} student(s)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate absentee count
  const totalAbsent = attendance
    ? attendance.reduce((sum, a) => sum + a.absentCount + a.excusedCount, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Absentee Report</DialogTitle>
          <DialogDescription>
            List all students who were absent on a specific date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Absentee Info */}
          {attendance && attendance.length > 0 && (
            <div className={`border rounded-lg p-4 ${
              totalAbsent === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className={`font-medium ${
                totalAbsent === 0 ? 'text-green-900' : 'text-orange-900'
              }`}>
                {totalAbsent === 0 
                  ? '🎉 No students absent on this date!' 
                  : `${totalAbsent} student(s) absent on this date`
                }
              </p>
              {totalAbsent > 0 && (
                <p className="text-sm text-orange-700 mt-1">
                  Includes both absent and excused students
                </p>
              )}
            </div>
          )}

          {attendance && attendance.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠ No attendance records found for this date
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !attendance || attendance.length === 0}
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
