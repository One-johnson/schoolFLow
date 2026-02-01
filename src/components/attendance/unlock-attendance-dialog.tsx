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

interface UnlockAttendanceDialogProps {
  attendanceId: Id<'attendance'>;
  attendanceCode: string;
  open: boolean;
  adminId: string;
  onOpenChange: (open: boolean) => void;
}

export function UnlockAttendanceDialog({
  attendanceId,
  attendanceCode,
  adminId,
  open,
  onOpenChange,
}: UnlockAttendanceDialogProps): JSX.Element {
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const unlockAttendance = useMutation(api.attendance.unlockAttendance);

  const handleUnlock = async (): Promise<void> => {
    setIsUnlocking(true);

    try {
      await unlockAttendance({ attendanceId, updatedBy: adminId });
      toast.success('Attendance unlocked successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error unlocking attendance:', error);
      toast.error('Failed to unlock attendance');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock Attendance?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unlock attendance record <strong>{attendanceCode}</strong>?
            This will allow the attendance to be edited again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnlocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnlock} disabled={isUnlocking}>
            {isUnlocking ? 'Unlocking...' : 'Unlock Attendance'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
