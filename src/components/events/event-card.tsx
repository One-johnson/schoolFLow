'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Clock, MapPin, MoreVertical, Users } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatEventDateRange } from '@/lib/event-utils';
import { EventTypeBadge } from './event-type-badge';

interface EventCardProps {
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
    color?: string;
    status: string;
    requiresRSVP: boolean;
  };
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function EventCard({ event, onView, onEdit, onCancel, onDelete }: EventCardProps): React.JSX.Element {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{event.eventTitle}</CardTitle>
              <EventTypeBadge eventType={event.eventType} color={event.color} />
            </div>
            <CardDescription className="text-sm">{event.eventCode}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <>
                  <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={onCancel} className="text-orange-600">
                    Cancel Event
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.eventDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.eventDescription}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatEventDateRange(
              event.startDate,
              event.endDate,
              event.isAllDay,
              event.startTime,
              event.endTime
            )}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={event.status === 'cancelled' ? 'destructive' : 'outline'}>
            {event.status}
          </Badge>
          {event.requiresRSVP && (
            <Badge variant="secondary" className="text-xs">
              RSVP Required
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
