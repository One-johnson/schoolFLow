'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Edit, Trash2, Eye, Lock, Unlock, MoreHorizontal } from 'lucide-react';
import { SessionBadge } from './session-badge';
import { ViewAttendanceDialog } from './view-attendance-dialog';
import { EditAttendanceDialog } from './edit-attendance-dialog';
import { DeleteAttendanceDialog } from './delete-attendance-dialog';
import { LockAttendanceDialog } from './lock-attendance-dialog';
import { UnlockAttendanceDialog } from './unlock-attendance-dialog';
import type { Id } from '@/../convex/_generated/dataModel';

interface AttendanceRecord {
  _id: Id<'attendance'>;
  _creationTime: number;
  schoolId: string;
  attendanceCode: string;
  classId: string;
  className: string;
  date: string;
  session: 'morning' | 'afternoon' | 'full_day';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  status: 'pending' | 'completed' | 'locked';
  markedBy: string;
  markedByName: string;
  markedByRole?: 'admin' | 'teacher';
  markedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecordsTabProps {
  schoolId: string;
  adminId: string;
  adminName: string;
}

export function AttendanceRecordsTab({ schoolId, adminId, adminName }: AttendanceRecordsTabProps): React.JSX.Element {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showLockDialog, setShowLockDialog] = useState<boolean>(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState<boolean>(false);

  const attendance = useQuery(
    api.attendance.getAttendanceBySchool,
    { schoolId }
  );

  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });

  const filteredAttendance = attendance?.filter((record) => {
    if (dateRange?.from && record.date < format(dateRange.from, 'yyyy-MM-dd')) return false;
    if (dateRange?.to && record.date > format(dateRange.to, 'yyyy-MM-dd')) return false;
    if (selectedClass !== 'all' && record.classId !== selectedClass) return false;
    if (selectedStatus !== 'all' && record.status !== selectedStatus) return false;
    return true;
  });

  const columns: Array<ColumnDef<AttendanceRecord>> = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'session',
      header: 'Session',
      cell: ({ row }) => <SessionBadge session={row.original.session} />,
    },
    {
      header: 'Attendance',
      cell: ({ row }) => {
        const { presentCount, totalStudents } = row.original;
        const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{presentCount}/{totalStudents}</span>
            <Badge variant="outline">{rate}%</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
          pending: { label: 'Pending', variant: 'secondary' },
          completed: { label: 'Completed', variant: 'default' },
          locked: { label: 'Locked', variant: 'outline' },
        };
        const { label, variant } = statusConfig[row.original.status as keyof typeof statusConfig];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'markedByName',
      header: 'Marked by',
      cell: ({ row }) => {
        const { markedByName, markedByRole } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{markedByName}</span>
            {markedByRole === 'admin' && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                Admin
              </Badge>
            )}
            {markedByRole === 'teacher' && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                Teacher
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRecord(row.original);
                  setShowViewDialog(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {row.original.status !== 'locked' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRecord(row.original);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Records
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.original.status === 'completed' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRecord(row.original);
                    setShowLockDialog(true);
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Attendance
                </DropdownMenuItem>
              )}
              {row.original.status === 'locked' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedRecord(row.original);
                    setShowUnlockDialog(true);
                  }}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock Attendance
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedRecord(row.original);
                  setShowDeleteDialog(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
        <CardDescription>
          View and manage all attendance records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {filteredAttendance && (
<DataTable
          storageKey="attendance-records"
          columns={columns}
          data={filteredAttendance}
            searchKey="className"
            searchPlaceholder="Search by class..."
          />
        )}
      </CardContent>

      {/* Dialogs */}
      {selectedRecord && (
        <>
          <ViewAttendanceDialog
            attendanceId={selectedRecord._id}
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
          />
          <EditAttendanceDialog
            attendanceId={selectedRecord._id}
            schoolId={schoolId}
            adminId={adminId}
            adminName={adminName}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <DeleteAttendanceDialog
            attendanceId={selectedRecord._id}
            attendanceCode={selectedRecord.attendanceCode}
            className={selectedRecord.className}
            adminId={adminId}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          />
          <LockAttendanceDialog
            attendanceId={selectedRecord._id}
            attendanceCode={selectedRecord.attendanceCode}
            adminId={adminId}
            open={showLockDialog}
            onOpenChange={setShowLockDialog}
          />
          <UnlockAttendanceDialog
            attendanceId={selectedRecord._id}
            attendanceCode={selectedRecord.attendanceCode}
            adminId={adminId}
            open={showUnlockDialog}
            onOpenChange={setShowUnlockDialog}
          />
        </>
      )}
    </Card>
  );
}
