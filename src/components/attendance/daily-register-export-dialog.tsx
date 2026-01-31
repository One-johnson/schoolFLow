'use client';

import { JSX, useState } from 'react';
import { useQuery, useConvex } from 'convex/react';
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateDailyRegisterPDF } from '@/lib/pdf-generators/attendance-reports';

interface DailyRegisterExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export function DailyRegisterExportDialog({
  open,
  onOpenChange,
  schoolId,
  schoolName
}: DailyRegisterExportDialogProps): JSX.Element {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState<string>('full_day');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const classes = useQuery(
    api.classes.getClassesBySchool,
    { schoolId }
  );

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const allAttendance = useQuery(
    api.attendance.getAttendanceByDate,
    selectedDate
      ? {
          schoolId,
          startDate: dateStr,
          endDate: dateStr
        }
      : 'skip'
  );

  // Filter by class and session
  const attendance = allAttendance?.filter(
    (a) => a.classId === selectedClassId && a.session === selectedSession
  );

  const convex = useConvex();

  const handleGenerate = async (): Promise<void> => {
    if (!selectedClassId || !attendance || attendance.length === 0) {
      toast.error('Please select a class and date with attendance records');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedClass = classes?.find((c) => c._id === selectedClassId);
      const attendanceData = attendance[0];

      // Get all attendance records for this session using Convex client
      const records = await convex.query(
        api.attendance.getAttendanceRecords,
        { attendanceId: attendanceData._id }
      );

      if (!records || records.length === 0) {
        toast.error('No attendance records found');
        return;
      }

      generateDailyRegisterPDF({
        schoolName,
        className: selectedClass?.className || 'Unknown Class',
        date: format(selectedDate, 'MMMM dd, yyyy'),
        session: selectedSession.replace('_', ' ').toUpperCase(),
        records: records.map((r) => ({
          studentName: r.studentName,
          status: r.status,
          arrivalTime: r.arrivalTime,
          remarks: r.remarks
        })),
        presentCount: attendanceData.presentCount,
        absentCount: attendanceData.absentCount,
        lateCount: attendanceData.lateCount,
        excusedCount: attendanceData.excusedCount,
        totalStudents: attendanceData.totalStudents
      });

      toast.success('Daily register exported successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Daily Attendance Register</DialogTitle>
          <DialogDescription>
            Generate a printable attendance register for a specific class and date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((classItem) => (
                  <SelectItem key={classItem._id} value={classItem._id}>
                    {classItem.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Session Selection */}
          <div className="space-y-2">
            <Label>Session</Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="full_day">Full Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendance Info */}
          {attendance && attendance.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✓ Attendance records found for this date
              </p>
            </div>
          )}

          {attendance && attendance.length === 0 && selectedClassId && (
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
              disabled={!selectedClassId || isGenerating || !attendance || attendance.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
