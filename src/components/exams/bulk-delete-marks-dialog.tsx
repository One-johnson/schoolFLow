'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '../../../convex/_generated/dataModel';

interface BulkDeleteMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markIds: Array<Id<'studentMarks'>>;
  studentCount: number;
  onSuccess?: () => void;
}

export function BulkDeleteMarksDialog({
  open,
  onOpenChange,
  markIds,
  studentCount,
  onSuccess,
}: BulkDeleteMarksDialogProps) {
  const deleteMark = useMutation(api.marks.deleteMark);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      // Delete all marks sequentially
      for (const markId of markIds) {
        await deleteMark({ markId });
      }
      
      toast.success(
        `Successfully deleted ${markIds.length} mark(s) for ${studentCount} student(s)`
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting marks:', error);
      toast.error('Failed to delete marks. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Student Marks
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all marks for {studentCount} selected student(s)?
            This will remove {markIds.length} mark record(s).
          </DialogDescription>
        </DialogHeader>
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 my-4">
          <p className="text-sm text-destructive">
            <strong>Warning:</strong> This action cannot be undone. All exam scores, grades, and remarks for the selected students will be permanently deleted.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : `Delete ${markIds.length} Mark(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
