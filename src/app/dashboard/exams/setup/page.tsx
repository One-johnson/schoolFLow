
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  PlusCircle,
  Loader2,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarIcon,
  Clock,
  ListPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Data types
type Term = { id: string; name: string };
type Exam = { id: string; name: string; termId: string; status: "Upcoming" | "Ongoing" | "Grading" | "Published" };
type Class = { id: string; name: string };
type Subject = { id: string; name: string; classId?: string; };
type ExamSchedule = { id: string; examId: string; classId: string; subjectId: string; date: string; time: string; maxScore: number; };

export default function ExamSetupPage() {
  const { data: exams, addData, updateData, deleteData, loading } = useDatabase<Exam>("exams");
  const { data: terms, loading: termsLoading } = useDatabase<Term>("terms");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = React.useState(false);
  
  const [selectedExam, setSelectedExam] = React.useState<Exam | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  // State for Create/Edit Exam
  const [examForm, setExamForm] = React.useState<Partial<Exam>>({});
  
  // State for Schedule Dialog
  const { data: classes } = useDatabase<Class>("classes");
  const { data: subjects } = useDatabase<Subject>("subjects");
  const { data: schedules, addData: addSchedule } = useDatabase<ExamSchedule>("examSchedules");

  const [scheduleForm, setScheduleForm] = React.useState<Partial<Omit<ExamSchedule, 'id'>>>({});
  const [scheduleDate, setScheduleDate] = React.useState<Date | undefined>();

  const termsMap = React.useMemo(() => new Map(terms.map(t => [t.id, t.name])), [terms]);

  const handleCreateExam = async () => {
    if (!examForm.name?.trim() || !examForm.termId) {
      toast({ title: "Error", description: "Exam name and term are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await addData({ name: examForm.name, termId: examForm.termId, status: "Upcoming" } as Omit<Exam, 'id'>);
      toast({ title: "Success", description: "Examination created." });
      setExamForm({});
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create examination.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setExamForm(exam);
    setIsEditDialogOpen(true);
  };
  
  const openScheduleDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setIsScheduleDialogOpen(true);
  }

  const handleUpdateExam = async () => {
    if (!selectedExam || !examForm.name || !examForm.termId || !examForm.status) return;
    setIsLoading(true);
    try {
        await updateData(selectedExam.id, { name: examForm.name, termId: examForm.termId, status: examForm.status });
        toast({ title: "Success", description: "Examination updated." });
        setIsEditDialogOpen(false);
        setSelectedExam(null);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update examination.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    setIsLoading(true);
    try {
        await deleteData(id);
        toast({ title: "Success", description: "Examination deleted." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete examination.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
      if(!selectedExam || !scheduleForm.classId || !scheduleForm.subjectId || !scheduleDate || !scheduleForm.time || !scheduleForm.maxScore) {
          toast({ title: "Error", description: "All schedule fields are required.", variant: "destructive"});
          return;
      }
      setIsLoading(true);
      try {
          const newSchedule = {
              ...scheduleForm,
              examId: selectedExam.id,
              date: format(scheduleDate, 'yyyy-MM-dd'),
          }
          await addSchedule(newSchedule as Omit<ExamSchedule, 'id'>);
          toast({ title: "Success", description: "Exam schedule added."});
          setScheduleForm({});
          setScheduleDate(undefined);
      } catch (error) {
           toast({ title: "Error", description: "Failed to add schedule.", variant: "destructive"});
      } finally {
          setIsLoading(false);
      }
  }
  
  const examSchedules = React.useMemo(() => {
    if (!selectedExam) return [];
    return schedules.filter(s => s.examId === selectedExam.id);
  }, [schedules, selectedExam]);


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Exam Setup</CardTitle>
            <CardDescription>
              Create and manage examination periods and their schedules.
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { setIsCreateDialogOpen(isOpen); if(!isOpen) setExamForm({})}}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Examination</DialogTitle>
                <DialogDescription>Define a new examination period for the school.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Exam Name</Label>
                  <Input id="name" placeholder="e.g., Final Exams 2024" className="col-span-3" value={examForm.name || ""} onChange={(e) => setExamForm({...examForm, name: e.target.value})} disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="term" className="text-right">Academic Term</Label>
                  <Select value={examForm.termId} onValueChange={(value) => setExamForm({...examForm, termId: value})} disabled={isLoading || termsLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={termsLoading ? "Loading terms..." : "Select a term"} />
                      </SelectTrigger>
                      <SelectContent>
                          {terms.map(term => <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateExam} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? <p>Loading examinations...</p> :
            exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary"><FileText className="h-6 w-6"/></div>
                    <div>
                      <CardTitle className="text-lg">{exam.name}</CardTitle>
                      <CardDescription>{termsMap.get(exam.termId) || 'Unknown Term'}</CardDescription>
                    </div>
                  </div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => openEditDialog(exam)}><Pencil className="mr-2 h-4 w-4"/>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openScheduleDialog(exam)}><ListPlus className="mr-2 h-4 w-4"/>Manage Schedule</DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Exam</DropdownMenuItem>
                         </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the examination period and all related data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExam(exam.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardFooter>
                 <Badge>{exam.status}</Badge>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
      
       {/* Edit Exam Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if(!isOpen) { setSelectedExam(null); setExamForm({}); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Examination</DialogTitle>
              <DialogDescription>Update the details for this examination period.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Exam Name</Label>
                <Input id="edit-name" className="col-span-3" value={examForm.name || ""} onChange={(e) => setExamForm({...examForm, name: e.target.value})} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-term" className="text-right">Academic Term</Label>
                <Select value={examForm.termId} onValueChange={(value) => setExamForm({...examForm, termId: value})} disabled={isLoading || termsLoading}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={termsLoading ? "Loading terms..." : "Select a term"} />
                    </SelectTrigger>
                    <SelectContent>
                        {terms.map(term => <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                 <Select value={examForm.status} onValueChange={(value: Exam["status"]) => setExamForm(prev => ({...prev, status: value}))} disabled={isLoading}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Grading">Grading</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateExam} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={(isOpen) => { setIsScheduleDialogOpen(isOpen); if(!isOpen) setSelectedExam(null); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Schedule for {selectedExam?.name}</DialogTitle>
              <DialogDescription>Add or view scheduled papers for this examination.</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-5 gap-4 py-4">
                 <Select onValueChange={(v) => setScheduleForm(p => ({ ...p, classId: v}))}><SelectTrigger className="md:col-span-1"><SelectValue placeholder="Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                 <Select onValueChange={(v) => setScheduleForm(p => ({ ...p, subjectId: v}))}><SelectTrigger className="md:col-span-1"><SelectValue placeholder="Subject"/></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                 <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className={cn("md:col-span-1 justify-start", !scheduleDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{scheduleDate ? format(scheduleDate, 'PPP') : "Date"}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={scheduleDate} onSelect={setScheduleDate}/></PopoverContent>
                 </Popover>
                 <Input className="md:col-span-1" placeholder="Time (e.g., 09:00)" value={scheduleForm.time || ""} onChange={e => setScheduleForm(p=>({...p, time: e.target.value}))}/>
                 <Input className="md:col-span-1" type="number" placeholder="Max Score" value={scheduleForm.maxScore || ""} onChange={e => setScheduleForm(p=>({...p, maxScore: Number(e.target.value)}))}/>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleAddSchedule} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Add to Schedule
                </Button>
            </div>
            <Card className="mt-4">
              <CardHeader><CardTitle>Current Schedule</CardTitle></CardHeader>
              <CardContent>
                 {examSchedules.length > 0 ? (
                  <ul>{examSchedules.map(s => <li key={s.id}>{s.date} @ {s.time}: {subjects.find(sub => sub.id === s.subjectId)?.name} for {classes.find(c => c.id === s.classId)?.name}</li>)}</ul>
                  ) : <p className="text-muted-foreground">No papers scheduled yet.</p>}
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
    </>
  );
}
