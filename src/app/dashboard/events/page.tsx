
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Megaphone,
} from "lucide-react"
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
}

type Class = {
  id: string;
  name: string;
  teacherId?: string;
  studentIds?: Record<string, boolean>;
};


const eventTypeColors: { [key in Event['type']]: string } = {
    Academic: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    Holiday: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300",
    Sports: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300",
    Meeting: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300",
    Other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300",
};

export default function EventsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { data: events, addData, updateData, deleteData, loading } = useDatabase<Event>("events");
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { addData: addNotification } = useDatabase("notifications");

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [formState, setFormState] = React.useState<Partial<Omit<Event, "id">>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

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

  const filteredEvents = React.useMemo(() => {
      if(role === 'admin') return events;
      if (!user) return [];

      return events.filter(event => {
          if (event.audience === 'all') return true;
          if (event.audience === 'teachers' && role === 'teacher') return true;
          if (event.audience === 'students' && (role === 'student' || role === 'teacher')) return true;
          return userClasses.includes(event.audience);
      })
  }, [events, role, user, userClasses])

  React.useEffect(() => {
    if (selectedEvent) {
      setFormState({
        title: selectedEvent.title,
        type: selectedEvent.type,
        description: selectedEvent.description,
        audience: selectedEvent.audience,
      });
      setDateRange({
        from: new Date(selectedEvent.startDate),
        to: new Date(selectedEvent.endDate),
      });
    } else {
      setFormState({ audience: 'all' });
      setDateRange(undefined);
    }
  }, [selectedEvent]);

  const handleOpenDialog = (event?: Event) => {
    setSelectedEvent(event || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.title || !dateRange?.from || !formState.type) {
      toast({ title: "Error", description: "Title, date, and type are required.", variant: "destructive" });
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

  const sortedEvents = React.useMemo(() => {
    return [...filteredEvents].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [filteredEvents]);

  const DayCellContent: React.FC<{ date: Date }> = ({ date }) => {
    const dayString = format(date, "yyyy-MM-dd");
    const dayEvents = filteredEvents.filter(e => {
        const startDate = e.startDate;
        const endDate = e.endDate;
        return dayString >= startDate && dayString <= endDate;
    });

    return (
        <div className="flex flex-col h-full">
            <div className="self-end">{format(date, "d")}</div>
            <div className="flex flex-col gap-1 flex-grow overflow-hidden mt-1">
                {dayEvents.slice(0, 2).map(event => (
                    <Badge
                        key={event.id}
                        className={cn("w-full justify-start truncate cursor-pointer text-xs", eventTypeColors[event.type])}
                        onClick={() => role === 'admin' && handleOpenDialog(event)}
                    >
                        {event.title}
                    </Badge>
                ))}
                {dayEvents.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                        {dayEvents.length - 2} more...
                    </p>
                )}
            </div>
        </div>
    );
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card className="lg:col-span-2">
                <CardContent className="p-2 md:p-6">
                    {loading ? (
                        <div className="flex h-[60vh] items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Calendar
                            mode="single"
                            className="w-full"
                            classNames={{
                                day_cell: "h-24 align-top p-1",
                                day_selected: "bg-accent text-accent-foreground",
                                day_today: "bg-accent text-accent-foreground rounded-md",
                            }}
                            components={{
                                DayContent: DayCellContent
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>A look at what's next.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-4 pr-4">
                            {sortedEvents.filter(e => new Date(e.endDate) >= new Date()).map(event => (
                                <div key={event.id} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="text-sm font-bold">{format(parseISO(event.startDate), "MMM")}</div>
                                        <div className="text-xl font-extrabold text-primary">{format(parseISO(event.startDate), "dd")}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{event.title}</h4>
                                        <p className="text-sm text-muted-foreground">{event.description}</p>
                                        <Badge className={cn("mt-1", eventTypeColors[event.type])}>{event.type}</Badge>
                                    </div>
                                    {role === 'admin' && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(event)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                <DialogDescription>Fill in the details for the event below.</DialogDescription>
            </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Title</Label>
                    <Input id="title" className="col-span-3" value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} disabled={isLoading} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date Range</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            disabled={isLoading}
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
                            <Calendar
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
                     <Select value={formState.type} onValueChange={(value: Event['type']) => setFormState(p => ({...p, type: value}))} disabled={isLoading}>
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
                    <Label htmlFor="audience" className="text-right">Audience</Label>
                     <Select value={formState.audience} onValueChange={(value: Event['audience']) => setFormState(p => ({...p, audience: value}))} disabled={isLoading}>
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
                    <Textarea id="description" className="col-span-3" value={formState.description || ''} onChange={e => setFormState(p => ({...p, description: e.target.value}))} disabled={isLoading} />
                </div>
             </div>
            <DialogFooter className="justify-between">
                <div>
                  {selectedEvent && (
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
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedEvent ? "Save Changes" : "Create Event"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
