'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

interface RSVPFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<'events'> | null;
  eventCode: string;
  eventTitle: string;
  schoolId: string;
  respondentId: string;
  respondentName: string;
  respondentEmail?: string;
  respondentType: 'student' | 'parent' | 'teacher';
  existingRSVP?: {
    rsvpStatus: 'attending' | 'not_attending' | 'maybe' | 'pending';
    numberOfGuests?: number;
    notes?: string;
  };
}

export function RSVPFormDialog({
  open,
  onOpenChange,
  eventId,
  eventCode,
  eventTitle,
  schoolId,
  respondentId,
  respondentName,
  respondentEmail,
  respondentType,
  existingRSVP,
}: RSVPFormDialogProps): React.JSX.Element {
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending' | 'maybe'>(
    existingRSVP?.rsvpStatus === 'pending' ? 'attending' : (existingRSVP?.rsvpStatus || 'attending')
  );
  const [numberOfGuests, setNumberOfGuests] = useState<string>(
    existingRSVP?.numberOfGuests?.toString() || '0'
  );
  const [notes, setNotes] = useState<string>(existingRSVP?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitRSVP = useMutation(api.eventRSVPs.submitRSVP);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      await submitRSVP({
        schoolId,
        eventId,
        eventCode,
        eventTitle,
        respondentType,
        respondentId,
        respondentName,
        respondentEmail,
        rsvpStatus,
        numberOfGuests: numberOfGuests ? parseInt(numberOfGuests) : undefined,
        notes: notes || undefined,
      });

      toast.success('RSVP submitted successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit RSVP:', error);
      toast.error('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP - {eventTitle}</DialogTitle>
          <DialogDescription>
            Please confirm your attendance for this event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Respondent Info */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={respondentName} disabled />
          </div>

          {/* RSVP Status */}
          <div className="space-y-3">
            <Label>Will you attend?</Label>
            <RadioGroup value={rsvpStatus} onValueChange={(value) => setRsvpStatus(value as typeof rsvpStatus)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="attending" id="attending" />
                <Label htmlFor="attending" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Yes, I will attend</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="maybe" id="maybe" />
                <Label htmlFor="maybe" className="flex items-center gap-2 cursor-pointer flex-1">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span>Maybe</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="not_attending" id="not_attending" />
                <Label htmlFor="not_attending" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>No, I cannot attend</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Number of Guests */}
          {rsvpStatus === 'attending' && (
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Additional Guests</Label>
              <Input
                id="guests"
                type="number"
                min="0"
                max="10"
                value={numberOfGuests}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberOfGuests(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                How many people will you bring with you?
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Any special requirements or comments..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit RSVP'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
