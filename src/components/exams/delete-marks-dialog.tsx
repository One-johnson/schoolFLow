'use client';

import React, { useState } from 'react';
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
import type { Id } from '../../../convex/_generated/dataModel';

interface DeleteMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markId: Id<'studentMarks'>;
  studentName: string;
  subjectName: string;
  onSuccess?: () => void;
}

export function DeleteMarkDialog({
  open,
  onOpenChange,
  markId,
  studentName,
  subjectName,
  onSuccess,
}: DeleteMarkDialogProps) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteMark = useMutation(api.marks.deleteMark);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteMark({ markId });
      toast.success('Mark deleted successfully', {
        description: `Removed ${subjectName} marks for ${studentName}`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete mark';
      toast.error('Delete failed', {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Mark Entry</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete this mark entry?</p>
            <div className="mt-4 p-3 bg-muted rounded-md space-y-1">
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">Student:</span> {studentName}
              </p>
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">Subject:</span> {subjectName}
              </p>
            </div>
            <p className="text-destructive font-medium mt-4">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
