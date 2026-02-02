'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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

interface Class {
  _id: Id<'classes'>;
  classCode: string;
  className: string;
  currentStudentCount: number;
}

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
  deletedBy: string;
  onDeleted?: () => void;
}

export function DeleteClassDialog({
  open,
  onOpenChange,
  classData,
  deletedBy,
  onDeleted,
}: DeleteClassDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const deleteClass = useMutation(api.classes.deleteClass);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);

    try {
      await deleteClass({
        classId: classData._id,
        deletedBy,
      });

      toast.success('Class deleted successfully');
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Class</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{classData.className}</strong> ({classData.classCode})?
            {classData.currentStudentCount > 0 && (
              <span className="block mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-red-600 font-medium">
                  Warning: This class has {classData.currentStudentCount} student(s). 
                  You must reassign all students before deleting this class.
                </span>
              </span>
            )}
            {classData.currentStudentCount === 0 && (
              <span className="block mt-2">This action cannot be undone.</span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || classData.currentStudentCount > 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Class'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
