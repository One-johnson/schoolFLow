'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { generateAttendanceSummaryPDF } from '@/lib/pdf-generators/attendance-reports';
import type { DateRange } from 'react-day-picker';

interface AttendanceSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function AttendanceSummaryDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName,
}: AttendanceSummaryDialogProps): React.JSX.Element {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const classes = useQuery(
    api.classes.getClassesBySchool,
    { schoolId }
  );

  const classSummary = useQuery(
    api.attendance.getClassAttendanceSummary,
    selectedClassId && dateRange?.from && dateRange?.to
      ? {
          schoolId,
          classId: selectedClassId,
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd'),
        }
      : 'skip'
  );

  const selectedClass = classes?.find((c) => c._id === selectedClassId);

  const handleGenerate = async (): Promise<void> => {
    if (!selectedClassId || !dateRange?.from || !dateRange?.to || !classSummary) {
      toast.error('Please select a class and date range');
      return;
    }

    if (classSummary.length === 0) {
      toast.error('No attendance records found for this class in the selected period');
      return;
    }

    setIsGenerating(true);

    try {
      generateAttendanceSummaryPDF({
        schoolName,
        className: selectedClass?.className ?? 'Unknown Class',
        startDate: format(dateRange.from, 'MMMM dd, yyyy'),
        endDate: format(dateRange.to, 'MMMM dd, yyyy'),
        students: classSummary.map((s) => ({
          studentName: s.studentName,
          totalDays: s.totalDays,
          present: s.present,
          absent: s.absent,
          late: s.late,
          excused: s.excused,
          percentage: s.percentage,
        })),
      });

      toast.success('Attendance summary generated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalDays = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Attendance Summary</DialogTitle>
          <DialogDescription>
            Weekly/monthly summary with student statistics for a class
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              {totalDays} days in range
            </p>
          </div>

          {/* Preview Info */}
          {classSummary && classSummary.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-blue-900">Report Preview</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>Students: {classSummary.length}</div>
                <div>Date Range: {totalDays} days</div>
              </div>
            </div>
          )}

          {selectedClassId && classSummary && classSummary.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                No attendance records found for this class in the selected period
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedClassId ||
                !dateRange?.from ||
                !dateRange?.to ||
                isGenerating ||
                !classSummary ||
                classSummary.length === 0
              }
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
