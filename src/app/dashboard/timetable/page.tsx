
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, FileUp, Printer, Save, XCircle, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import _ from 'lodash';
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

// Types
type Class = { id: string; name: string };
type Subject = { id:string; name: string; classId?: string };
type Teacher = { id: string; name: string };
type TimetableEntry = {
  subjectId: string;
  teacherId: string;
};
type DailyTimetable = { [timeSlot: string]: TimetableEntry | null };
type ClassTimetable = { [day: string]: DailyTimetable };

// Constants
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "08:00-09:10",
  "09:10-10:20",
  "10:20-10:50", // Break
  "10:50-12:00",
  "12:00-13:10",
  "13:10-14:00", // Lunch
  "14:00-15:10",
  "15:10-16:20", 
];
const BREAK_TIME = "10:20-10:50";
const LUNCH_TIME = "13:10-14:00";


export default function TimetablePage() {
  const { role } = useAuth();
  const { toast } = useToast();
  
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: teachers, loading: teachersLoading } = useDatabase<Teacher>("teachers");
  const { data: timetables, updateData, loading: timetablesLoading, deleteData } = useDatabase<ClassTimetable>("timetables");

  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>();
  const [editableTimetable, setEditableTimetable] = React.useState<ClassTimetable>({});
  
  const loading = classesLoading || subjectsLoading || teachersLoading || timetablesLoading;

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const teachersMap = React.useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
  
  const originalTimetableForClass = React.useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return {};
    const tt = timetables.find(t => t.id === selectedClassId) || {};
    // Remove id property before storing as timetable
    const { id, ...rest } = tt;
    return rest as ClassTimetable;
  }, [timetables, selectedClassId]);

  // When class changes, reset editable timetable
  React.useEffect(() => {
    setEditableTimetable(_.cloneDeep(originalTimetableForClass));
  }, [originalTimetableForClass, selectedClassId]);

  const hasChanges = React.useMemo(() => {
    return !_.isEqual(originalTimetableForClass, editableTimetable);
  }, [originalTimetableForClass, editableTimetable]);

  const handleTimetableChange = (day: string, time: string, type: 'subject' | 'teacher', value: string) => {
    setEditableTimetable(prev => {
        const newTimetable = _.cloneDeep(prev);
        const entry = newTimetable[day]?.[time] || { subjectId: '', teacherId: '' };
        if (type === 'subject') {
            entry.subjectId = value;
        } else {
            entry.teacherId = value;
        }
        
        if (!newTimetable[day]) newTimetable[day] = {};
        newTimetable[day][time] = (entry.subjectId || entry.teacherId) ? entry : null;

        // Clean up empty day objects
        if (_.isEmpty(newTimetable[day])) delete newTimetable[day];
        
        return newTimetable;
    });
  };

  const handleClearEntry = (day: string, time: string) => {
     setEditableTimetable(prev => {
        const newTimetable = _.cloneDeep(prev);
        if (newTimetable[day]?.[time]) {
            newTimetable[day][time] = null;
        }
        return newTimetable;
    });
  }

  const handleSaveChanges = async () => {
    if (!selectedClassId || selectedClassId === 'all') return;
    setIsLoading(true);
    try {
        // clean up null entries before saving
        const cleanedTimetable = _.cloneDeep(editableTimetable);
        for(const day in cleanedTimetable) {
            for(const time in cleanedTimetable[day]) {
                if(cleanedTimetable[day][time] === null) {
                    delete cleanedTimetable[day][time];
                }
            }
            if (_.isEmpty(cleanedTimetable[day])) {
                delete cleanedTimetable[day];
            }
        }
        await updateData(selectedClassId, cleanedTimetable);
        toast({ title: "Success", description: "Timetable saved successfully."});
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to save timetable.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const handleCancelChanges = () => {
      setEditableTimetable(_.cloneDeep(originalTimetableForClass));
  }

  const handleClearTimetable = async () => {
      if(!selectedClassId || selectedClassId === 'all') return;
      setIsLoading(true);
      try {
        await deleteData(selectedClassId);
        setEditableTimetable({});
        toast({ title: "Success", description: "Timetable has been cleared."});
      } catch(error) {
         toast({ title: "Error", description: "Failed to clear timetable.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  }

  const subjectsForClass = React.useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return subjects;
    return subjects.filter(s => !s.classId || s.classId === selectedClassId);
  }, [subjects, selectedClassId]);


  const renderTimetableGrid = (timetableData: ClassTimetable, isEditable: boolean) => (
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
            {timeSlots.map((time) => {
                if (time === BREAK_TIME) return <TableRow key={time}><TableCell colSpan={6} className="text-center font-bold text-green-600 bg-green-50 dark:bg-green-900/20">Break</TableCell></TableRow>
                if (time === LUNCH_TIME) return <TableRow key={time}><TableCell colSpan={6} className="text-center font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20">Lunch</TableCell></TableRow>

                return (
                    <TableRow key={time}>
                        <TableCell className="font-semibold text-center text-xs sticky left-0 bg-background z-10">{time.replace('-', ' - ')}</TableCell>
                        {daysOfWeek.map((day) => {
                            const entry = timetableData[day]?.[time];
                            return (
                                <TableCell key={day} className="h-24 p-1 border-l text-center align-middle">
                                    {isEditable ? (
                                        <div className="flex flex-col gap-1.5">
                                             <Select 
                                                value={entry?.subjectId || ''} 
                                                onValueChange={(value) => handleTimetableChange(day, time, 'subject', value)}
                                             >
                                                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Subject" /></SelectTrigger>
                                                <SelectContent>
                                                    {subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Select 
                                                value={entry?.teacherId || ''} 
                                                onValueChange={(value) => handleTimetableChange(day, time, 'teacher', value)}
                                            >
                                                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Teacher" /></SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {entry && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 self-center" onClick={() => handleClearEntry(day, time)}>
                                                    <Trash2 className="h-3 w-3 text-destructive"/>
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        entry ? (
                                            <div className="flex flex-col gap-1 text-center">
                                                <Badge className="text-xs justify-center">{subjectsMap.get(entry.subjectId)}</Badge>
                                                <span className="text-xs text-muted-foreground">{teachersMap.get(entry.teacherId)}</span>
                                            </div>
                                        ) : null
                                    )}
                                </TableCell>
                            )
                         })}
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>
  )


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground">
            {role === 'admin' ? "Create, manage, and view class schedules." : "View class schedules."}
          </p>
        </div>
        {role === 'admin' && hasChanges && selectedClassId !== 'all' && (
            <div className="flex gap-2">
                <Button onClick={handleSaveChanges} disabled={isLoading}>
                   {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />} Save Changes
                </Button>
                 <Button variant="outline" onClick={handleCancelChanges} disabled={isLoading}>
                    <XCircle className="mr-2"/> Cancel
                </Button>
            </div>
        )}
      </div>

       <div className="flex flex-wrap items-center gap-4">
            <Label>Filter by Class:</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={hasChanges}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select a class to view" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
            {hasChanges && <Badge variant="destructive">Unsaved changes</Badge>}
            <div className="ml-auto flex gap-2">
                 {role === 'admin' && selectedClassId && selectedClassId !== 'all' && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" disabled={isLoading}>
                                <Trash2 className="mr-2"/> Clear Full Timetable
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete the entire timetable for {classes.find(c => c.id === selectedClassId)?.name}. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearTimetable} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
                <Button variant="outline" disabled><FileUp className="mr-2" /> Import</Button>
                <Button variant="outline" disabled><FileDown className="mr-2" /> Export CSV</Button>
                <Button variant="outline" disabled><Printer className="mr-2" /> Print</Button>
            </div>
       </div>

        {loading ? (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            </div>
        ) : selectedClassId === 'all' ? (
            <div className="space-y-8">
                {timetables.length > 0 ? timetables.map(tt => {
                    const { id, ...timetableData } = tt;
                    return (
                         <Card key={id}>
                            <CardHeader>
                                <CardTitle>{classesMap.get(id) || "Unknown Class"}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderTimetableGrid(timetableData as ClassTimetable, false)}
                            </CardContent>
                        </Card>
                    )
                }) : (
                     <div className="flex h-96 items-center justify-center">
                        <p className="text-muted-foreground">No timetables have been created yet.</p>
                    </div>
                )}
            </div>
        ) : selectedClassId ? (
            renderTimetableGrid(editableTimetable, role === 'admin')
        ) : (
            <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">Please select a class to view the timetable.</p>
            </div>
        )}
    </div>
  );
}
