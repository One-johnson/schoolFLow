'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useOnlineStatus } from '@/components/teacher/offline-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Save, Users, Check, X, Clock, AlertCircle } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

const statusButtons: { status: AttendanceStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'present', label: 'P', icon: Check, color: 'bg-green-100 text-green-700 border-green-300' },
  { status: 'absent', label: 'A', icon: X, color: 'bg-red-100 text-red-700 border-red-300' },
  { status: 'late', label: 'L', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { status: 'excused', label: 'E', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

export default function TeacherAttendancePage() {
  const { teacher } = useTeacherAuth();
  const isOnline = useOnlineStatus();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState<'morning' | 'afternoon' | 'full_day'>('full_day');
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const classId = teacher?.classIds?.[0];

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const classes = useQuery(
    api.teachers.getTeacherClasses,
    teacher ? { teacherId: teacher.id } : 'skip'
  );

  const currentClass = classes?.find((c) => c._id === classId);

  const createAttendance = useMutation(api.attendance.createAttendance);
  const markStudentAttendance = useMutation(api.attendance.markStudentAttendance);
  const updateAttendanceCounts = useMutation(api.attendance.updateAttendanceCounts);
  const completeAttendance = useMutation(api.attendance.completeAttendance);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const newAttendance = new Map(attendance);
    newAttendance.set(studentId, status);
    setAttendance(newAttendance);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!students) return;
    const newAttendance = new Map<string, AttendanceStatus>();
    students.forEach((student) => {
      newAttendance.set(student._id, status);
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!isOnline) {
      toast.error('You must be online to save attendance');
      return;
    }

    if (!teacher || !classId || !currentClass || !students) {
      toast.error('Unable to save attendance. Please try again.');
      return;
    }

    if (attendance.size === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    setIsSaving(true);
    try {
      const markedByName = `${teacher.firstName} ${teacher.lastName}`;

      // Create attendance session
      const result = await createAttendance({
        schoolId: teacher.schoolId,
        classId: classId,
        className: currentClass.className,
        date: selectedDate,
        session: session,
        totalStudents: students.length,
        markedBy: teacher.id,
        markedByName: markedByName,
      });

      // Mark each student's attendance
      for (const [studentId, status] of attendance.entries()) {
        const student = students.find((s) => s._id === studentId);
        if (student) {
          await markStudentAttendance({
            schoolId: teacher.schoolId,
            attendanceId: result,
            studentId: studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            classId: classId,
            className: currentClass.className,
            date: selectedDate,
            session: session,
            status: status,
            markedBy: teacher.id,
            markedByName: markedByName,
          });
        }
      }

      // Update counts
      await updateAttendanceCounts({
        attendanceId: result,
        updatedBy: teacher.id,
      });

      // Mark as completed
      await completeAttendance({
        attendanceId: result,
        updatedBy: teacher.id,
      });

      toast.success('Attendance saved successfully!');
      setAttendance(new Map());
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate summary
  const summary = {
    present: Array.from(attendance.values()).filter((s) => s === 'present').length,
    absent: Array.from(attendance.values()).filter((s) => s === 'absent').length,
    late: Array.from(attendance.values()).filter((s) => s === 'late').length,
    excused: Array.from(attendance.values()).filter((s) => s === 'excused').length,
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">Mark Attendance</h1>

      {/* Date and Session Selection */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Session</label>
              <Select value={session} onValueChange={(v) => setSession(v as typeof session)}>
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

          {/* Quick Mark All */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Quick Mark All</label>
            <div className="flex gap-2">
              {statusButtons.map(({ status, label, color }) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  className={`flex-1`}
                  onClick={() => handleMarkAll(status)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-lg font-bold text-green-700">{summary.present}</p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg text-center">
          <p className="text-lg font-bold text-red-700">{summary.absent}</p>
          <p className="text-xs text-red-600">Absent</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg text-center">
          <p className="text-lg font-bold text-yellow-700">{summary.late}</p>
          <p className="text-xs text-yellow-600">Late</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-lg font-bold text-blue-700">{summary.excused}</p>
          <p className="text-xs text-blue-600">Excused</p>
        </div>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students ({students?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!students ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No students in this class
            </p>
          ) : (
            students.map((student) => {
              const currentStatus = attendance.get(student._id);
              return (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                    <span className="text-sm font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {statusButtons.map(({ status, label, color }) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student._id, status)}
                        className={`w-8 h-8 rounded-md border text-xs font-bold transition-colors ${
                          currentStatus === status
                            ? color
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={isSaving || attendance.size === 0}
      >
        {isSaving ? (
          'Saving...'
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Attendance
          </>
        )}
      </Button>
    </div>
  );
}
