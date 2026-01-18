'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Id } from '../../../convex/_generated/dataModel';

interface CancelEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    _id: Id<'events'>;
    eventTitle: string;
  } | null;
  adminId: string;
}

interface CancelFormData {
  cancellationReason: string;
}

export function CancelEventDialog({ open, onOpenChange, event, adminId }: CancelEventDialogProps): React.JSX.Element {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CancelFormData>();
  const cancelEvent = useMutation(api.events.cancelEvent);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = async (data: CancelFormData): Promise<void> => {
    if (!event) return;

    setIsSubmitting(true);

    try {
      await cancelEvent({
        eventId: event._id,
        cancellationReason: data.cancellationReason,
        lastModifiedBy: adminId,
      });

      toast.success('Event cancelled successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to cancel event');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Event</DialogTitle>
          <DialogDescription>
            Cancel the event "{event.eventTitle}". Please provide a reason for cancellation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancellationReason">Cancellation Reason *</Label>
            <Textarea
              id="cancellationReason"
              {...register('cancellationReason', { required: 'Cancellation reason is required' })}
              placeholder="Enter the reason for cancelling this event"
              rows={4}
            />
            {errors.cancellationReason && (
              <p className="text-sm text-red-600">{errors.cancellationReason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Cancelling...' : 'Cancel Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
