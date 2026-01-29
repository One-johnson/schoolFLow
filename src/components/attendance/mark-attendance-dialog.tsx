'use client';

import { useState, useEffect, JSX } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Id } from '@/../convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarkAttendanceDialogProps {
  schoolId: string;
  adminId: string;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkAttendanceDialog({
  schoolId,
  adminId,
  adminName,
  open,
  onOpenChange,
}: MarkAttendanceDialogProps): JSX.Element {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon' | 'full_day'>('full_day');
  const [notes, setNotes] = useState<string>('');
  const [studentStatuses, setStudentStatuses] = useState<Record<string, { status: string; arrivalTime?: string; remarks?: string }>>({});
  const [attendanceId, setAttendanceId] = useState<Id<'attendance'> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const classes = useQuery(
    api.classes.getClassesBySchool,
    schoolId ? { schoolId } : 'skip'
  );

  const students = useQuery(
    api.students.getStudentsBySchool,
    selectedClass ? { schoolId } : 'skip'
  );

  const createAttendance = useMutation(api.attendance.createAttendance);
  const markStudentAttendance = useMutation(api.attendance.markStudentAttendance);
  const updateAttendanceCounts = useMutation(api.attendance.updateAttendanceCounts);
  const completeAttendance = useMutation(api.attendance.completeAttendance);

  const selectedClassData = classes?.find((c) => c._id === selectedClass);

  useEffect(() => {
    if (students) {
      const initialStatuses: Record<string, { status: string }> = {};
      students.forEach((student) => {
        initialStatuses[student._id] = { status: '' };
      });
      setStudentStatuses(initialStatuses);
    }
  }, [students]);

  const handleMarkAll = (status: string): void => {
    if (!students) return;
    const newStatuses: Record<string, { status: string }> = {};
    students.forEach((student) => {
      newStatuses[student._id] = { status };
    });
    setStudentStatuses(newStatuses);
  };

  const handleMarkStudent = (studentId: string, status: string): void => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedClass || !selectedClassData) {
      toast.error('Please select a class');
      return;
    }

    if (!students || students.length === 0) {
      toast.error('No students found in this class');
      return;
    }

    const markedCount = Object.values(studentStatuses).filter((s) => s.status).length;
    if (markedCount === 0) {
      toast.error('Please mark at least one student');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create attendance session
      const newAttendanceId = await createAttendance({
        schoolId,
        classId: selectedClass,
        className: selectedClassData.className,
        date: selectedDate,
        session: selectedSession,
        totalStudents: students.length,
        markedBy: adminId,
        markedByName: adminName,
        notes: notes || undefined,
      });

      setAttendanceId(newAttendanceId);

      // Mark each student
      for (const student of students) {
        const studentStatus = studentStatuses[student._id];
        if (studentStatus?.status) {
          await markStudentAttendance({
            attendanceId: newAttendanceId,
            schoolId,
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            classId: selectedClass,
            className: selectedClassData.className,
            date: selectedDate,
            session: selectedSession,
            status: studentStatus.status as 'present' | 'absent' | 'late' | 'excused',
            arrivalTime: studentStatus.arrivalTime,
            remarks: studentStatus.remarks,
            markedBy: adminId,
            markedByName: adminName,
          });
        }
      }

      // Update counts
      await updateAttendanceCounts({ attendanceId: newAttendanceId });

      // Complete attendance
      await completeAttendance({ attendanceId: newAttendanceId });

      toast.success('Attendance marked successfully');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (): void => {
    setSelectedClass('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedSession('full_day');
    setNotes('');
    setStudentStatuses({});
    setAttendanceId(null);
  };

  const presentCount = Object.values(studentStatuses).filter((s) => s.status === 'present').length;
  const absentCount = Object.values(studentStatuses).filter((s) => s.status === 'absent').length;
  const lateCount = Object.values(studentStatuses).filter((s) => s.status === 'late').length;
  const excusedCount = Object.values(studentStatuses).filter((s) => s.status === 'excused').length;
  const markedCount = presentCount + absentCount + lateCount + excusedCount;
  const attendanceRate = students && students.length > 0 
    ? Math.round((presentCount / students.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Select class and mark attendance for each student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Class and Date Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    ?.filter((c) => c.status === 'active')
                    .map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.className} ({cls.currentStudentCount} students)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={(value: string) => setSelectedSession(value as typeof selectedSession)}>
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
          </div>

          {/* Quick Actions */}
          {students && students.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Quick Mark:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('present')}
                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
              >
                <Check className="h-3 w-3 mr-1" />
                All Present
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('absent')}
                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                All Absent
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('')}
                className="hover:bg-gray-100 transition-colors"
              >
                Reset
              </Button>
            </div>
          )}

          {/* Summary */}
          {students && students.length > 0 && markedCount > 0 && (
            <div className="grid grid-cols-5 gap-2 p-3 bg-muted rounded-lg text-sm">
              <div>
                <div className="font-medium">Present</div>
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              </div>
              <div>
                <div className="font-medium">Absent</div>
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              </div>
              <div>
                <div className="font-medium">Late</div>
                <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
              </div>
              <div>
                <div className="font-medium">Excused</div>
                <div className="text-2xl font-bold text-blue-600">{excusedCount}</div>
              </div>
              <div>
                <div className="font-medium">Rate</div>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
              </div>
            </div>
          )}

          {/* Student List */}
          {students && students.length > 0 ? (
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                <TooltipProvider>
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.studentId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant={studentStatuses[student._id]?.status === 'present' ? 'default' : 'outline'}
                              onClick={() => handleMarkStudent(student._id, 'present')}
                              className="hover:bg-green-600 hover:text-white transition-colors"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Present</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant={studentStatuses[student._id]?.status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => handleMarkStudent(student._id, 'absent')}
                              className="hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Absent</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant={studentStatuses[student._id]?.status === 'late' ? 'secondary' : 'outline'}
                              onClick={() => handleMarkStudent(student._id, 'late')}
                              className="hover:bg-yellow-600 hover:text-white transition-colors"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Late</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant={studentStatuses[student._id]?.status === 'excused' ? 'secondary' : 'outline'}
                              onClick={() => handleMarkStudent(student._id, 'excused')}
                              className="hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              <AlertCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Excused</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </TooltipProvider>
              </div>
            </ScrollArea>
          ) : selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found in this class
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Please select a class to begin
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add any notes about today's attendance..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || markedCount === 0}>
            {isSubmitting ? 'Saving...' : 'Save & Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
