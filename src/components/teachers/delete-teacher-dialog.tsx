'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Teacher } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface DeleteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher;
  deletedBy: string;
  onDeleted: () => void;
}

export function DeleteTeacherDialog({
  open,
  onOpenChange,
  teacher,
  deletedBy,
  onDeleted,
}: DeleteTeacherDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteTeacher = useMutation(api.teachers.deleteTeacher);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);

    try {
      await deleteTeacher({
        teacherId: teacher._id as Id<'teachers'>,
        deletedBy,
      });

      toast.success(`Teacher ${teacher.firstName} ${teacher.lastName} deleted successfully`);
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {teacher.firstName} {teacher.lastName}
            </span>{' '}
            (ID: {teacher.teacherId})?
            <br />
            <br />
            This action cannot be undone. All teacher information will be permanently
            removed from your school&apos;s records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Teacher'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
