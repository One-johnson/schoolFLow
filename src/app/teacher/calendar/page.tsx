'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen,
  PartyPopper,
  Users,
  GraduationCap,
  Briefcase,
  Trophy,
  Palette,
  Bus,
  Wrench,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  type: 'event' | 'exam' | 'holiday' | 'deadline';
  eventType?: string;
  location?: string;
  color?: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  holiday: PartyPopper,
  exam: BookOpen,
  sports: Trophy,
  parent_meeting: Users,
  assembly: GraduationCap,
  cultural: Palette,
  field_trip: Bus,
  workshop: Wrench,
  other: CalendarIcon,
};

const EVENT_COLORS: Record<string, string> = {
  holiday: 'bg-green-100 text-green-700 border-green-200',
  exam: 'bg-red-100 text-red-700 border-red-200',
  sports: 'bg-blue-100 text-blue-700 border-blue-200',
  parent_meeting: 'bg-amber-100 text-amber-700 border-amber-200',
  assembly: 'bg-purple-100 text-purple-700 border-purple-200',
  cultural: 'bg-pink-100 text-pink-700 border-pink-200',
  field_trip: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  workshop: 'bg-lime-100 text-lime-700 border-lime-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function CalendarPage() {
  const { teacher } = useTeacherAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Queries
  const events = useQuery(
    api.events.getEventsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const exams = useQuery(
    api.exams.getExamsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Combine events and exams
  const allEvents = useMemo(() => {
    const combined: CalendarEvent[] = [];

    // Add events
    events?.forEach((event) => {
      if (event.status !== 'cancelled') {
        combined.push({
          id: event._id,
          title: event.eventTitle,
          date: event.startDate,
          endDate: event.endDate,
          time: event.startTime,
          type: event.eventType === 'holiday' ? 'holiday' : 'event',
          eventType: event.eventType,
          location: event.location,
          color: event.color,
        });
      }
    });

    // Add exams
    exams?.forEach((exam) => {
      if (exam.status !== 'draft') {
        combined.push({
          id: exam._id,
          title: exam.examName,
          date: exam.startDate,
          endDate: exam.endDate,
          type: 'exam',
          eventType: 'exam',
        });
      }
    });

    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, exams]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allEvents.filter((event) => {
      const eventStart = event.date.split('T')[0];
      const eventEnd = event.endDate?.split('T')[0] || eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? allEvents.filter((event) => {
        const eventStart = event.date.split('T')[0];
        const eventEnd = event.endDate?.split('T')[0] || eventStart;
        return selectedDate >= eventStart && selectedDate <= eventEnd;
      })
    : [];

  // Get upcoming events
  const upcomingEvents = allEvents.filter(
    (event) => new Date(event.date) >= new Date()
  ).slice(0, 10);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Events, exams, and important dates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dateStr = day.date.toISOString().split('T')[0];
                const dayEvents = getEventsForDate(day.date);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`
                      relative p-2 min-h-[60px] text-sm rounded-lg transition-colors
                      ${day.isCurrentMonth ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                      ${isToday(day.date) ? 'ring-2 ring-primary' : ''}
                      ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'}
                    `}
                  >
                    <span
                      className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                        ${isToday(day.date) ? 'bg-primary text-primary-foreground font-bold' : ''}
                      `}
                    >
                      {day.date.getDate()}
                    </span>

                    {hasEvents && (
                      <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              event.type === 'exam'
                                ? 'bg-red-500'
                                : event.type === 'holiday'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Exams</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Holidays</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Events</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate
                  ? formatDate(selectedDate)
                  : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateEvents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => {
                      const Icon = EVENT_ICONS[event.eventType || 'other'] || CalendarIcon;
                      const colorClass = EVENT_COLORS[event.eventType || 'other'];

                      return (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border ${colorClass}`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{event.title}</p>
                              {event.time && (
                                <p className="text-xs flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(event.time)}
                                </p>
                              )}
                              {event.location && (
                                <p className="text-xs flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click on a date to see events</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {!events || !exams ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {upcomingEvents.map((event) => {
                      const Icon = EVENT_ICONS[event.eventType || 'other'] || CalendarIcon;
                      const eventDate = new Date(event.date);
                      const isThisWeek = eventDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedDate(event.date.split('T')[0])}
                          className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`
                                w-10 h-10 rounded-lg flex flex-col items-center justify-center text-center
                                ${event.type === 'exam' ? 'bg-red-100' : event.type === 'holiday' ? 'bg-green-100' : 'bg-blue-100'}
                              `}
                            >
                              <span className="text-xs font-medium">
                                {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="text-sm font-bold">
                                {eventDate.getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={isThisWeek ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {event.eventType?.replace('_', ' ')}
                                </Badge>
                                {event.time && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(event.time)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
