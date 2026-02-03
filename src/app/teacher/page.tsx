'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  Bell,
  TrendingUp,
  AlertTriangle,
  Award,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
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
    teacher ? { schoolId: teacher.schoolId, teacherId: teacher.teacherId } : 'skip'
  );

  // Fetch upcoming events
  const events = useQuery(
    api.events.getUpcomingEvents,
    teacher ? { schoolId: teacher.schoolId, limit: 5 } : 'skip'
  );

  // Fetch published announcements
  const announcements = useQuery(
    api.announcements.getBySchool,
    teacher ? { schoolId: teacher.schoolId, status: 'published' } : 'skip'
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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      holiday: 'bg-green-100 text-green-700',
      exam: 'bg-red-100 text-red-700',
      sports: 'bg-blue-100 text-blue-700',
      parent_meeting: 'bg-amber-100 text-amber-700',
      assembly: 'bg-purple-100 text-purple-700',
      cultural: 'bg-pink-100 text-pink-700',
      field_trip: 'bg-cyan-100 text-cyan-700',
      workshop: 'bg-lime-100 text-lime-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || colors.other;
  };

  // Calculate student statistics
  const activeStudents = students?.filter(
    (s) => s.status === 'continuing' || s.status === 'fresher' || s.status === 'active'
  ).length ?? 0;

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
        {teacher.classNames && teacher.classNames.length > 0 && (
          <Badge variant="secondary" className="mt-2">
            Class Teacher: {teacher.classNames.join(', ')}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students?.length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeStudents}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{timetables?.length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Timetables</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events?.length ?? '-'}</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/teacher/attendance">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
          </Link>
          <Link href="/teacher/gradebook">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xs">Grade Book</span>
            </Button>
          </Link>
          <Link href="/teacher/messages">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Messages</span>
            </Button>
          </Link>
          <Link href="/teacher/reports">
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <Award className="h-6 w-6" />
              <span className="text-xs">Report Cards</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Student Highlights */}
      {students && students.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Students</CardTitle>
              <Link href="/teacher/students">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-2">
                {students.slice(0, 8).map((student) => (
                  <div
                    key={student._id}
                    className="flex flex-col items-center gap-2 min-w-[80px]"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={student.photoUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate max-w-[80px]">
                        {student.firstName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Events
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!events ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 4).map((event) => (
                <div
                  key={event._id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-center"
                    style={{ backgroundColor: event.color ? `${event.color}20` : undefined }}
                  >
                    <span className="text-xs font-medium">
                      {formatEventDate(event.startDate).split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold">
                      {formatEventDate(event.startDate).split(' ')[1]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.eventTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType.replace('_', ' ')}
                      </Badge>
                      {event.location && (
                        <span className="text-xs text-muted-foreground truncate">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </CardTitle>
            <Link href="/teacher/notifications">
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!announcements ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement._id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {announcement.targetType}
                    </Badge>
                  </div>
                  {announcement.publishedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
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
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No timetable assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timetables.slice(0, 4).map((timetable) => (
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
                  <Badge variant="secondary" className="text-xs">
                    {timetable.status}
                  </Badge>
                </div>
              ))}
              {timetables.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{timetables.length - 4} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      {students && students.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Class Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Class Overview</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{students.length}</p>
                <p className="text-xs text-blue-600">Total enrolled students</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Active Students</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{activeStudents}</p>
                <p className="text-xs text-green-600">
                  {students.length > 0
                    ? `${Math.round((activeStudents / students.length) * 100)}% of class`
                    : '0% of class'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
