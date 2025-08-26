
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, isPast, addDays, startOfWeek, getDay, parse } from "date-fns"
import { enUS } from 'date-fns/locale'
import { DateRange } from "react-day-picker"
import { Calendar as BigCalendar, dateFnsLocalizer, EventProps, View, NavigateAction } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import { Button } from "@/components/ui/button"
import { Calendar as DayPickerCalendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Loader2,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"


type Event = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: "Academic" | "Holiday" | "Sports" | "Meeting" | "Other";
  description?: string;
  createdAt: number;
  audience: 'all' | 'teachers' | 'students' | string; // 'string' will be a classId
  status: "Scheduled" | "Completed" | "Postponed" | "Cancelled";
}

type Class = {
  id: string;
  name: string;
  teacherId?: string;
  studentIds?: Record<string, boolean>;
};

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  resource: Event;
};


const eventTypeColors: { [key in Event['type']]: string } = {
    Academic: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    Holiday: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300",
    Sports: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300",
    Meeting: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300",
    Other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300",
};

const eventStatusColors: { [key in Event['status']]: string } = {
    Scheduled: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300",
    Completed: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300",
    Postponed: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300",
};

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
})

const CustomEvent = ({ event }: EventProps<CalendarEvent>) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full h-full">
            <div className={cn("text-xs font-bold truncate", event.resource.status === "Cancelled" && "line-through")}>
                {event.title}
            </div>
            {event.resource.type && (
                <Badge variant="outline" className={cn("text-xs w-full justify-center mt-1", eventTypeColors[event.resource.type])}>{event.resource.type}</Badge>
            )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-background border">
        <div className="max-w-xs p-2">
          <p className="font-bold">{event.title}</p>
          <p className="text-sm text-muted-foreground">{format(event.start, "PPP")} - {format(event.end, "PPP")}</p>
          <p className="text-sm mt-2">{event.resource.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={cn(eventTypeColors[event.resource.type])}>{event.resource.type}</Badge>
            <Badge className={cn(eventStatusColors[event.resource.status])}>{event.resource.status}</Badge>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);


export default function EventsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { data: events, addData, updateData, deleteData, loading } = useDatabase<Event>("events");
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { addData: addNotification } = useDatabase("notifications");

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [formState, setFormState] = React.useState<Partial<Omit<Event, "id" | "createdAt">>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<View>('month');

  const userClasses = React.useMemo(() => {
    if (!user) return [];
    if (role === 'student') {
        return classes.filter(c => c.studentIds && c.studentIds[user.uid]).map(c => c.id);
    }
    if (role === 'teacher') {
        return classes.filter(c => c.teacherId === user.uid).map(c => c.id);
    }
    return [];
  }, [user, role, classes]);

  const filteredEventsForUser = React.useMemo(() => {
      if(role === 'admin') return events;
      if (!user) return [];

      return events.filter(event => {
          if (event.audience === 'all') return true;
          if (event.audience === 'teachers' && role === 'teacher') return true;
          if (event.audience === 'students' && (role === 'student' || role === 'teacher')) return true;
          return userClasses.includes(event.audience);
      })
  }, [events, role, user, userClasses])

  const calendarEvents = React.useMemo(() => {
    return filteredEventsForUser.map(event => ({
      title: event.title,
      start: parseISO(event.startDate),
      end: addDays(parseISO(event.endDate), 1), // end date is exclusive for all-day events
      allDay: true,
      resource: event, // Keep original event data
    }));
  }, [filteredEventsForUser]);


  React.useEffect(() => {
    if (selectedEvent) {
      setFormState({
        title: selectedEvent.title,
        type: selectedEvent.type,
        description: selectedEvent.description,
        audience: selectedEvent.audience,
        status: selectedEvent.status
      });
      setDateRange({
        from: new Date(selectedEvent.startDate),
        to: new Date(selectedEvent.endDate),
      });
    } else {
      setFormState({ audience: 'all', status: "Scheduled" });
      setDateRange(undefined);
    }
  }, [selectedEvent]);
  
  const handleNavigate = React.useCallback((newDate: Date) => setCurrentDate(newDate), []);
  const handleView = React.useCallback((newView: View) => setView(newView), []);


  const handleOpenDialog = (event?: Event) => {
    setSelectedEvent(event || null);
    setIsDialogOpen(true);
  };
  
  const handleEventClick = (calEvent: { resource: Event }) => {
    handleOpenDialog(calEvent.resource);
  }

  const handleSubmit = async () => {
    if (!formState.title || !dateRange?.from || !formState.type || !formState.status) {
      toast({ title: "Error", description: "Title, date, type and status are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const eventData = {
      ...formState,
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to || dateRange.from, "yyyy-MM-dd"),
    };

    try {
      if (selectedEvent) {
        await updateData(selectedEvent.id, eventData);
        toast({ title: "Success", description: "Event updated." });
      } else {
        await addData(eventData as Omit<Event, "id">);
        await addNotification({
            type: 'announcement',
            message: `New event added: "${formState.title}"`,
            read: false
        })
        toast({ title: "Success", description: "Event created and notification sent." });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save event.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
        await deleteData(id);
        toast({ title: "Success", description: "Event deleted."});
        setIsDialogOpen(false); // Close the edit dialog after deletion
    } catch (error) {
         toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }
  
  const eventStyleGetter = (event: CalendarEvent) => {
    const colorMap = {
        Academic: "#3b82f6", // blue-500
        Holiday: "#16a34a", // green-600
        Sports: "#f97316", // orange-500
        Meeting: "#9333ea", // purple-600
        Other: "#6b7280" // gray-500
    };
    
    const backgroundColor = colorMap[event.resource.type] || 'gray';
    
    var style = {
        backgroundColor: backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '1px solid #fff',
        display: 'block'
    };
    return {
        style: style
    };
  }

  return (
    <>
    <div className="flex flex-col gap-6">
        <div className="flex flex-row items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Academic Calendar</h1>
                <p className="text-muted-foreground">View and manage all school events, holidays, and important dates.</p>
            </div>
            {role === "admin" && (
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Event
                </Button>
            )}
        </div>
        <Card>
            <CardContent className="p-2 md:p-4 h-[80vh]">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        onSelectEvent={handleEventClick}
                        eventPropGetter={eventStyleGetter}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        view={view}
                        onView={handleView}
                        components={{
                            event: CustomEvent
                        }}
                    />
                )}
            </CardContent>
        </Card>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                <DialogDescription>Fill in the details for the event below.</DialogDescription>
            </DialogHeader>
             <ScrollArea className="max-h-[60vh] pr-6">
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Title</Label>
                    <Input id="title" className="col-span-3" value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} disabled={isLoading || (role !== 'admin' && !!selectedEvent)} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date Range</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            disabled={isLoading || (role !== 'admin' && !!selectedEvent)}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                </>
                                ) : (
                                format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <DayPickerCalendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                     <Select value={formState.type} onValueChange={(value: Event['type']) => setFormState(p => ({...p, type: value}))} disabled={isLoading || (role !== 'admin' && !!selectedEvent)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Holiday">Holiday</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                     <Select value={formState.status} onValueChange={(value: Event['status']) => setFormState(p => ({...p, status: value}))} disabled={isLoading || (role !== 'admin' && !!selectedEvent)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Postponed">Postponed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="audience" className="text-right">Audience</Label>
                     <Select value={formState.audience} onValueChange={(value: Event['audience']) => setFormState(p => ({...p, audience: value}))} disabled={isLoading || (role !== 'admin' && !!selectedEvent)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Everyone</SelectItem>
                            <SelectItem value="teachers">Teachers Only</SelectItem>
                            <SelectItem value="students">Students Only</SelectItem>
                            {classesLoading ? <SelectItem value="loading" disabled>Loading classes...</SelectItem> : 
                            classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Description</Label>
                    <Textarea id="description" className="col-span-3" value={formState.description || ''} onChange={e => setFormState(p => ({...p, description: e.target.value}))} disabled={isLoading || (role !== 'admin' && !!selectedEvent)} />
                </div>
             </div>
             </ScrollArea>
            <DialogFooter className="justify-between pt-4">
                <div>
                  {role === 'admin' && selectedEvent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this event.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(selectedEvent.id)} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {role === 'admin' && (
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {selectedEvent ? "Save Changes" : "Create Event"}
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
