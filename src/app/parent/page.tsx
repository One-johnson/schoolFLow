'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronRight,
  Megaphone,
  Calendar,
  Users,
  Wallet,
  AlertCircle,
  FileText,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '@/components/school-admin/stats-card';
import { ParentQuickActions } from '@/components/parent/parent-quick-actions';
import { ParentDashboardCharts } from '@/components/parent/parent-dashboard-charts';
import { ParentAttendanceRecord } from '@/components/parent/parent-attendance-record';
import { PhotoCell } from '@/components/students/photo-cell';
import type { Id } from '../../../convex/_generated/dataModel';

export default function ParentHomePage() {
  const { parent } = useParentAuth();

  const childrenForSummary =
    parent?.students?.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      className: s.className,
    })) ?? [];

  const childrenForCharts =
    parent?.students?.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
    })) ?? [];

  const dashboardSummary = useQuery(
    api.parentDashboard.getParentDashboardSummary,
    parent && childrenForSummary.length > 0
      ? { schoolId: parent.schoolId, children: childrenForSummary }
      : 'skip'
  );

  const chartsData = useQuery(
    api.parentDashboard.getParentChartsData,
    parent && childrenForCharts.length > 0
      ? { schoolId: parent.schoolId, children: childrenForCharts }
      : 'skip'
  );

  const recentAttendance = useQuery(
    api.parentDashboard.getParentRecentAttendance,
    parent && childrenForSummary.length > 0
      ? { schoolId: parent.schoolId, children: childrenForSummary, limit: 15 }
      : 'skip'
  );

  const announcements = useQuery(
    api.announcements.getPublishedForParent,
    parent
      ? {
          schoolId: parent.schoolId,
          studentClassIds: parent.students?.map((s) => s.classId) ?? [],
        }
      : 'skip'
  );

  const events = useQuery(
    api.events.getUpcomingEvents,
    parent ? { schoolId: parent.schoolId, limit: 5 } : 'skip'
  );

  const upcomingHomework = useQuery(
    api.homework.getUpcomingForParent,
    parent && (parent.students?.length ?? 0) > 0
      ? {
          schoolId: parent.schoolId,
          studentClassIds: parent.students?.map((s) => s.classId) ?? [],
          limit: 5,
        }
      : 'skip'
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

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalOutstanding = dashboardSummary?.totalOutstandingFees ?? 0;
  const eventsThisWeek = dashboardSummary?.eventsThisWeek ?? 0;
  const childrenSummary = dashboardSummary?.childrenSummary ?? [];

  const childrenWithAttendance = childrenSummary.filter(
    (c) => c.attendanceRate !== null
  );
  const avgAttendance =
    childrenWithAttendance.length > 0
      ? Math.round(
          childrenWithAttendance.reduce(
            (sum, c) => sum + (c.attendanceRate ?? 0),
            0
          ) / childrenWithAttendance.length
        )
      : null;

  const hasLowAttendance = childrenSummary.some(
    (c) => c.attendanceRate !== null && c.attendanceRate < 80
  );
  const hasNewReportCards = childrenSummary.some((c) => c.hasNewReportCard);
  const hasAlerts =
    totalOutstanding > 0 || hasLowAttendance || hasNewReportCards;

  return (
    <div className="space-y-8 py-6">
      {/* Hero / Welcome */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-600/25 dark:via-emerald-600/10 p-6 border border-emerald-500/20 shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting()}, {parent.name?.split(' ')[0] || 'Parent'}
          </h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                {totalOutstanding > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Outstanding fees:</span>{' '}
                    GHS {totalOutstanding.toFixed(2)} due.{' '}
                    <Link
                      href="/parent/fees"
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      View fees
                    </Link>
                  </p>
                )}
                {hasLowAttendance && (
                  <p className="text-sm">
                    <span className="font-medium">Low attendance:</span> One or
                    more children have attendance below 80%.{' '}
                    <Link
                      href="/parent/children"
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      View details
                    </Link>
                  </p>
                )}
                {hasNewReportCards && (
                  <p className="text-sm">
                    <span className="font-medium">New report cards:</span>{' '}
                    Available for download.{' '}
                    <Link
                      href="/parent/children"
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      View details
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Children"
          value={parent.students?.length ?? 0}
          icon={Users}
          loading={dashboardSummary === undefined}
          colorClass="text-blue-600"
        />
        <StatsCard
          title="Avg. Attendance"
          value={
            avgAttendance !== null ? `${avgAttendance}%` : '—'
          }
          icon={ClipboardCheck}
          loading={dashboardSummary === undefined}
          colorClass="text-emerald-600"
        />
        <StatsCard
          title="Outstanding"
          value={
            totalOutstanding > 0
              ? `GHS ${totalOutstanding.toFixed(0)}`
              : 'Paid'
          }
          icon={Wallet}
          loading={dashboardSummary === undefined}
          colorClass={
            totalOutstanding > 0 ? 'text-amber-600' : 'text-emerald-600'
          }
        />
        <StatsCard
          title="Events this week"
          value={eventsThisWeek}
          icon={Calendar}
          loading={dashboardSummary === undefined}
          colorClass="text-orange-600"
        />
      </div>

      {/* Charts */}
      {parent.students && parent.students.length > 0 && (
        <ParentDashboardCharts
          attendanceTrend={chartsData?.attendanceTrend ?? []}
          performanceByTerm={chartsData?.performanceByTerm ?? []}
          loading={chartsData === undefined}
        />
      )}

      {/* Attendance Record */}
      {parent.students && parent.students.length > 0 && (
        <ParentAttendanceRecord
          records={recentAttendance ?? []}
          loading={recentAttendance === undefined}
          firstChildId={parent.students?.[0]?.id}
          studentPhotos={Object.fromEntries(
            parent.students.map((s) => [s.id, s.photoStorageId])
          )}
        />
      )}

      {/* My Children + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Children
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/children">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {parent.students && parent.students.length > 0 ? (
              <div className="space-y-3">
                {parent.students.map((student) => {
                  const summary = childrenSummary.find(
                    (s) =>
                      s.id === student.id || s.studentId === student.studentId
                  );
                  return (
                    <Link
                      key={student.id}
                      href={`/parent/children/${student.id}`}
                      className="flex items-center justify-between gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PhotoCell
                          photoStorageId={student.photoStorageId as Id<'_storage'> | undefined}
                          firstName={student.firstName}
                          lastName={student.lastName}
                        />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.className}
                          </p>
                          {summary && (
                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                            {summary.attendanceRate !== null && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <ClipboardCheck className="h-3 w-3" />
                                {summary.attendanceRate}% attendance
                              </span>
                            )}
                            {summary.latestGrade && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                Grade: {summary.latestGrade}
                              </span>
                            )}
                            <span
                              className={
                                summary.feeStatus === 'Paid'
                                  ? 'text-emerald-600 font-medium'
                                  : 'text-amber-600 font-medium'
                              }
                            >
                              {summary.feeStatus}
                            </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No children linked to your account.
              </p>
            )}
          </CardContent>
        </Card>

        <ParentQuickActions firstChildId={parent.students?.[0]?.id} />
      </div>

      {/* Announcements + Events + Homework */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/announcements">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {announcements === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : announcements.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No announcements at the moment.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((a) => (
                  <Link
                    key={a._id}
                    href="/parent/announcements"
                    className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {a.content}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Homework
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/homework">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingHomework === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : upcomingHomework.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming homework.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingHomework.map((hw) => (
                  <Link
                    key={hw._id}
                    href="/parent/homework"
                    className="block p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{hw.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hw.className}
                      {hw.subjectName && ` • ${hw.subjectName}`} • Due{' '}
                      {new Date(hw.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/events">
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {events === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link
                    key={event._id}
                    href="/parent/events"
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{event.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventDate(event.startDate)}
                        {event.eventType && (
                          <span className="ml-2 capitalize">
                            {event.eventType.replace('_', ' ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
