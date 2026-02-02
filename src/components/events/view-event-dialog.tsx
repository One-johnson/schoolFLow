'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatEventDateRange, getEventTypeLabel, getVenueTypeLabel, getAudienceTypeLabel, getDepartmentLabel } from '@/lib/event-utils';
import { JSX } from 'react';

interface ViewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    _id: Id<'events'>;
    eventCode: string;
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
    targetClasses?: string[];
    targetDepartments?: string[];
    requiresRSVP: boolean;
    rsvpDeadline?: string;
    maxAttendees?: number;
    color?: string;
    status: string;
    createdAt: string;
  } | null;
}

export function ViewEventDialog({ open, onOpenChange, event }: ViewEventDialogProps): React.JSX.Element {
  if (!event) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{event.eventTitle}</DialogTitle>
            <Badge
              style={{ backgroundColor: event.color || '#6b7280' }}
              className="text-white"
            >
              {getEventTypeLabel(event.eventType)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Code */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Event Code:</span>
            <span className="text-sm font-medium">{event.eventCode}</span>
          </div>

          {/* Description */}
          {event.eventDescription && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{event.eventDescription}</p>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {formatEventDateRange(
                  event.startDate,
                  event.endDate,
                  event.isAllDay,
                  event.startTime,
                  event.endTime
                )}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {event.location || 'Not specified'} ({getVenueTypeLabel(event.venueType)})
              </p>
            </div>
          </div>

          {/* Audience */}
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Target Audience</p>
              <p className="text-sm text-muted-foreground">
                {getAudienceTypeLabel(event.audienceType)}
              </p>
              {event.targetDepartments && event.targetDepartments.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {event.targetDepartments.map((dept: string) => (
                    <Badge key={dept} variant="outline" className="text-xs">
                      {getDepartmentLabel(dept)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RSVP Information */}
          {event.requiresRSVP && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">RSVP Information</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {event.rsvpDeadline && (
                  <p>Deadline: {new Date(event.rsvpDeadline).toLocaleDateString()}</p>
                )}
                {event.maxAttendees && (
                  <p>Max Attendees: {event.maxAttendees}</p>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={event.status === 'cancelled' ? 'destructive' : 'default'}>
                {event.status}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
