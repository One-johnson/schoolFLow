
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type Event = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: "Academic" | "Holiday" | "Sports" | "Meeting" | "Other";
  description?: string;
}

const eventTypeColors: { [key in Event['type']]: string } = {
    Academic: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    Holiday: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300",
    Sports: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300",
    Meeting: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300",
    Other: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300",
};

export default function EventsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const { data: events, addData, updateData, deleteData, loading } = useDatabase<Event>("events");
  const { addData: addNotification } = useDatabase("notifications");

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [formState, setFormState] = React.useState<Partial<Omit<Event, "id">>>({});
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  React.useEffect(() => {
    if (selectedEvent) {
      setFormState({
        title: selectedEvent.title,
        type: selectedEvent.type,
        description: selectedEvent.description,
      });
      setDateRange({
        from: new Date(selectedEvent.startDate),
        to: new Date(selectedEvent.endDate),
      });
    } else {
      setFormState({});
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
    } catch (error) {
         toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const DayCellContent = (day: Date) => {
    const dayEvents = events.filter(e => {
        const eventStart = new Date(e.startDate + "T00:00:00");
        const eventEnd = new Date(e.endDate + "T23:59:59");
        return day >= eventStart && day <= eventEnd;
    });

    return (
        <div className="flex flex-col gap-1 p-1 h-full">
            {dayEvents.map(event => (
                 <Popover key={event.id}>
                    <PopoverTrigger asChild>
                        <Badge
                        className={cn("w-full justify-start truncate cursor-pointer text-xs", eventTypeColors[event.type])}
                        >
                        {event.title}
                        </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(event.startDate + "T00:00:00"), "PPP")} to {format(new Date(event.endDate + "T00:00:00"), "PPP")}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(eventTypeColors[event.type])}>{event.type}</Badge>
                                </div>
                                {event.description && <p className="text-sm">{event.description}</p>}
                            </div>
                             {role === "admin" && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(event)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
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
                                            <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            ))}
        </div>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Academic Calendar</CardTitle>
            <CardDescription>View and manage all school events, holidays, and important dates.</CardDescription>
        </div>
        {role === "admin" && (
            <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Event
            </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <Calendar
                mode="single"
                className="w-full"
                classNames={{
                    day: "h-24 align-top p-1",
                    day_selected: "bg-accent text-accent-foreground",
                    day_today: "bg-accent text-accent-foreground rounded-md",
                }}
                components={{ DayContent: ({ date }) => DayCellContent(date) }}
            />
        )}
      </CardContent>
    </Card>

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                <DialogDescription>Fill in the details for the event below.</DialogDescription>
            </DialogHeader>
             <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">Title</Label>
                    <Input id="title" className="col-span-3" value={formState.title || ''} onChange={e => setFormState(p => ({...p, title: e.target.value}))} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date Range</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
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
                     <Select value={formState.type} onValueChange={(value: Event['type']) => setFormState(p => ({...p, type: value}))}>
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
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Description</Label>
                    <Textarea id="description" className="col-span-3" value={formState.description || ''} onChange={e => setFormState(p => ({...p, description: e.target.value}))} />
                </div>
             </div>
            <DialogFooter>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {selectedEvent ? "Save Changes" : "Create Event"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}
