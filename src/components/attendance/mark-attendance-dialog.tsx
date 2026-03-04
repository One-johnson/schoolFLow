'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Id } from '@/../convex/_generated/dataModel';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function StudentPhoto({
  photoUrl,
  firstName,
  lastName,
}: {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <Avatar className="h-10 w-10 shrink-0">
      <AvatarImage src={photoUrl ?? undefined} alt={`${firstName} ${lastName}`} />
      <AvatarFallback className="text-sm font-medium bg-muted">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

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
}: MarkAttendanceDialogProps): React.JSX.Element {
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
    api.students.getStudentsByClassId,
    selectedClass ? { classId: selectedClass } : 'skip'
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
        markedByRole: 'admin',
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
      await updateAttendanceCounts({ attendanceId: newAttendanceId, updatedBy: adminId });

      // Complete attendance
      await completeAttendance({ attendanceId: newAttendanceId, updatedBy: adminId });

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(new Date(selectedDate + 'T12:00:00'), 'PPP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + 'T12:00:00') : undefined}
                    onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(new Date().getFullYear() - 2, 0, 1)}
                    endMonth={new Date()}
                    defaultMonth={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
                    hideNavigation
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
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
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg flex-wrap">
              <span className="text-sm font-medium">Quick Mark:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('present')}
                className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
              >
                <Check className="h-3 w-3 mr-1" />
                All Present
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('absent')}
                className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400 transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                All Absent
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('late')}
                className="border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-colors"
              >
                <Clock className="h-3 w-3 mr-1" />
                All Late
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleMarkAll('excused')}
                className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                All Excused
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
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="font-medium text-green-700">Present</div>
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              </div>
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <div className="font-medium text-red-700">Absent</div>
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              </div>
              <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                <div className="font-medium text-orange-700">Late</div>
                <div className="text-2xl font-bold text-orange-600">{lateCount}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="font-medium text-blue-700">Excused</div>
                <div className="text-2xl font-bold text-blue-600">{excusedCount}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted border border-border">
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
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <StudentPhoto
                          photoUrl={student.photoUrl}
                          firstName={student.firstName}
                          lastName={student.lastName}
                        />
                        <div className="min-w-0">
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkStudent(student._id, 'present')}
                              className={
                                studentStatuses[student._id]?.status === 'present'
                                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white'
                                  : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700 hover:border-green-300 transition-colors'
                              }
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
                              variant="outline"
                              onClick={() => handleMarkStudent(student._id, 'absent')}
                              className={
                                studentStatuses[student._id]?.status === 'absent'
                                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white'
                                  : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700 hover:border-red-300 transition-colors'
                              }
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
                              variant="outline"
                              onClick={() => handleMarkStudent(student._id, 'late')}
                              className={
                                studentStatuses[student._id]?.status === 'late'
                                  ? 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:text-white'
                                  : 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 hover:border-orange-300 transition-colors'
                              }
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
                              variant="outline"
                              onClick={() => handleMarkStudent(student._id, 'excused')}
                              className={
                                studentStatuses[student._id]?.status === 'excused'
                                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
                                  : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:border-blue-300 transition-colors'
                              }
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
          ) : selectedClass && students === undefined ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 border rounded-lg">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading students...</p>
            </div>
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
