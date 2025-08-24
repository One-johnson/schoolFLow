
"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useDatabase } from '@/hooks/use-database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, BookOpen, ClipboardCheck, DollarSign, Download, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


// Data types
type Student = { id: string; name: string; email: string; status: "Active" | "Inactive" | "Graduated" | "Continuing"; dateOfBirth?: string; placeOfBirth?: string; nationality?: string; hometown?: string; gender?: "Male" | "Female" | "Other"; address?: string; parentName?: string; parentPhone?: string; parentEmail?: string; avatarUrl?: string; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean> };
type Subject = { id: string; name: string; classId?: string; };
type StudentFee = { id: string; studentId: string; feeId: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type FeeStructure = { id: string; name: string; };
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceRecord = Record<string, AttendanceStatus>;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type FullAttendanceLog = { date: string; classId: string; studentId: string; studentName: string; status: AttendanceStatus; className: string };
type EnrichedFeeRecord = StudentFee & { feeName: string };
type Term = { id: string; name: string };
type Exam = { id: string; name: string; termId: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing" };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };

type EnrichedResult = {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
};

const statusColors = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  Late: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  Excused: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

const calculateGrade = (totalScore: number): { grade: string; remarks: string } => {
    if (totalScore >= 80) return { grade: "1", remarks: "Excellent" };
    if (totalScore >= 70) return { grade: "2", remarks: "Very Good" };
    if (totalScore >= 65) return { grade: "3", remarks: "Good" };
    if (totalScore >= 60) return { grade: "4", remarks: "High Average" };
    if (totalScore >= 55) return { grade: "5", remarks: "Average" };
    if (totalScore >= 50) return { grade: "6", remarks: "Low Average" };
    if (totalScore >= 45) return { grade: "7", remarks: "Pass" };
    if (totalScore >= 40) return { grade: "8", remarks: "Pass" };
    return { grade: "9", remarks: "Fail" };
};


export default function StudentInfoPage() {
    const params = useParams();
    const studentId = params.id as string;
    const { toast } = useToast();

    // Database Hooks
    const { data: students, loading: studentsLoading } = useDatabase<Student>('students');
    const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');
    const { data: studentFees, loading: feesLoading } = useDatabase<StudentFee>('studentFees');
    const { data: feeStructures, loading: feeStructuresLoading } = useDatabase<FeeStructure>('feeStructures');
    const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");
    const { data: terms, loading: termsLoading } = useDatabase<Term>("terms");
    const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
    const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");

    // Report Card State
    const [selectedTermId, setSelectedTermId] = React.useState<string>();
    const [selectedExamId, setSelectedExamId] = React.useState<string>();

    const loading = studentsLoading || classesLoading || subjectsLoading || feesLoading || feeStructuresLoading || attendanceLoading || termsLoading || examsLoading || gradesLoading;

    // Memoized Data
    const student = React.useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
    const enrolledClasses = React.useMemo(() => classes.filter(c => c.studentIds && c.studentIds[studentId]), [classes, studentId]);
    const enrolledSubjects = React.useMemo(() => {
        const enrolledClassIds = new Set(enrolledClasses.map(c => c.id));
        return subjects.filter(s => s.classId && enrolledClassIds.has(s.classId));
    }, [subjects, enrolledClasses]);
    const feesMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);
    const feesRecords: EnrichedFeeRecord[] = React.useMemo(() => {
        if (!studentId) return [];
        return studentFees.filter(sf => sf.studentId === studentId).map(sf => ({ ...sf, feeName: feesMap.get(sf.feeId) || "Unknown Fee" }));
    }, [studentFees, feesMap, studentId]);
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const attendanceHistory = React.useMemo<FullAttendanceLog[]>(() => {
        if (attendanceLoading || !studentId) return [];
        const flatData: FullAttendanceLog[] = [];
        rawAttendance.forEach(dailyRecord => {
            const date = dailyRecord.id;
            if (!dailyRecord || typeof dailyRecord !== 'object') return;
            Object.entries(dailyRecord).forEach(([classId, attendanceRecords]) => {
                if (classId === 'id' || !attendanceRecords || typeof attendanceRecords !== 'object') return;
                const status = (attendanceRecords as AttendanceRecord)[studentId];
                if (status) {
                    flatData.push({ date, classId, studentId, status, studentName: studentsMap.get(studentId) || 'Unknown', className: classesMap.get(classId) || 'Unknown' });
                }
            });
        });
        return flatData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawAttendance, studentsMap, classesMap, attendanceLoading, studentId]);

    const examsForTerm = React.useMemo(() => {
        if (!selectedTermId) return [];
        return exams.filter(e => e.termId === selectedTermId && e.status === "Published");
    }, [exams, selectedTermId]);

    const reportCardResults = React.useMemo<EnrichedResult[]>(() => {
        if (!student || !selectedExamId) return [];
        const studentGradesForExam = grades.filter(g => g.studentId === student.id && g.examId === selectedExamId);
        return studentGradesForExam.map(grade => {
            const totalScore = (grade.classScore * 0.5) + (grade.examScore * 0.5);
            const { grade: letterGrade, remarks } = calculateGrade(totalScore);
            return { subjectName: subjectsMap.get(grade.subjectId) || 'Unknown Subject', classScore: grade.classScore, examScore: grade.examScore, totalScore: parseFloat(totalScore.toFixed(2)), grade: letterGrade, remarks };
        });
    }, [student, selectedExamId, grades, subjectsMap]);


    const handleGenerateReportCard = () => {
        if (!student || !selectedTermId || !selectedExamId) {
            toast({ title: "Selection Required", description: "Please select a term and an exam period.", variant: "destructive"});
            return;
        }
        
        try {
            const doc = new jsPDF();
            const termName = terms.find(t => t.id === selectedTermId)?.name;
            const examName = exams.find(e => e.id === selectedExamId)?.name;
            const className = enrolledClasses[0]?.name || "N/A";
            
            // Header
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("SchoolFlow Academy", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
            doc.setFontSize(14);
            doc.text("Student Academic Report", doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
            
            // Student Info
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(`Student Name: ${student.name}`, 15, 45);
            doc.text(`Class: ${className}`, 15, 52);
            doc.text(`Academic Term: ${termName || 'N/A'}`, 15, 59);
            doc.text(`Examination: ${examName || 'N/A'}`, 15, 66);
            doc.text(`Date Issued: ${format(new Date(), 'PPP')}`, doc.internal.pageSize.getWidth() - 15, 45, { align: 'right' });


            // Results Table
            const tableColumn = ["Subject", "Class Score (50%)", "Exam Score (50%)", "Total Score", "Grade", "Remarks"];
            const tableRows = reportCardResults.map(r => [r.subjectName, r.classScore, r.examScore, r.totalScore, r.grade, r.remarks]);
            
            (doc as any).autoTable({
                startY: 75,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] } // Example color
            });
            
            // Footer
            const finalY = (doc as any).lastAutoTable.finalY || 150;
            doc.setFontSize(10);
            doc.text("Headmaster's Signature: ...................................", 15, finalY + 20);
            doc.text("Parent's Signature: ...................................", doc.internal.pageSize.getWidth() - 15, finalY + 20, { align: 'right'});
            
            doc.save(`report-card-${student.name.replace(/ /g, '_')}-${termName?.replace(/ /g, '_')}.pdf`);
            toast({ title: "Report Card Generated", description: "PDF has been downloaded." });

        } catch (error) {
            console.error(error);
            toast({ title: "Error Generating Report", variant: "destructive" });
        }

    }


    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!student) {
        return <div className="flex h-screen items-center justify-center">Student not found.</div>;
    }

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "S";
        const names = name.split(' ');
        return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    }

    const DetailItem = ({ label, value }: { label: string, value?: string | number | null }) => (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={student.avatarUrl} alt={student.name} />
                        <AvatarFallback className="text-3xl">{getInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <CardTitle className="text-3xl">{student.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                            <span>ID: {student.id}</span>
                            <span>|</span>
                            <span>{student.email}</span>
                        </CardDescription>
                    </div>
                     <Badge className={cn("border-transparent text-base px-4 py-2", {
                        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": student.status === 'Active',
                        "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": student.status === 'Inactive',
                     })}>{student.status}</Badge>
                </CardHeader>
            </Card>

            <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="profile"><User className="mr-2" /> Profile</TabsTrigger>
                    <TabsTrigger value="enrollment"><BookOpen className="mr-2" /> Enrollment</TabsTrigger>
                    <TabsTrigger value="attendance"><ClipboardCheck className="mr-2" /> Attendance</TabsTrigger>
                    <TabsTrigger value="fees"><DollarSign className="mr-2" /> Fees</TabsTrigger>
                    <TabsTrigger value="academics"><Award className="mr-2" /> Academics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <DetailItem label="Full Name" value={student.name} />
                                <DetailItem label="Email" value={student.email} />
                                <DetailItem label="Gender" value={student.gender} />
                                <DetailItem label="Date of Birth" value={student.dateOfBirth ? format(parseISO(student.dateOfBirth), 'PPP') : 'N/A'} />
                                <DetailItem label="Place of Birth" value={student.placeOfBirth} />
                                <DetailItem label="Nationality" value={student.nationality} />
                                <DetailItem label="Hometown" value={student.hometown} />
                                <DetailItem label="Address" value={student.address} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Parent/Guardian Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <DetailItem label="Parent Name" value={student.parentName} />
                                <DetailItem label="Parent Phone" value={student.parentPhone} />
                                <DetailItem label="Parent Email" value={student.parentEmail} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="enrollment" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Enrollment Details</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Enrolled Classes</h3>
                                    {enrolledClasses.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                            {enrolledClasses.map(c => <li key={c.id}>{c.name}</li>)}
                                        </ul>
                                    ) : <p className="text-muted-foreground">Not enrolled in any classes.</p>}
                                </div>
                                 <div>
                                    <h3 className="font-semibold mb-2">Enrolled Subjects</h3>
                                     {enrolledSubjects.length > 0 ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                            {enrolledSubjects.map(s => <li key={s.id}>{s.name}</li>)}
                                        </ul>
                                    ) : <p className="text-muted-foreground">Not enrolled in any subjects.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="attendance" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceHistory.length > 0 ? (
                                        attendanceHistory.map((log, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{format(parseISO(log.date), 'PPP')}</TableCell>
                                                <TableCell>{log.className}</TableCell>
                                                <TableCell><Badge className={cn("border-transparent", statusColors[log.status])}>{log.status}</Badge></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="text-center">No attendance records found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fees" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Fee Status</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fee Description</TableHead>
                                        <TableHead className="text-right">Amount Due</TableHead>
                                        <TableHead className="text-right">Amount Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feesRecords.length > 0 ? (
                                    feesRecords.map((fee) => (
                                        <TableRow key={fee.id}>
                                            <TableCell className="font-medium">{fee.feeName}</TableCell>
                                            <TableCell className="text-right">GH₵{fee.amountDue.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">GH₵{fee.amountPaid.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-semibold">GH₵{(fee.amountDue - fee.amountPaid).toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn("border-transparent", {
                                                    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300": fee.status === 'Paid',
                                                    "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300": fee.status === 'Unpaid',
                                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300": fee.status === 'Partial'
                                                })}>{fee.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                    ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                        No fees have been assigned to this student yet.
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </TableBody>
                                </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="academics" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Academic Reports</CardTitle>
                            <CardDescription>Select a term and exam to view results and generate a report card.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-wrap gap-4 items-end">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="term">Academic Term</Label>
                                    <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select Term" /></SelectTrigger>
                                        <SelectContent>
                                            {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="exam">Examination</Label>
                                    <Select value={selectedExamId} onValueChange={setSelectedExamId} disabled={!selectedTermId}>
                                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select Exam" /></SelectTrigger>
                                        <SelectContent>
                                            {examsForTerm.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleGenerateReportCard} disabled={!selectedExamId || reportCardResults.length === 0}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate Report Card
                                </Button>
                             </div>

                             {selectedExamId && (
                                <div className="pt-4">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Class Score</TableHead>
                                                <TableHead>Exam Score</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportCardResults.length > 0 ? (
                                                reportCardResults.map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{result.subjectName}</TableCell>
                                                        <TableCell>{result.classScore}%</TableCell>
                                                        <TableCell>{result.examScore}%</TableCell>
                                                        <TableCell className="font-bold">{result.totalScore}%</TableCell>
                                                        <TableCell><Badge variant="secondary">{result.grade}</Badge></TableCell>
                                                        <TableCell>{result.remarks}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">No results found for this exam.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                     </Table>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

