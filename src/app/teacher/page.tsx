'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ClipboardCheck, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function TeacherHomePage() {
  const { teacher } = useTeacherAuth();

  // Get the first class the teacher manages (primary class)
  const classId = teacher?.classIds?.[0];

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const timetables = useQuery(
    api.timetables.getTimetablesByTeacher,
    teacher ? { schoolId: teacher.schoolId, teacherId: teacher.id } : 'skip'
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dayOfWeek = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {teacher.firstName}
        </h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students?.length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{timetables?.length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Timetables</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/teacher/attendance">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
          </Link>
          <Link href="/teacher/students">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">View Students</span>
            </Button>
          </Link>
          <Link href="/teacher/reports">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xs">Report Cards</span>
            </Button>
          </Link>
          <Link href="/teacher/profile">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-xs">My Profile</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Today's Classes (from timetable) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!timetables ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : timetables.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No timetable assigned yet
            </p>
          ) : (
            <div className="space-y-2">
              {timetables.slice(0, 3).map((timetable) => (
                <div
                  key={timetable._id}
                  className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{timetable.className}</p>
                    <p className="text-xs text-muted-foreground">
                      Class ID: {timetable.classId.slice(-6)}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {timetable.status}
                  </span>
                </div>
              ))}
              {timetables.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{timetables.length - 3} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
