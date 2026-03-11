'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export type AttendanceRecordItem = {
  _id: string;
  date: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  session: 'morning' | 'afternoon' | 'full_day';
  className?: string;
};

interface ParentAttendanceRecordProps {
  records: AttendanceRecordItem[];
  loading?: boolean;
  firstChildId?: string;
  /** Map of studentId (Convex _id) -> photoStorageId for avatar display */
  studentPhotos?: Record<string, string | undefined>;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  present: {
    label: 'Present',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
  },
  late: {
    label: 'Late',
    variant: 'outline',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
  },
  excused: {
    label: 'Excused',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  },
  absent: {
    label: 'Absent',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  },
};

const sessionLabels: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function AttendanceAvatar({
  photoStorageId,
  studentName,
}: {
  photoStorageId?: string;
  studentName: string;
}) {
  const photoUrl = useQuery(
    api.photos.getFileUrl,
    photoStorageId ? { storageId: photoStorageId as Id<'_storage'> } : 'skip'
  );
  const initials = studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={photoUrl ?? undefined} alt={studentName} />
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );
}

export function ParentAttendanceRecord({
  records,
  loading = false,
  firstChildId,
  studentPhotos,
}: ParentAttendanceRecordProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Attendance Record
          </CardTitle>
          <CardDescription>Recent attendance (last 14 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Attendance Record
          </CardTitle>
          <CardDescription>Recent attendance (last 14 days)</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={firstChildId ? `/parent/children/${firstChildId}` : '/parent/children'}>
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No attendance records yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Records will appear here once attendance is marked
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: clickable list cards */}
            <div className="space-y-3 md:hidden">
              {records.map((r) => {
                const status = statusConfig[r.status] ?? statusConfig.present;
                const photoStorageId = studentPhotos?.[r.studentId];
                return (
                  <div
                    key={r._id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AttendanceAvatar
                        photoStorageId={photoStorageId}
                        studentName={r.studentName}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.date)} • {sessionLabels[r.session] ?? r.session}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table view */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => {
                    const status = statusConfig[r.status] ?? statusConfig.present;
                    const photoStorageId = studentPhotos?.[r.studentId];
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          {formatDate(r.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AttendanceAvatar
                              photoStorageId={photoStorageId}
                              studentName={r.studentName}
                            />
                            <span>{r.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {sessionLabels[r.session] ?? r.session}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
