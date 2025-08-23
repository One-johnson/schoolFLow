
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2, FileDown, FileUp, Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
type Class = { id: string; name: string };
type Subject = { id: string; name: string; classId?: string };
type Teacher = { id: string; name: string };
type TimetableEntry = {
  subjectId: string;
  teacherId: string;
};
type DailyTimetable = { [timeSlot: string]: TimetableEntry };
type ClassTimetable = { [day: string]: DailyTimetable };

// Constants
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "08:00 - 09:10",
  "09:10 - 10:20",
  "10:20 - 10:50", // Break
  "10:50 - 12:00",
  "12:00 - 13:10",
  "13:10 - 14:00", // Lunch
  "14:00 - 15:10",
  "15:10 - 16:20", // The user's spec ends at 3:30pm, this slot overruns. We'll follow the 6 periods structure.
];

const badgeColors = [
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-teal-100 text-teal-800",
    "bg-indigo-100 text-indigo-800",
    "bg-rose-100 text-rose-800",
];

const getBadgeColor = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % badgeColors.length);
    return badgeColors[index];
};


export default function TimetablePage() {
  const { role } = useAuth();
  const { toast } = useToast();
  
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: teachers, loading: teachersLoading } = useDatabase<Teacher>("teachers");
  const { data: timetables, updateData, loading: timetablesLoading } = useDatabase<ClassTimetable>("timetables");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>();
  const [selectedDay, setSelectedDay] = React.useState<string | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | undefined>();
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>();
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string | undefined>();
  
  const loading = classesLoading || subjectsLoading || teachersLoading || timetablesLoading;

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const teachersMap = React.useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  
  const timetableForClass = React.useMemo(() => {
    if (!selectedClassId) return null;
    return timetables.find(t => t.id === selectedClassId) || { id: selectedClassId };
  }, [timetables, selectedClassId]);

  const handleSaveEntry = async () => {
    if (!selectedClassId || !selectedDay || !selectedTimeSlot || !selectedSubjectId || !selectedTeacherId) {
        toast({ title: "Error", description: "All fields are required.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    const path = `${selectedClassId}/${selectedDay}/${selectedTimeSlot.replace(/ /g, '')}`;
    const dataToSave = { subjectId: selectedSubjectId, teacherId: selectedTeacherId };
    
    try {
        // useDatabase hook's updateData is for top-level keys. We need to update nested paths.
        // Let's create a temporary direct call to firebase update. We'll refactor useDatabase later if needed.
        const { getDatabase, ref, update } = await import("firebase/database");
        const db = getDatabase();
        const timetableRef = ref(db, `timetables/${path}`);
        await update(ref(db, 'timetables'), { [path]: dataToSave });
        
        toast({ title: "Success", description: "Timetable updated." });
        setIsCreateDialogOpen(false);
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to save timetable entry.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }

  const renderCellContent = (day: string, time: string) => {
    const entry = timetableForClass?.[day]?.[time.replace(/ /g, '')] as TimetableEntry | undefined;

    if (time === "10:20 - 10:50") return <div className="text-center font-bold text-green-600">Break</div>;
    if (time === "13:10 - 14:00") return <div className="text-center font-bold text-orange-600">Lunch</div>;

    if (!entry) return null;

    const subjectName = subjectsMap.get(entry.subjectId);
    const teacherName = teachersMap.get(entry.teacherId);
    
    if (!subjectName || !teacherName) return <div className="text-xs text-muted-foreground">Invalid Entry</div>

    return (
        <div className="flex flex-col gap-1 text-center">
            <Badge className={cn("text-xs justify-center", getBadgeColor(subjectName))}>{subjectName}</Badge>
            <span className="text-xs text-muted-foreground">{teacherName}</span>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">
            Manage and view class schedules.
          </p>
        </div>
        {role === 'admin' && (
             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Create/Edit Entry</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create/Edit Timetable Entry</DialogTitle>
                        <DialogDescription>Select a class, day, time, subject, and teacher to create or update an entry.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Class</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isLoading}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a class" /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Day</Label>
                            <Select value={selectedDay} onValueChange={setSelectedDay} disabled={isLoading}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a day" /></SelectTrigger>
                                <SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Time Slot</Label>
                             <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot} disabled={isLoading}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a time slot" /></SelectTrigger>
                                <SelectContent>
                                    {timeSlots.filter(t => !t.includes("Break") && !t.includes("Lunch")).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Subject</Label>
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={isLoading}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>{subjects.filter(s => !selectedClassId || s.classId === selectedClassId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Teacher</Label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={isLoading}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                                <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveEntry} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>

       <div className="flex flex-wrap items-center gap-4">
            <Label>Filter by Class:</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a class to view" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
                <Button variant="outline" disabled><FileUp className="mr-2" /> Import</Button>
                <Button variant="outline" disabled><FileDown className="mr-2" /> Export CSV</Button>
                <Button variant="outline" disabled><Printer className="mr-2" /> Print</Button>
            </div>
       </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/8 font-bold text-center sticky left-0 bg-background z-10">Time</TableHead>
              {daysOfWeek.map((day) => (
                <TableHead key={day} className="w-1/6 text-center font-bold">{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={6} className="h-96 text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></TableCell></TableRow>
            ) : selectedClassId ? (
                timeSlots.map((time, index) => (
                <TableRow key={time}>
                    <TableCell className="font-semibold text-center text-xs sticky left-0 bg-background z-10">{time}</TableCell>
                    {daysOfWeek.map((day) => (
                    <TableCell key={day} className="h-20 p-1 border-l text-center align-middle">
                        {renderCellContent(day, time)}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                 <TableRow><TableCell colSpan={6} className="h-96 text-center text-muted-foreground">Please select a class to view the timetable.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
