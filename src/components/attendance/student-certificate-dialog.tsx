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
import { generateStudentCertificatePDF } from '@/lib/pdf-generators/attendance-reports';
import type { DateRange } from 'react-day-picker';

interface StudentCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function StudentCertificateDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName
}: StudentCertificateDialogProps): React.JSX.Element {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const students = useQuery(
    api.students.getStudentsBySchool,
    { schoolId }
  );

  const studentAttendance = useQuery(
    api.attendance.getStudentAttendanceRate,
    selectedStudentId && dateRange?.from && dateRange?.to
      ? {
          schoolId,
          studentId: selectedStudentId
        }
      : 'skip'
  );

  const handleGenerate = async (): Promise<void> => {
    if (!selectedStudentId || !dateRange?.from || !dateRange?.to || !studentAttendance) {
      toast.error('Please select a student and date range');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedStudent = students?.find((s) => s._id === selectedStudentId);

      if (!selectedStudent) {
        toast.error('Student not found');
        return;
      }

      const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;

      generateStudentCertificatePDF({
        schoolName,
        studentName: selectedStudent.firstName + (selectedStudent.lastName ? ` ${selectedStudent.lastName}` : ''),
        className: selectedStudent.classId || '',
        startDate: format(dateRange.from, 'MMMM dd, yyyy'),
        endDate: format(dateRange.to, 'MMMM dd, yyyy'),
        totalDays,
        present: studentAttendance.present,
        absent: studentAttendance.absent,
        late: studentAttendance.late,
        excused: studentAttendance.excused,
        percentage: studentAttendance.attendanceRate
      });

      toast.success('Student certificate generated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Student Attendance Certificate</DialogTitle>
          <DialogDescription>
            Create a certificate showing a student's attendance record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student._id} value={student._id}>
                    {student.firstName} - {student.className}
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
          </div>

          {/* Attendance Preview */}
          {studentAttendance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-medium text-blue-900">Attendance Preview</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>Present: {studentAttendance.present}</div>
                <div>Absent: {studentAttendance.absent}</div>
                <div>Late: {studentAttendance.late}</div>
                <div>Excused: {studentAttendance.excused}</div>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <p className="font-semibold text-blue-900">
                  Attendance Rate: {studentAttendance.attendanceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedStudentId || !dateRange?.from || !dateRange?.to || isGenerating}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
