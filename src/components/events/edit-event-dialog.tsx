'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { Id } from '../../../convex/_generated/dataModel';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    _id: Id<'events'>;
    eventTitle: string;
    eventDescription?: string;
    eventType: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    location?: string;
    venueType: string;
    audienceType: string;
    requiresRSVP: boolean;
    rsvpDeadline?: string;
    maxAttendees?: number;
    color?: string;
  } | null;
  adminId: string;
}

interface EventFormData {
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxAttendees?: number;
}

export function EditEventDialog({ open, onOpenChange, event, adminId }: EditEventDialogProps): React.JSX.Element {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | undefined>(undefined);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [requiresRSVP, setRequiresRSVP] = useState<boolean>(false);
  const [eventType, setEventType] = useState<string>('other');
  const [venueType, setVenueType] = useState<string>('on_campus');
  const [audienceType, setAudienceType] = useState<string>('all_school');
  const [colorValue, setColorValue] = useState<string>('#6b7280');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<EventFormData>();
  const updateEvent = useMutation(api.events.updateEvent);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (event && open) {
      setValue('eventTitle', event.eventTitle);
      setValue('eventDescription', event.eventDescription || '');
      setValue('location', event.location || '');
      setValue('startTime', event.startTime || '');
      setValue('endTime', event.endTime || '');
      setValue('maxAttendees', event.maxAttendees);

      setEventType(event.eventType);
      setVenueType(event.venueType);
      setAudienceType(event.audienceType);
      setIsAllDay(event.isAllDay);
      setRequiresRSVP(event.requiresRSVP);
      setColorValue(event.color || '#6b7280');
      setStartDate(new Date(event.startDate));
      setEndDate(new Date(event.endDate));
      if (event.rsvpDeadline) {
        setRsvpDeadline(new Date(event.rsvpDeadline));
      }
    }
  }, [event, open, setValue]);

  const onSubmit = async (data: EventFormData): Promise<void> => {
    if (!event || !startDate || !endDate) return;

    setIsSubmitting(true);

    try {
      await updateEvent({
        eventId: event._id,
        eventTitle: data.eventTitle,
        eventDescription: data.eventDescription,
        eventType: eventType as 'holiday' | 'exam' | 'sports' | 'parent_meeting' | 'assembly' | 'cultural' | 'field_trip' | 'workshop' | 'other',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: isAllDay ? undefined : data.startTime,
        endTime: isAllDay ? undefined : data.endTime,
        isAllDay,
        location: data.location,
        venueType: venueType as 'on_campus' | 'off_campus' | 'virtual',
        audienceType: audienceType as 'all_school' | 'specific_classes' | 'specific_departments' | 'staff_only' | 'custom',
        requiresRSVP,
        rsvpDeadline: requiresRSVP && rsvpDeadline ? rsvpDeadline.toISOString() : undefined,
        maxAttendees: requiresRSVP && data.maxAttendees ? Number(data.maxAttendees) : undefined,
        color: colorValue,
        lastModifiedBy: adminId,
      });

      toast.success('Event updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update event');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="eventTitle">Event Title *</Label>
            <Input
              id="eventTitle"
              {...register('eventTitle', { required: 'Event title is required' })}
              placeholder="Enter event title"
            />
            {errors.eventTitle && (
              <p className="text-sm text-red-600">{errors.eventTitle.message}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="sports">Sports Day</SelectItem>
                <SelectItem value="parent_meeting">Parent Meeting</SelectItem>
                <SelectItem value="assembly">Assembly</SelectItem>
                <SelectItem value="cultural">Cultural Event</SelectItem>
                <SelectItem value="field_trip">Field Trip</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="eventDescription">Description</Label>
            <Textarea
              id="eventDescription"
              {...register('eventDescription')}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox id="isAllDay" checked={isAllDay} onCheckedChange={(checked: boolean) => setIsAllDay(checked)} />
            <Label htmlFor="isAllDay" className="cursor-pointer">All Day Event</Label>
          </div>

          {/* Time Range */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" {...register('startTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" {...register('endTime')} />
              </div>
            </div>
          )}

          {/* Venue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venueType">Venue Type *</Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_campus">On Campus</SelectItem>
                  <SelectItem value="off_campus">Off Campus</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} placeholder="e.g., School Hall" />
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="color">Event Color</Label>
            <Input
              id="color"
              type="color"
              value={colorValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColorValue(e.target.value)}
              className="h-10 w-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
