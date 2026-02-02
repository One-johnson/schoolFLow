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

interface DeleteAttendanceDialogProps {
  attendanceId: Id<'attendance'>;
  attendanceCode: string;
  className: string;
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAttendanceDialog({
  attendanceId,
  attendanceCode,
  className,
  adminId,
  open,
  onOpenChange,
}: DeleteAttendanceDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteAttendance = useMutation(api.attendance.deleteAttendance);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);

    try {
      await deleteAttendance({ attendanceId, deletedBy: adminId });
      toast.success('Attendance deleted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Attendance Record?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete attendance record <strong>{attendanceCode}</strong> for{' '}
            <strong>{className}</strong>? This action cannot be undone and will permanently remove
            all student attendance records for this session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
