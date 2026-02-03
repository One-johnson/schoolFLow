'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { useOnlineStatus } from '@/components/teacher/offline-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Calendar,
  Save,
  Users,
  Check,
  X,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  History,
  AlertTriangle,
  Pencil,
  Trash2,
  Info,
} from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('mark');
  const [isEditMode, setIsEditMode] = useState(false);

  const classId = teacher?.classIds?.[0];

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const classes = useQuery(
    api.teachers.getTeacherClasses,
    teacher ? { teacherId: teacher.id } : 'skip'
  );

  // Analytics queries
  const classStats = useQuery(
    api.attendance.getClassAttendanceStats,
    teacher && classId ? { schoolId: teacher.schoolId, classId, days: 30 } : 'skip'
  );

  const atRiskStudents = useQuery(
    api.attendance.getStudentsAtRisk,
    teacher && classId ? { schoolId: teacher.schoolId, classId, threshold: 80 } : 'skip'
  );

  const attendanceHistory = useQuery(
    api.attendance.getClassAttendanceHistory,
    teacher && classId ? { schoolId: teacher.schoolId, classId, limit: 10 } : 'skip'
  );

  // Check if attendance already exists for selected date/session
  const existingAttendance = useQuery(
    api.attendance.checkAttendanceExists,
    teacher && classId
      ? { schoolId: teacher.schoolId, classId, date: selectedDate, session }
      : 'skip'
  );

  // Get existing attendance records for edit mode
  const existingRecords = useQuery(
    api.attendance.getAttendanceForEdit,
    existingAttendance?._id ? { attendanceId: existingAttendance._id } : 'skip'
  );

  const currentClass = classes?.find((c) => c._id === classId);

  const createAttendance = useMutation(api.attendance.createAttendance);
  const markStudentAttendance = useMutation(api.attendance.markStudentAttendance);
  const updateAttendanceCounts = useMutation(api.attendance.updateAttendanceCounts);
  const completeAttendance = useMutation(api.attendance.completeAttendance);
  const updateAttendanceSession = useMutation(api.attendance.updateAttendanceSession);
  const deleteAttendance = useMutation(api.attendance.deleteAttendance);

  // Load existing attendance for edit mode
  const handleEnterEditMode = () => {
    if (existingRecords?.records) {
      const newAttendance = new Map<string, AttendanceStatus>();
      existingRecords.records.forEach((record) => {
        newAttendance.set(record.studentId, record.status);
      });
      setAttendance(newAttendance);
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setAttendance(new Map());
    setIsEditMode(false);
  };

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

      if (isEditMode && existingAttendance?._id) {
        // Update existing attendance
        const updates = Array.from(attendance.entries()).map(([studentId, status]) => ({
          studentId,
          status,
        }));

        await updateAttendanceSession({
          attendanceId: existingAttendance._id,
          updates,
          updatedBy: teacher.id,
        });

        toast.success('Attendance updated successfully!');
        setAttendance(new Map());
        setIsEditMode(false);
      } else {
        // Create new attendance
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

        await updateAttendanceCounts({
          attendanceId: result,
          updatedBy: teacher.id,
        });

        await completeAttendance({
          attendanceId: result,
          updatedBy: teacher.id,
        });

        toast.success('Attendance saved successfully!');
        setAttendance(new Map());
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOnline) {
      toast.error('You must be online to delete attendance');
      return;
    }

    if (!teacher || !existingAttendance?._id) {
      toast.error('No attendance to delete');
      return;
    }

    if (!confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAttendance({
        attendanceId: existingAttendance._id,
        deletedBy: teacher.id,
      });

      toast.success('Attendance deleted successfully!');
      setAttendance(new Map());
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to delete attendance:', error);
      toast.error('Failed to delete attendance. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const summary = {
    present: Array.from(attendance.values()).filter((s) => s === 'present').length,
    absent: Array.from(attendance.values()).filter((s) => s === 'absent').length,
    late: Array.from(attendance.values()).filter((s) => s === 'late').length,
    excused: Array.from(attendance.values()).filter((s) => s === 'excused').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          {teacher.classNames?.[0] && (
            <p className="text-sm text-muted-foreground">{teacher.classNames[0]}</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mark" className="gap-2">
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Mark</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Mark Attendance Tab */}
        <TabsContent value="mark" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setAttendance(new Map());
                      setIsEditMode(false);
                    }}
                    className="w-full h-10 px-3 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Session</label>
                  <Select
                    value={session}
                    onValueChange={(v) => {
                      setSession(v as typeof session);
                      setAttendance(new Map());
                      setIsEditMode(false);
                    }}
                  >
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

              {/* Existing attendance alert */}
              {existingAttendance && !isEditMode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-700">
                        Attendance already recorded
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Marked by {existingAttendance.markedByName} • {existingAttendance.presentCount} present, {existingAttendance.absentCount} absent
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={handleEnterEditMode}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit mode banner */}
              {isEditMode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Edit Mode</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-amber-600"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Only show quick mark if no existing attendance or in edit mode */}
              {(!existingAttendance || isEditMode) && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Quick Mark All</label>
                  <div className="flex gap-2">
                    {statusButtons.map(({ status, label }) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleMarkAll(status)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Only show student list when creating new attendance or in edit mode */}
          {(!existingAttendance || isEditMode) && (
            <>
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
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {student.firstName[0]}
                                {student.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
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

              <Button
                className="w-full"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || attendance.size === 0}
              >
                {isSaving ? (
                  'Saving...'
                ) : isEditMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Attendance
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Attendance
                  </>
                )}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classStats?.attendanceRate || 0}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classStats?.totalSessions || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Last 30 Days Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Present</span>
                    <span className="font-medium text-green-600">{classStats?.totalPresent || 0}</span>
                  </div>
                  <Progress
                    value={classStats?.totalMarked ? (classStats.totalPresent / classStats.totalMarked) * 100 : 0}
                    className="h-2 bg-green-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Absent</span>
                    <span className="font-medium text-red-600">{classStats?.totalAbsent || 0}</span>
                  </div>
                  <Progress
                    value={classStats?.totalMarked ? (classStats.totalAbsent / classStats.totalMarked) * 100 : 0}
                    className="h-2 bg-red-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Late</span>
                    <span className="font-medium text-yellow-600">{classStats?.totalLate || 0}</span>
                  </div>
                  <Progress
                    value={classStats?.totalMarked ? (classStats.totalLate / classStats.totalMarked) * 100 : 0}
                    className="h-2 bg-yellow-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Excused</span>
                    <span className="font-medium text-blue-600">{classStats?.totalExcused || 0}</span>
                  </div>
                  <Progress
                    value={classStats?.totalMarked ? (classStats.totalExcused / classStats.totalMarked) * 100 : 0}
                    className="h-2 bg-blue-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Trend (Mini Chart) */}
          {classStats?.dailyData && classStats.dailyData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-24">
                  {classStats.dailyData.slice(-14).map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${day.rate}%` }}
                        title={`${formatDate(day.date)}: ${day.rate}%`}
                      />
                      <span className="text-[8px] text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* At-Risk Students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Students At Risk
                <Badge variant="secondary" className="ml-auto">
                  {atRiskStudents?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!atRiskStudents ? (
                <Skeleton className="h-20 w-full" />
              ) : atRiskStudents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Check className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No students at risk</p>
                  <p className="text-xs">All students have 80%+ attendance</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {atRiskStudents.slice(0, 5).map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-3 border rounded-lg bg-amber-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                            {student.studentName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.absent} absent of {student.totalDays} days
                          </p>
                        </div>
                      </div>
                      <Badge variant={student.attendanceRate < 60 ? 'destructive' : 'secondary'}>
                        {student.attendanceRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!attendanceHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attendance records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceHistory.map((record) => (
                    <div
                      key={record._id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{formatDate(record.date)}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {record.session.replace('_', ' ')} Session
                          </p>
                        </div>
                        <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-sm font-bold text-green-700">{record.presentCount}</p>
                          <p className="text-[10px] text-green-600">Present</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <p className="text-sm font-bold text-red-700">{record.absentCount}</p>
                          <p className="text-[10px] text-red-600">Absent</p>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded">
                          <p className="text-sm font-bold text-yellow-700">{record.lateCount}</p>
                          <p className="text-[10px] text-yellow-600">Late</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-sm font-bold text-blue-700">{record.excusedCount}</p>
                          <p className="text-[10px] text-blue-600">Excused</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Marked by {record.markedByName}</span>
                        <span>•</span>
                        <span>{record.totalStudents} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
