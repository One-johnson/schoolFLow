'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceStatusBadge } from './attendance-status-badge';
import { SessionBadge } from './session-badge';
import type { Id } from '@/../convex/_generated/dataModel';
import { JSX } from 'react';

interface ViewAttendanceDialogProps {
  attendanceId: Id<'attendance'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewAttendanceDialog({
  attendanceId,
  open,
  onOpenChange,
}: ViewAttendanceDialogProps): React.JSX.Element {
  const attendance = useQuery(
    api.attendance.getAttendanceById,
    attendanceId ? { attendanceId } : 'skip'
  );

  const records = useQuery(
    api.attendance.getAttendanceRecords,
    attendanceId ? { attendanceId } : 'skip'
  );

  if (!attendance) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const attendanceRate = attendance.totalStudents > 0 
    ? Math.round((attendance.presentCount / attendance.totalStudents) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] min-w-xl">
        <DialogHeader>
          <DialogTitle>Attendance Details</DialogTitle>
          <DialogDescription>
            View attendance record for {attendance.className}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Header Info */}
          <div className="grid gap-4 md:grid-cols-2 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div className="font-medium">
                {new Date(attendance.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Session</div>
              <div className="mt-1">
                <SessionBadge session={attendance.session} />
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Class</div>
              <div className="font-medium">{attendance.className}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Marked By</div>
              <div className="font-medium">{attendance.markedByName}</div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {attendance.presentCount}
              </div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {attendance.absentCount}
              </div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {attendance.lateCount}
              </div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {attendance.excusedCount}
              </div>
              <div className="text-xs text-muted-foreground">Excused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <div className="text-xs text-muted-foreground">Rate</div>
            </div>
          </div>

          {/* Notes */}
          {attendance.notes && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Notes</div>
              <div>{attendance.notes}</div>
            </div>
          )}

          {/* Student Records */}
          <div>
            <div className="font-semibold mb-2">Student Records</div>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                {records && records.length > 0 ? (
                  records.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{record.studentName}</div>
                        {record.remarks && (
                          <div className="text-sm text-muted-foreground">
                            {record.remarks}
                          </div>
                        )}
                        {record.overriddenBy && (
                          <div className="text-xs text-orange-600 mt-1">
                            Override by {record.overriddenByName}: {record.overrideReason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <AttendanceStatusBadge status={record.status} />
                        {record.arrivalTime && (
                          <Badge variant="outline" className="text-xs">
                            {record.arrivalTime}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No records found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
