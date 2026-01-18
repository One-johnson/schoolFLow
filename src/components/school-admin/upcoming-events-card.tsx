'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';
import { JSX } from 'react';

interface UpcomingEventsCardProps {
  schoolId: string;
}

const eventTypeColors: Record<string, string> = {
  meeting: 'bg-blue-100 text-blue-800',
  exam: 'bg-red-100 text-red-800',
  holiday: 'bg-green-100 text-green-800',
  sports: 'bg-purple-100 text-purple-800',
  cultural: 'bg-pink-100 text-pink-800',
  academic: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};

export function UpcomingEventsCard({ schoolId }: UpcomingEventsCardProps): JSX.Element {
  const events = useQuery(api.dashboard.getUpcomingEvents, { schoolId });

  if (!events) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>Next 5 events on your calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Next 5 events on your calendar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length > 0 ? (
          <>
            {events.map((event) => (
              <div
                key={event._id}
                className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{event.eventTitle}</h4>
                      <Badge
                        variant="secondary"
                        className={eventTypeColors[event.eventType as keyof typeof eventTypeColors] || eventTypeColors.other}
                      >
                        {event.eventType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.startDate), 'MMM dd, yyyy')}
                      </span>
                      {(event.rsvpCounts?.attending ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.rsvpCounts.attending} attending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {event.eventDescription && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    {event.eventDescription}
                  </p>
                )}
              </div>
            ))}
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/school-admin/events">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No upcoming events</p>
            <Button asChild size="sm">
              <Link href="/school-admin/events">Create Event</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
