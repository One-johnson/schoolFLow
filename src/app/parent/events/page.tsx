'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock } from 'lucide-react';

export default function ParentEventsPage() {
  const { parent } = useParentAuth();

  const events = useQuery(
    api.events.getUpcomingEvents,
    parent ? { schoolId: parent.schoolId, limit: 20 } : 'skip'
  );

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Events
        </h1>
        <p className="text-muted-foreground mt-1">
          Upcoming school events and activities
        </p>
      </div>

      <div className="space-y-4">
        {events === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No upcoming events.</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event._id}>
              <CardHeader>
                <CardTitle className="text-lg">{event.eventTitle}</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.startDate)}
                  </span>
                  {event.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.startTime}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </span>
                  )}
                </div>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-muted">
                  {getEventTypeLabel(event.eventType)}
                </span>
              </CardHeader>
              {event.eventDescription && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.eventDescription}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
