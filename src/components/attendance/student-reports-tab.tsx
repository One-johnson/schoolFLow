'use client';

import { JSX, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AttendanceStatusBadge } from './attendance-status-badge';
import { Progress } from '@/components/ui/progress';

interface StudentReportsTabProps {
  schoolId: string;
}

export function StudentReportsTab({ schoolId }: StudentReportsTabProps): JSX.Element {
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const students = useQuery(api.students.getStudentsBySchool, { schoolId });

  const studentAttendance = useQuery(
    api.attendance.getStudentAttendanceHistory,
    selectedStudent ? { schoolId, studentId: selectedStudent } : 'skip'
  );

  const studentRate = useQuery(
    api.attendance.getStudentAttendanceRate,
    selectedStudent ? { schoolId, studentId: selectedStudent } : 'skip'
  );

  const selectedStudentData = students?.find((s) => s._id === selectedStudent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Attendance Reports</CardTitle>
        <CardDescription>
          View detailed attendance history and statistics for individual students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Selection */}
        <div className="space-y-2">
          <Label>Select Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} - {student.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Student Info & Stats */}
        {selectedStudentData && studentRate && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">
                      {selectedStudentData.firstName} {selectedStudentData.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student ID:</span>
                    <span className="font-medium">{selectedStudentData.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium">{selectedStudentData.className}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {studentRate.attendanceRate}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Overall Attendance
                    </p>
                  </div>
                  <Progress value={studentRate.attendanceRate} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Statistics Grid */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold">{studentRate.totalDays}</div>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-green-600">{studentRate.present}</div>
                  <p className="text-sm text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-red-600">{studentRate.absent}</div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{studentRate.late}</div>
                  <p className="text-sm text-muted-foreground">Late</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">{studentRate.excused}</div>
                  <p className="text-sm text-muted-foreground">Excused</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {studentAttendance && studentAttendance.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {studentAttendance
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((record) => (
                        <div
                          key={record._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.session.replace('_', ' ').toUpperCase()}
                              {record.remarks && ` - ${record.remarks}`}
                            </div>
                          </div>
                          <AttendanceStatusBadge status={record.status} />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedStudent && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Select a student to view their attendance report</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
