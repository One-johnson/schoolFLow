'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'convex/react';
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
import React from 'react';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  adminId: string;
}

interface EventFormData {
  eventTitle: string;
  eventDescription?: string;
  eventType: 'holiday' | 'exam' | 'sports' | 'parent_meeting' | 'assembly' | 'cultural' | 'field_trip' | 'workshop' | 'other';
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  venueType: 'on_campus' | 'off_campus' | 'virtual';
  audienceType: 'all_school' | 'specific_classes' | 'specific_departments' | 'staff_only';
  targetClasses?: string[];
  targetDepartments?: Array<'creche' | 'kindergarten' | 'primary' | 'junior_high'>;
  requiresRSVP: boolean;
  rsvpDeadline?: Date;
  maxAttendees?: number;
  sendNotification: boolean;
}

export function AddEventDialog({ open, onOpenChange, schoolId, adminId }: AddEventDialogProps): React.JSX.Element {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [rsvpDeadline, setRsvpDeadline] = useState<Date | undefined>(undefined);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [requiresRSVP, setRequiresRSVP] = useState<boolean>(false);
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  const [eventType, setEventType] = useState<string>('other');
  const [venueType, setVenueType] = useState<string>('on_campus');
  const [audienceType, setAudienceType] = useState<string>('all_school');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EventFormData>();
  const createEvent = useMutation(api.events.createEvent);
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = async (data: EventFormData): Promise<void> => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setIsSubmitting(true);

    try {
      await createEvent({
        schoolId,
        eventTitle: data.eventTitle,
        eventDescription: data.eventDescription,
        eventType: eventType as EventFormData['eventType'],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: isAllDay ? undefined : data.startTime,
        endTime: isAllDay ? undefined : data.endTime,
        isAllDay,
        location: data.location,
        venueType: venueType as EventFormData['venueType'],
        audienceType: audienceType as EventFormData['audienceType'],
        targetClasses: audienceType === 'specific_classes' ? data.targetClasses : undefined,
        targetDepartments: audienceType === 'specific_departments' ? data.targetDepartments : undefined,
        isRecurring: false,
        sendNotification,
        requiresRSVP,
        rsvpDeadline: requiresRSVP && rsvpDeadline ? rsvpDeadline.toISOString() : undefined,
        maxAttendees: requiresRSVP && data.maxAttendees ? Number(data.maxAttendees) : undefined,
        createdBy: adminId,
      });

      toast.success('Event created successfully');
      reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setRsvpDeadline(undefined);
      setIsAllDay(true);
      setRequiresRSVP(false);
      setSendNotification(true);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create event');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to the school calendar
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

          {/* Time Range (if not all day) */}
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

          {/* Audience */}
          <div className="space-y-2">
            <Label htmlFor="audienceType">Target Audience *</Label>
            <Select value={audienceType} onValueChange={setAudienceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_school">All School</SelectItem>
                <SelectItem value="specific_classes">Specific Classes</SelectItem>
                <SelectItem value="specific_departments">Specific Departments</SelectItem>
                <SelectItem value="staff_only">Staff Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RSVP Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresRSVP"
                checked={requiresRSVP}
                onCheckedChange={(checked: boolean) => setRequiresRSVP(checked)}
              />
              <Label htmlFor="requiresRSVP" className="cursor-pointer">Requires RSVP</Label>
            </div>

            {requiresRSVP && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>RSVP Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {rsvpDeadline ? format(rsvpDeadline, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={rsvpDeadline} onSelect={setRsvpDeadline} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input id="maxAttendees" type="number" {...register('maxAttendees', { valueAsNumber: true })} placeholder="Optional" />
                </div>
              </div>
            )}
          </div>

          {/* Send Notification */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendNotification"
              checked={sendNotification}
              onCheckedChange={(checked: boolean) => setSendNotification(checked)}
            />
            <Label htmlFor="sendNotification" className="cursor-pointer">Send notification when event is created</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
