'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Id } from '@/../convex/_generated/dataModel';

interface LockAttendanceDialogProps {
  attendanceId: Id<'attendance'>;
  attendanceCode: string;
  open: boolean;
  adminId: string;
  onOpenChange: (open: boolean) => void;
}

export function LockAttendanceDialog({
  attendanceId,
  attendanceCode,
  adminId,
  open,
  onOpenChange,
}: LockAttendanceDialogProps): JSX.Element {
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const lockAttendance = useMutation(api.attendance.lockAttendance);

  const handleLock = async (): Promise<void> => {
    setIsLocking(true);

    try {
      await lockAttendance({ attendanceId, updatedBy: adminId });
      toast.success('Attendance locked successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error locking attendance:', error);
      toast.error('Failed to lock attendance');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lock Attendance?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to lock attendance record <strong>{attendanceCode}</strong>?
            Locked attendance records cannot be edited unless explicitly unlocked by an admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLock} disabled={isLocking}>
            {isLocking ? 'Locking...' : 'Lock Attendance'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
