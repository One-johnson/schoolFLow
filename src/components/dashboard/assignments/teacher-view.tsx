
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, CalendarIcon, UploadCloud, File, Download, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
type Assignment = { id: string; title: string; description: string; classId: string; subjectId: string; teacherId: string; createdAt: number; dueDate: string; fileUrl?: string; fileName?: string; };
type Submission = { id: string; assignmentId: string; studentId: string; submittedAt: number; fileUrl: string; fileName: string; grade?: number; feedback?: string; status: 'Submitted' | 'Late'; };
type Class = { id: string; name: string; teacherId?: string; studentIds?: Record<string, boolean>; };
type Subject = { id: string; name: string; classIds?: Record<string, boolean>; teacherIds?: Record<string, boolean>; };
type Student = { id: string; name: string; avatarUrl?: string; };

export default function TeacherAssignmentsView() {
    const { user, role } = useAuth();
    const { toast } = useToast();

    // Database Hooks
    const { data: assignments, addData, updateData, deleteData, loading: assignmentsLoading } = useDatabase<Assignment>("assignments");
    const { data: submissions, updateData: updateSubmission, loading: submissionsLoading } = useDatabase<Submission>("submissions");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { uploadFile } = useDatabase<any>('assignments'); // For file uploads
    const { addData: addNotification } = useDatabase("notifications");


    // State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
    const [newAssignment, setNewAssignment] = React.useState<Partial<Omit<Assignment, 'id' | 'createdAt'>>>({});
    const [editAssignment, setEditAssignment] = React.useState<Partial<Assignment>>({});
    const [dueDate, setDueDate] = React.useState<Date | undefined>();
    const [assignmentFile, setAssignmentFile] = React.useState<File | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [grades, setGrades] = React.useState<Record<string, number | undefined>>({});
    const [feedbacks, setFeedbacks] = React.useState<Record<string, string>>({});

    const loading = assignmentsLoading || submissionsLoading || classesLoading || subjectsLoading || studentsLoading;

    // Memoized data
    const teacherClasses = React.useMemo(() => (role === 'admin' ? classes : classes.filter(c => c.teacherId === user?.uid)), [classes, user, role]);
    const teacherSubjects = React.useMemo(() => (role === 'admin' ? subjects : subjects.filter(s => s.teacherIds && s.teacherIds[user?.uid!])), [subjects, user, role]);
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const teacherAssignments = React.useMemo(() => (
        (role === 'admin' ? assignments : assignments.filter(a => a.teacherId === user?.uid)).sort((a,b) => b.createdAt - a.createdAt)
    ), [assignments, user, role]);
    
    const submissionsMap = React.useMemo(() => {
        const map = new Map<string, Submission[]>();
        submissions.forEach(sub => {
            const list = map.get(sub.assignmentId) || [];
            list.push(sub);
            map.set(sub.assignmentId, list);
        });
        return map;
    }, [submissions]);

    // Handlers
    const handleCreateAssignment = async () => {
        if (!newAssignment.title || !newAssignment.classId || !newAssignment.subjectId || !dueDate) {
            toast({ title: "Error", description: "Title, class, subject, and due date are required.", variant: "destructive" });
            return;
        }
    
        setIsLoading(true);
        try {
            const assignmentData: Partial<Omit<Assignment, 'id'>> = {
                ...newAssignment,
                teacherId: user!.uid,
                dueDate: format(dueDate, "yyyy-MM-dd"),
            };
    
            if (assignmentFile) {
                assignmentData.fileUrl = await uploadFile(assignmentFile, `assignments/${assignmentFile.name}_${Date.now()}`);
                assignmentData.fileName = assignmentFile.name;
            }
    
            await addData(assignmentData as Omit<Assignment, 'id' | 'createdAt'>);
            
            // Notify students in the class
            const targetClass = classes.find(c => c.id === newAssignment.classId);
            if (targetClass?.studentIds) {
                const studentIds = Object.keys(targetClass.studentIds);
                const subjectName = subjectsMap.get(newAssignment.subjectId);
                for (const studentId of studentIds) {
                    await addNotification({
                        type: 'assignment_created',
                        message: `New assignment "${assignmentData.title}" posted for ${subjectName}.`,
                        recipientId: studentId,
                        read: false
                    } as any);
                }
            }
    
            toast({ title: "Success", description: "Assignment created and students notified." });
            setIsCreateDialogOpen(false);
            setNewAssignment({});
            setDueDate(undefined);
            setAssignmentFile(null);
        } catch (error) {
            console.error("Assignment creation error:", error);
            toast({ title: "Error", description: "Failed to create assignment.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const openEditDialog = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setEditAssignment(assignment);
        setDueDate(parseISO(assignment.dueDate));
        setAssignmentFile(null);
        setIsEditDialogOpen(true);
    };

    const handleUpdateAssignment = async () => {
        if (!selectedAssignment || !editAssignment.title || !editAssignment.classId || !editAssignment.subjectId || !dueDate) {
            toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const assignmentData: Partial<Assignment> = {
                title: editAssignment.title,
                description: editAssignment.description,
                classId: editAssignment.classId,
                subjectId: editAssignment.subjectId,
                dueDate: format(dueDate, "yyyy-MM-dd"),
            };

            // Note: Currently does not support changing the attachment.
            // A more robust solution would handle file deletion and re-upload.

            await updateData(selectedAssignment.id, assignmentData);
            toast({ title: "Success", description: "Assignment updated." });
            setIsEditDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to update assignment.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        setIsLoading(true);
        try {
            // Note: Does not delete submission files from storage. This would require more complex logic, potentially a Cloud Function.
            await deleteData(assignmentId);
            // Optionally, delete all related submissions from the database
            const relatedSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
            for (const sub of relatedSubmissions) {
                await deleteData(sub.id);
            }
            toast({ title: "Success", description: "Assignment and all its submissions have been deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete assignment.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGradeSubmission = async (submissionId: string) => {
        const grade = grades[submissionId];
        const feedback = feedbacks[submissionId];

        if (grade === undefined) {
             toast({ title: "Error", description: "Grade is required.", variant: "destructive" });
             return;
        }

        setIsLoading(true);
        try {
            await updateSubmission(submissionId, { grade, feedback });
            toast({ title: "Success", description: "Grade submitted." });
        } catch (error) {
             toast({ title: "Error", description: "Failed to submit grade.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    
    const getInitials = (name: string | undefined) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Assignments</h2>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Assignment</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Assignment</DialogTitle>
                            <DialogDescription>Fill out the details below to post a new assignment.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Assignment Title" value={newAssignment.title || ''} onChange={e => setNewAssignment(p => ({...p, title: e.target.value}))} />
                            <Textarea placeholder="Description and instructions..." value={newAssignment.description || ''} onChange={e => setNewAssignment(p => ({...p, description: e.target.value}))} rows={5} />
                            <div className="grid md:grid-cols-3 gap-4">
                                <Select value={newAssignment.classId} onValueChange={v => setNewAssignment(p => ({...p, classId: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger>
                                    <SelectContent>{teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                 <Select value={newAssignment.subjectId} onValueChange={v => setNewAssignment(p => ({...p, subjectId: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger>
                                    <SelectContent>{teacherSubjects.filter(s => s.classIds && newAssignment.classId && s.classIds[newAssignment.classId]).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4"/>
                                            {dueDate ? format(dueDate, "PPP") : <span>Due Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label htmlFor="assignment-file" className="block text-sm font-medium mb-2">Attach File (Optional)</Label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="assignment-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                            {assignmentFile ? (
                                                <p className="text-sm text-foreground">{assignmentFile.name}</p>
                                            ) : (
                                                <>
                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, JPG (MAX. 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <Input id="assignment-file" type="file" className="hidden" onChange={e => setAssignmentFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateAssignment} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Post Assignment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
            {loading ? <p>Loading assignments...</p> : teacherAssignments.map(assignment => {
                const submissionsForAssignment = submissionsMap.get(assignment.id) || [];
                const assignmentClass = classes.find(c => c.id === assignment.classId);
                const studentsInClass = assignmentClass?.studentIds ? Object.keys(assignmentClass.studentIds).map(id => studentsMap.get(id)).filter(Boolean) as Student[] : [];
                
                return (
                <Card key={assignment.id}>
                <AccordionItem value={assignment.id} className="border-b-0">
                    <CardHeader>
                        <AccordionTrigger className="w-full text-left group">
                            <div className="flex-1">
                                <CardTitle>{assignment.title}</CardTitle>
                                <CardDescription>For {classesMap.get(assignment.classId)} - {subjectsMap.get(assignment.subjectId)} | Due: {format(parseISO(assignment.dueDate), "PPP")}</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={isPast(parseISO(assignment.dueDate)) ? "destructive" : "secondary"}>
                                    {isPast(parseISO(assignment.dueDate)) ? "Past Due" : "Active"}
                                </Badge>
                                <Badge>{submissionsForAssignment.length} / {studentsInClass.length} Submitted</Badge>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onSelect={() => openEditDialog(assignment)}>
                                                <Pencil className="mr-2 h-4 w-4"/> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator/>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the assignment and all student submissions. This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Delete"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent>
                            <p className="text-sm mb-4">{assignment.description}</p>
                            {assignment.fileUrl && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/> {assignment.fileName || 'Download Attachment'}</a>
                                </Button>
                            )}
                            
                            <h4 className="font-semibold mt-6 mb-2">Submissions</h4>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Submission</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Feedback</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsInClass.map(student => {
                                            if(!student) return null;
                                            const submission = submissionsForAssignment.find(s => s.studentId === student.id);
                                            return (
                                                <TableRow key={student.id}>
                                                    <TableCell className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={student.avatarUrl}/><AvatarFallback>{getInitials(student.name)}</AvatarFallback></Avatar>
                                                        {student.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {submission ? <Badge variant="secondary">{submission.status}</Badge> : <Badge variant="destructive">Not Submitted</Badge>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {submission && (
                                                            <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                                                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer"><File className="mr-1 h-3 w-3"/>{submission.fileName}</a>
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input type="number" max={100} className="h-8 w-20" placeholder="Grade" defaultValue={submission?.grade} onChange={e => setGrades(p => ({ ...p, [submission!.id]: Number(e.target.value) }))} disabled={!submission || isLoading} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input className="h-8" placeholder="Feedback..." defaultValue={submission?.feedback} onChange={e => setFeedbacks(p => ({ ...p, [submission!.id]: e.target.value }))} disabled={!submission || isLoading}/>
                                                    </TableCell>
                                                    <TableCell>
                                                         <Button size="sm" onClick={() => handleGradeSubmission(submission!.id)} disabled={!submission || isLoading}>
                                                            <Send className="h-4 w-4"/>
                                                         </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
                </Card>
            )})}
            </Accordion>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Assignment</DialogTitle>
                        <DialogDescription>Update the details for this assignment.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Assignment Title" value={editAssignment.title || ''} onChange={e => setEditAssignment(p => ({...p, title: e.target.value}))} />
                        <Textarea placeholder="Description and instructions..." value={editAssignment.description || ''} onChange={e => setEditAssignment(p => ({...p, description: e.target.value}))} rows={5} />
                        <div className="grid md:grid-cols-3 gap-4">
                            <Select value={editAssignment.classId} onValueChange={v => setEditAssignment(p => ({...p, classId: v}))}>
                                <SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger>
                                <SelectContent>{teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={editAssignment.subjectId} onValueChange={v => setEditAssignment(p => ({...p, subjectId: v}))}>
                                <SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger>
                                <SelectContent>{teacherSubjects.filter(s => s.classIds && editAssignment.classId && s.classIds[editAssignment.classId]).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                        {dueDate ? format(dueDate, "PPP") : <span>Due Date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        {selectedAssignment?.fileName && (
                             <div className="text-sm text-muted-foreground">Attachment: {selectedAssignment.fileName} (Cannot be changed)</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateAssignment} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
