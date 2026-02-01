'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
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
import type { Id } from '../../../convex/_generated/dataModel';

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    _id: Id<'events'>;
    eventTitle: string;
  } | null;
  adminId: string;
}

export function DeleteEventDialog({ open, onOpenChange, event, adminId }: DeleteEventDialogProps): JSX.Element {
  const deleteEvent = useMutation(api.events.deleteEvent);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async (): Promise<void> => {
    if (!event) return;

    setIsDeleting(true);

    try {
      await deleteEvent({ eventId: event._id, deletedBy: adminId });
      toast.success('Event deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!event) return <></>;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the event "{event.eventTitle}"? This action cannot be undone. All associated RSVPs and notifications will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
