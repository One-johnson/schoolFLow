
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileUp } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

// Types
type Assignment = { id: string; title: string; description: string; classId: string; subjectId: string; teacherId: string; createdAt: number; dueDate: string; fileUrl?: string; fileName?: string; };
type Submission = { id: string; assignmentId: string; studentId: string; submittedAt: number; fileUrl: string; fileName: string; grade?: number; feedback?: string; status: 'Submitted' | 'Late'; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; };
type Subject = { id: string; name: string; };

export default function StudentAssignmentsView() {
    const { user, role } = useAuth();
    const { toast } = useToast();

    // Database Hooks
    const { data: assignments, loading: assignmentsLoading } = useDatabase<Assignment>("assignments");
    const { data: submissions, addDataWithId, loading: submissionsLoading } = useDatabase<Submission>("submissions");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
    const { uploadFile } = useDatabase<any>('submissions');

    // State
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false);
    const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
    const [submissionFile, setSubmissionFile] = React.useState<File | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);

    const loading = assignmentsLoading || submissionsLoading || classesLoading || subjectsLoading;

    // Memoized data
    const studentClass = React.useMemo(() => (
        role === 'student' && user ? classes.find(c => c.studentIds && c.studentIds[user.uid]) : null
    ), [classes, user, role]);
    
    const myAssignments = React.useMemo(() => (
        (role === 'admin' ? assignments : studentClass ? assignments.filter(a => a.classId === studentClass.id) : []).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    ), [assignments, studentClass, role]);
    
    const mySubmissionsMap = React.useMemo(() => {
        const map = new Map<string, Submission>();
        if (!user) return map;
        submissions.filter(s => s.studentId === user.uid).forEach(sub => {
            map.set(sub.assignmentId, sub);
        });
        return map;
    }, [submissions, user]);
    
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    // Handlers
    const openSubmitDialog = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionFile(null);
        setIsSubmitDialogOpen(true);
    };

    const handleFileSubmit = async () => {
        if (!submissionFile || !selectedAssignment || !user) {
            toast({ title: "Error", description: "No file selected or assignment invalid.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);
        
        try {
            const fileUrl = await uploadFile(submissionFile, `submissions/${user.uid}/${submissionFile.name}_${Date.now()}`);
            setUploadProgress(100);

            const submissionId = `${selectedAssignment.id}_${user.uid}`;
            const isLate = isPast(new Date(selectedAssignment.dueDate));
            
            await addDataWithId(submissionId, {
                assignmentId: selectedAssignment.id,
                studentId: user.uid,
                fileUrl,
                fileName: submissionFile.name,
                status: isLate ? 'Late' : 'Submitted'
            } as Omit<Submission, 'id' | 'submittedAt'>);

            toast({ title: "Success", description: "Your assignment has been submitted." });
            setIsSubmitDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit assignment.", variant: "destructive" });
        } finally {
            setIsLoading(false);
            setUploadProgress(null);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">My Assignments</h2>
                
                {loading ? <p>Loading assignments...</p> : myAssignments.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">No assignments found.</CardContent></Card>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                    {myAssignments.map(assignment => {
                        const submission = mySubmissionsMap.get(assignment.id);
                        const isDueDatePast = isPast(parseISO(assignment.dueDate));
                        return (
                            <Card key={assignment.id}>
                            <AccordionItem value={assignment.id} className="border-b-0">
                                <CardHeader>
                                    <AccordionTrigger className="w-full text-left">
                                        <div className="flex-1">
                                            <CardTitle>{assignment.title}</CardTitle>
                                            <CardDescription>{subjectsMap.get(assignment.subjectId)} | Due: {format(parseISO(assignment.dueDate), "PPP")}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={submission ? "secondary" : isDueDatePast ? "destructive" : "default"}>
                                                {submission ? submission.status : isDueDatePast ? "Past Due" : "Pending"}
                                            </Badge>
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
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center">
                                        {submission ? (
                                            <div className="text-sm space-y-2">
                                                <p><strong>Submitted:</strong> {submission.fileName}</p>
                                                {submission.grade !== undefined && (
                                                    <div>
                                                        <p><strong>Grade:</strong> <span className="font-bold text-lg text-primary">{submission.grade}/100</span></p>
                                                        {submission.feedback && <p className="italic text-muted-foreground"><strong>Feedback:</strong> {submission.feedback}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div></div>
                                        )}
                                        {!isDueDatePast && !submission && (
                                            <Button onClick={() => openSubmitDialog(assignment)}>
                                                <FileUp className="mr-2 h-4 w-4"/> Submit Work
                                            </Button>
                                        )}
                                        {isDueDatePast && !submission && <p className="text-destructive font-semibold">Due date has passed. Submission closed.</p>}
                                    </CardFooter>
                                </AccordionContent>
                            </AccordionItem>
                            </Card>
                        )
                    })}
                    </Accordion>
                )}
            </div>

            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit: {selectedAssignment?.title}</DialogTitle>
                        <DialogDescription>Upload your completed assignment file below. Only one file can be submitted.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="submission-file" className="block text-sm font-medium mb-2">Your File</Label>
                        <Input id="submission-file" type="file" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} disabled={isLoading} />
                        {submissionFile && <p className="text-sm mt-2 text-muted-foreground">Selected: {submissionFile.name}</p>}
                        {uploadProgress !== null && (
                            <div className="mt-4">
                                <Progress value={uploadProgress} />
                                <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleFileSubmit} disabled={isLoading || !submissionFile}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
