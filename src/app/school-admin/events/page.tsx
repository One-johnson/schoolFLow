'use client';

import { useState, useMemo, JSX } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar as CalendarIcon, List, BarChart3, MoreHorizontal, Eye, Edit, XCircle, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { DataTable } from '@/components/ui/data-table';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AddEventDialog } from '@/components/events/add-event-dialog';
import { ViewEventDialog } from '@/components/events/view-event-dialog';
import { EditEventDialog } from '@/components/events/edit-event-dialog';
import { DeleteEventDialog } from '@/components/events/delete-event-dialog';
import { CancelEventDialog } from '@/components/events/cancel-event-dialog';
import { EventCard } from '@/components/events/event-card';
import { EventTypeBadge } from '@/components/events/event-type-badge';
import { formatEventDate } from '@/lib/event-utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Id } from '../../../../convex/_generated/dataModel';

// Setup date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  _id: Id<'events'>;
  _creationTime: number;
  schoolId: string;
  eventCode: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: 'holiday' | 'exam' | 'sports' | 'parent_meeting' | 'assembly' | 'cultural' | 'field_trip' | 'workshop' | 'other';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  venueType: 'on_campus' | 'off_campus' | 'virtual';
  audienceType: 'all_school' | 'specific_classes' | 'specific_departments' | 'staff_only' | 'custom';
  targetClasses?: string[];
  targetDepartments?: Array<'creche' | 'kindergarten' | 'primary' | 'junior_high'>;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'termly' | 'yearly';
  recurrenceEndDate?: string;
  recurrenceDays?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  parentEventId?: string;
  sendNotification: boolean;
  requiresRSVP: boolean;
  rsvpDeadline?: string;
  maxAttendees?: number;
  color?: string;
  academicYearId?: string;
  termId?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy?: string;
}

export default function EventsPage(): JSX.Element {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  // States for dialogs
  const [showAddDialog, setShowAddDialog] = useState<boolean>(false);
  const [showViewDialog, setShowViewDialog] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // States for filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch data
  const events = useQuery(
    api.events.getEventsBySchool,
    schoolId ? { schoolId } : 'skip'
  );
  const eventStats = useQuery(
    api.events.getEventStats,
    schoolId ? { schoolId } : 'skip'
  );

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event: Event) => {
      const matchesSearch =
        event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventDescription?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || event.eventType === typeFilter;
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, searchQuery, typeFilter, statusFilter]);

  // Prepare calendar events
  const calendarEvents = useMemo(() => {
    if (!filteredEvents) return [];

    return filteredEvents.map((event: Event) => ({
      id: event._id,
      title: event.eventTitle,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      allDay: event.isAllDay,
      resource: event,
    }));
  }, [filteredEvents]);

  // Table columns
  const columns: ColumnDef<Event>[] = useMemo(
    () => [
      {
        accessorKey: 'eventCode',
        header: 'Event Code',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.eventCode}</span>
        ),
      },
      {
        accessorKey: 'eventTitle',
        header: 'Event Title',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.eventTitle}</p>
            {row.original.eventDescription && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {row.original.eventDescription}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'eventType',
        header: 'Type',
        cell: ({ row }) => (
          <EventTypeBadge
            eventType={row.original.eventType}
            color={row.original.color}
          />
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatEventDate(row.original.startDate, row.original.startTime)}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.location || 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusColors: Record<string, string> = {
            upcoming: 'bg-blue-100 text-blue-800',
            ongoing: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
          };

          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[row.original.status as keyof typeof statusColors] || statusColors.upcoming
              }`}
            >
              {row.original.status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const event = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedEvent(event);
                  setShowViewDialog(true);
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedEvent(event);
                  setShowEditDialog(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedEvent(event);
                  setShowCancelDialog(true);
                }}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Event style getter for calendar
  const eventStyleGetter = (event: { resource: Event }): { style: React.CSSProperties } => {
    return {
      style: {
        backgroundColor: event.resource.color || '#6b7280',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (!schoolId || !user) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events Management</h2>
          <p className="text-muted-foreground">
            Create and manage school events, meetings, and activities
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Events"
          value={eventStats?.totalEvents || 0}
       
          icon={CalendarIcon}
        />
        <StatsCard
          title="Upcoming Events"
          value={eventStats?.upcomingEvents || 0}
          
          icon={CalendarIcon}
        />
        <StatsCard
          title="Ongoing Events"
          value={eventStats?.ongoingEvents || 0}
        
          icon={CalendarIcon}
        />
        <StatsCard
          title="Completed Events"
          value={eventStats?.completedEvents || 0}
 
          icon={CalendarIcon}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="cards">
            <BarChart3 className="mr-2 h-4 w-4" />
            Card View
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>
                View and manage all school events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredEvents || []}
                searchKey="eventTitle"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
              <CardDescription>
                Visual calendar view of all events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => {
                    setSelectedEvent(event.resource);
                    setShowViewDialog(true);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card View */}
        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents && filteredEvents.length > 0 ? (
              filteredEvents.map((event: Event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onView={() => {
                    setSelectedEvent(event);
                    setShowViewDialog(true);
                  }}
                  onEdit={() => {
                    setSelectedEvent(event);
                    setShowEditDialog(true);
                  }}
                  onCancel={() => {
                    setSelectedEvent(event);
                    setShowCancelDialog(true);
                  }}
                  onDelete={() => {
                    setSelectedEvent(event);
                    setShowDeleteDialog(true);
                  }}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No events found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddEventDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        schoolId={schoolId}
        adminId={user.userId}
      />

      <ViewEventDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        event={selectedEvent}
      />

      <EditEventDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        event={selectedEvent}
        adminId={user.userId}
      />

      <DeleteEventDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        event={selectedEvent}
      />

      <CancelEventDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        event={selectedEvent}
        adminId={user.userId}
      />
    </div>
  );
}
