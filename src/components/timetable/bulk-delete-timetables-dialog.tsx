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

interface BulkDeleteTimetablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableIds: Id<'timetables'>[];
  onSuccess?: () => void;
}

export function BulkDeleteTimetablesDialog({
  open,
  onOpenChange,
  timetableIds,
  onSuccess,
}: BulkDeleteTimetablesDialogProps): JSX.Element {
  const bulkDeleteTimetables = useMutation(api.timetables.bulkDeleteTimetables);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleBulkDelete = async (): Promise<void> => {
    if (timetableIds.length === 0) return;

    setIsLoading(true);

    try {
      await bulkDeleteTimetables({ timetableIds });
      toast.success(`${timetableIds.length} timetable(s) deleted successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete timetables');
      console.error('Bulk delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Timetables</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {timetableIds.length} timetable(s)? This will also remove all associated periods and teacher assignments. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {timetableIds.length} Timetable(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
