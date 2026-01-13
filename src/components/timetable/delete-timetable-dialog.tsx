'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { Loader2 } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface DeleteTimetableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableId: Id<'timetables'> | null;
}

export function DeleteTimetableDialog({
  open,
  onOpenChange,
  timetableId,
}: DeleteTimetableDialogProps): JSX.Element {
  const deleteTimetable = useMutation(api.timetables.deleteTimetable);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDelete = async (): Promise<void> => {
    if (!timetableId) return;

    setIsLoading(true);

    try {
      await deleteTimetable({ timetableId });
      toast.success('Timetable deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete timetable');
      console.error('Delete timetable error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Timetable</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this timetable? This will also remove all periods and teacher assignments. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
