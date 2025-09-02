
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/use-database';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, BookOpen, ClipboardCheck, DollarSign, Download, Award, ChevronDown, ShieldAlert, Edit, PlusCircle, Trash2, MoreHorizontal, Activity as ActivityIcon } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, calculateGrade } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, Pie, PieChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// Data types
type Student = { id: string; name: string; email: string; status: "Active" | "Inactive" | "Graduated" | "Continuing"; dateOfBirth?: string; placeOfBirth?: string; nationality?: string; hometown?: string; gender?: "Male" | "Female" | "Other"; address?: string; parentName?: string; parentPhone?: string; parentEmail?: string; avatarUrl?: string; admissionNo: string; studentId: string; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>, teacherId?: string };
type Subject = { id: string; name: string; classId?: string; };
type StudentFee = { id: string; studentId: string; feeId: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type FeeStructure = { id: string; name: string; };
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceEntry = { status: AttendanceStatus, comment?: string };
type AttendanceRecord = Record<string, AttendanceEntry>;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type FullAttendanceLog = { date: string; classId: string; studentId: string; studentName: string; status: AttendanceStatus; className: string };
type EnrichedFeeRecord = StudentFee & { feeName: string };
type Term = { id: string; name: string; startDate?: string; endDate?: string; status: 'Active' | 'Inactive' | 'Completed' };
type Exam = { id: string; name: string; termId: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing" };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; teacherComment?: string };
type Activity = { id: string; name: string; type: string; role: string; startDate: string; endDate: string; };

type EnrichedResult = {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
    teacherComment?: string;
};

const statusColors = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  Late: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  Excused: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

const PIE_CHART_COLORS = ["#22c55e", "#ef4444", "#f97316", "#3b82f6"]; // Green, Red, Orange, Blue

export default function StudentInfoPage() {
    const params = useParams();
    const router = useRouter();
    const studentIdParams = params.id as string;
    const { user, role } = useAuth();
    const { toast } = useToast();

    // Database Hooks
    const { data: students, updateData: updateStudent, loading: studentsLoading } = useDatabase<Student>('students');
    const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');
    const { data: studentFees, loading: feesLoading } = useDatabase<StudentFee>('studentFees');
    const { data: feeStructures, loading: feeStructuresLoading } = useDatabase<FeeStructure>('feeStructures');
    const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");
    const { data: terms, loading: termsLoading } = useDatabase<Term>("terms");
    const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
    const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");
    const { data: activities, addData: addActivity, updateData: updateActivity, deleteData: deleteActivity, loading: activitiesLoading } = useDatabase<Activity>(`studentActivities/${studentIdParams}`);


    // State
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isActivityDialogOpen, setIsActivityDialogOpen] = React.useState(false);
    const [editStudentState, setEditStudentState] = React.useState<Partial<Student>>({});
    const [activityFormState, setActivityFormState] = React.useState<Partial<Activity>>({});
    const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null);
    const [isUpdating, setIsUpdating] = React.useState(false);

    // Report Card State
    const [selectedTermId, setSelectedTermId] = React.useState<string>();
    const [selectedExamId, setSelectedExamId] = React.useState<string>();

    const loading = studentsLoading || classesLoading || subjectsLoading || feesLoading || feeStructuresLoading || attendanceLoading || termsLoading || examsLoading || gradesLoading || activitiesLoading;

    // Memoized Data
    const student = React.useMemo(() => students.find(s => s.id === studentIdParams), [students, studentIdParams]);
    const enrolledClasses = React.useMemo(() => classes.filter(c => c.studentIds && c.studentIds[studentIdParams]), [classes, studentIdParams]);
    
    const canEditProfile = (role === 'admin') || (role === 'student' && user?.uid === studentIdParams);

    // Check permissions
    React.useEffect(() => {
        if (loading || !user || !role || !student) return;

        if (role === 'student' && user.uid !== studentIdParams) {
            router.replace('/dashboard');
        }

        if (role === 'teacher') {
            const teacherClasses = classes.filter(c => c.teacherId === user.uid);
            const isStudentInTeacherClass = teacherClasses.some(c => c.studentIds && c.studentIds[studentIdParams]);
            if (!isStudentInTeacherClass) {
                router.replace('/dashboard/students');
            }
        }

    }, [loading, user, role, student, classes, studentIdParams, router]);

    React.useEffect(() => {
        if (student) {
            setEditStudentState(student);
        }
    }, [student]);
    
    
    const enrolledSubjects = React.useMemo(() => {
        const enrolledClassIds = new Set(enrolledClasses.map(c => c.id));
        return subjects.filter(s => s.classId && enrolledClassIds.has(s.classId));
    }, [subjects, enrolledClasses]);
    const feesMap = React.useMemo(() => new Map(feeStructures.map(f => [f.id, f.name])), [feeStructures]);
    const feesRecords: EnrichedFeeRecord[] = React.useMemo(() => {
        if (!studentIdParams) return [];
        return studentFees.filter(sf => sf.studentId === studentIdParams).map(sf => ({ ...sf, feeName: feesMap.get(sf.feeId) || "Unknown Fee" }));
    }, [studentFees, feesMap, studentIdParams]);
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const attendanceHistory = React.useMemo<FullAttendanceLog[]>(() => {
        if (attendanceLoading || !studentIdParams) return [];
        const flatData: FullAttendanceLog[] = [];
        rawAttendance.forEach(dailyRecord => {
            const date = dailyRecord.id;
            if (!dailyRecord || typeof dailyRecord !== 'object') return;
            Object.entries(dailyRecord).forEach(([classId, attendanceRecords]) => {
                if (classId === 'id' || !attendanceRecords || typeof attendanceRecords !== 'object') return;
                const attendanceEntry = (attendanceRecords as AttendanceRecord)[studentIdParams];
                if (attendanceEntry && attendanceEntry.status) {
                    flatData.push({ date, classId, studentId: studentIdParams, status: attendanceEntry.status, studentName: studentsMap.get(studentIdParams) || 'Unknown', className: classesMap.get(classId) || 'Unknown' });
                }
            });
        });
        return flatData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawAttendance, studentsMap, classesMap, attendanceLoading, studentIdParams]);
    
    const attendanceSummary = React.useMemo(() => {
        return attendanceHistory.reduce((acc, log) => {
            acc[log.status] = (acc[log.status] || 0) + 1;
            return acc;
        }, {} as Record<AttendanceStatus, number>)
    }, [attendanceHistory]);

    const attendanceChartData = React.useMemo(() => {
        return Object.entries(attendanceSummary).map(([name, value], index) => ({
            name,
            value,
            fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
        }));
    }, [attendanceSummary]);

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
            return { subjectName: subjectsMap.get(grade.subjectId) || 'Unknown Subject', classScore: grade.classScore, examScore: grade.examScore, totalScore: parseFloat(totalScore.toFixed(2)), grade: letterGrade, remarks, teacherComment: grade.teacherComment };
        });
    }, [student, selectedExamId, grades, subjectsMap]);


    const handleGenerateReportCard = () => {
        const term = terms.find(t => t.id === selectedTermId);
        if (!student || !term || !selectedExamId) {
            toast({ title: "Selection Required", description: "Please select a term and an exam period.", variant: "destructive"});
            return;
        }
        
        try {
            const doc = new jsPDF();
            const examName = exams.find(e => e.id === selectedExamId)?.name;
            const className = enrolledClasses[0]?.name || "N/A";
            
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("SchoolFlow Academy", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
            doc.setFontSize(14);
            doc.text("Student Academic Report", doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(`Student Name: ${student.name}`, 15, 45);
            doc.text(`Class: ${className}`, 15, 52);
            doc.text(`Academic Term: ${term.name || 'N/A'}`, 15, 59);
            doc.text(`Examination: ${examName || 'N/A'}`, 15, 66);
            doc.text(`Date Issued: ${format(new Date(), 'PPP')}`, doc.internal.pageSize.getWidth() - 15, 45, { align: 'right' });

            (doc as any).autoTable({
                startY: 75,
                head: [["Subject", "Class Score (50%)", "Exam Score (50%)", "Total Score", "Grade", "Remarks", "Comment"]],
                body: reportCardResults.map(r => [r.subjectName, r.classScore, r.examScore, r.totalScore, r.grade, r.remarks, r.teacherComment || ""]),
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] }
            });

            let finalY = (doc as any).lastAutoTable.finalY || 150;

            if (term.startDate && term.endDate) {
                const termStart = parseISO(term.startDate);
                const termEnd = parseISO(term.endDate);
                const termAttendance = attendanceHistory.filter(log => isWithinInterval(parseISO(log.date), { start: termStart, end: termEnd }));
                
                const summary = termAttendance.reduce((acc, log) => {
                    acc[log.status] = (acc[log.status] || 0) + 1;
                    return acc;
                }, {} as Record<AttendanceStatus, number>);

                (doc as any).autoTable({
                    startY: finalY + 10,
                    head: [["Attendance Summary"]],
                    body: [
                        [`Present: ${summary.Present || 0} days`],
                        [`Absent: ${summary.Absent || 0} days`],
                        [`Late: ${summary.Late || 0} days`],
                        [`Excused: ${summary.Excused || 0} days`],
                    ],
                    theme: 'plain',
                    headStyles: { fontStyle: 'bold', fillColor: false, textColor: 20 },
                });
                finalY = (doc as any).lastAutoTable.finalY;
            }
            
            doc.setFontSize(10);
            doc.text("Headmaster's Signature: ...................................", 15, finalY + 20);
            doc.text("Parent's Signature: ...................................", doc.internal.pageSize.getWidth() - 15, finalY + 20, { align: 'right'});
            
            doc.save(`report-card-${student.name.replace(/ /g, '_')}-${term.name?.replace(/ /g, '_')}.pdf`);
            toast({ title: "Report Card Generated", description: "PDF has been downloaded." });

        } catch (error) {
            console.error(error);
            toast({ title: "Error Generating Report", variant: "destructive" });
        }
    }
    
    const handleStatusChange = async (status: Student['status']) => {
        if (!student) return;
        try {
            await updateStudent(student.id, { status });
            toast({ title: "Success", description: "Student status updated." });
        } catch(err) {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    }
    
    const handleProfileUpdate = async () => {
        if (!student) return;
        setIsUpdating(true);
        try {
            await updateStudent(student.id, editStudentState);
            toast({ title: "Success", description: "Profile updated."});
            setIsEditDialogOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleActivitySubmit = async () => {
        if (!activityFormState.name || !activityFormState.type || !activityFormState.startDate) {
            toast({ title: "Error", description: "Name, type, and start date are required.", variant: "destructive" });
            return;
        }
        setIsUpdating(true);
        try {
            if (selectedActivity) {
                await updateActivity(selectedActivity.id, activityFormState);
                toast({ title: "Success", description: "Activity updated." });
            } else {
                await addActivity(activityFormState as Omit<Activity, 'id'>);
                toast({ title: "Success", description: "Activity added." });
            }
            setIsActivityDialogOpen(false);
            setActivityFormState({});
            setSelectedActivity(null);
        } catch (error) {
            toast({ title: "Error", description: "Failed to save activity.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleActivityDelete = async (id: string) => {
        setIsUpdating(true);
        try {
            await deleteActivity(id);
            toast({ title: "Success", description: "Activity deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete activity.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const openActivityDialog = (activity?: Activity) => {
        if (activity) {
            setSelectedActivity(activity);
            setActivityFormState(activity);
        } else {
            setSelectedActivity(null);
            setActivityFormState({});
        }
        setIsActivityDialogOpen(true);
    };


    if (loading || !role || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (role === 'student' && user?.uid !== studentIdParams) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
                <ShieldAlert className="h-16 w-16 text-destructive"/>
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </div>
        )
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
    
    const statusOptions: Student['status'][] = ["Active", "Inactive", "Graduated", "Continuing"];

    return (
        <>
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
                                <span>ID: {student.studentId}</span>
                                <span>|</span>
                                <span>{student.email}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {canEditProfile && (
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4"/> Edit Profile</Button>
                            )}
                            {role === 'admin' && (
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-[160px] justify-between">
                                        {student.status}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[160px]">
                                    {statusOptions.map(status => (
                                        <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)}>
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="profile">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="profile"><User className="mr-2" /> Profile</TabsTrigger>
                        <TabsTrigger value="enrollment"><BookOpen className="mr-2" /> Enrollment</TabsTrigger>
                        <TabsTrigger value="attendance"><ClipboardCheck className="mr-2" /> Attendance</TabsTrigger>
                        <TabsTrigger value="fees"><DollarSign className="mr-2" /> Fees</TabsTrigger>
                        <TabsTrigger value="academics"><Award className="mr-2" /> Academics</TabsTrigger>
                        <TabsTrigger value="activities"><ActivityIcon className="mr-2" /> Activities</TabsTrigger>
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
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
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
                                                attendanceHistory.slice(0, 10).map((log, index) => (
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
                                </div>
                                <div className="md:col-span-1">
                                    <h3 className="font-semibold mb-2 text-center">Overall Attendance</h3>
                                    <ChartContainer config={{}} className="h-[200px] w-full">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
                                                <Pie data={attendanceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={(entry) => `${entry.name} (${entry.value})`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </div>
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
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Academic Reports</CardTitle>
                                    <CardDescription>Select a term and exam to view results and generate a report card.</CardDescription>
                                </div>
                                <Button onClick={handleGenerateReportCard} disabled={!selectedExamId || reportCardResults.length === 0}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate Report Card
                                </Button>
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
                                </div>

                                {selectedExamId && (
                                    <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Subject</TableHead>
                                                        <TableHead>Total Score</TableHead>
                                                        <TableHead>Grade</TableHead>
                                                        <TableHead>Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {reportCardResults.length > 0 ? (
                                                        reportCardResults.map((result, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="font-medium">{result.subjectName}</TableCell>
                                                                <TableCell className="font-bold">{result.totalScore}%</TableCell>
                                                                <TableCell><Badge variant="secondary">{result.grade}</Badge></TableCell>
                                                                <TableCell>{result.remarks}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center">No results found for this exam.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="md:col-span-1">
                                            <h3 className="font-semibold text-center mb-2">Performance Breakdown</h3>
                                            <ChartContainer config={{}} className="h-[250px] w-full">
                                                <ResponsiveContainer>
                                                    <BarChart data={reportCardResults} layout="vertical" margin={{ left: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" domain={[0, 100]} />
                                                        <YAxis dataKey="subjectName" type="category" width={80} tick={{ fontSize: 12 }} />
                                                        <RechartsTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="totalScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activities" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Extracurricular Activities</CardTitle>
                                {role === 'admin' && (
                                    <Button size="sm" onClick={() => openActivityDialog()}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Activity</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Role/Position</TableHead>
                                            <TableHead>Date Range</TableHead>
                                            {role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.length > 0 ? (
                                            activities.map(activity => (
                                                <TableRow key={activity.id}>
                                                    <TableCell className="font-medium">{activity.name}</TableCell>
                                                    <TableCell>{activity.type}</TableCell>
                                                    <TableCell>{activity.role}</TableCell>
                                                    <TableCell>{format(parseISO(activity.startDate), 'PPP')} - {activity.endDate ? format(parseISO(activity.endDate), 'PPP') : 'Present'}</TableCell>
                                                    {role === 'admin' && (
                                                        <TableCell className="text-right">
                                                            <AlertDialog>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent>
                                                                        <DropdownMenuItem onSelect={() => openActivityDialog(activity)}>
                                                                            <Edit className="mr-2 h-4 w-4"/> Edit
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
                                                                        <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this activity?</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleActivityDelete(activity.id)} className="bg-destructive hover:bg-destructive/90" disabled={isUpdating}>
                                                                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={role === 'admin' ? 5 : 4} className="h-24 text-center">
                                                    No extracurricular activities recorded.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
            
            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Student Profile</DialogTitle>
                        <DialogDescription>Make changes to the student's information here.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-4 p-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Full Name</Label>
                                    <Input value={editStudentState.name || ''} onChange={(e) => setEditStudentState(p => ({...p, name: e.target.value}))} disabled={role === 'student'} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Email</Label>
                                    <Input type="email" value={editStudentState.email || ''} onChange={(e) => setEditStudentState(p => ({...p, email: e.target.value}))} disabled={role === 'student'} />
                                </div>
                                 <div className="space-y-1">
                                    <Label>Gender</Label>
                                    <Select value={editStudentState.gender} onValueChange={(v: "Male" | "Female" | "Other") => setEditStudentState(p => ({...p, gender: v}))} disabled={role === 'student'}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Place of Birth</Label>
                                    <Input value={editStudentState.placeOfBirth || ''} onChange={(e) => setEditStudentState(p => ({...p, placeOfBirth: e.target.value}))} disabled={isUpdating} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Hometown</Label>
                                    <Input value={editStudentState.hometown || ''} onChange={(e) => setEditStudentState(p => ({...p, hometown: e.target.value}))} disabled={isUpdating} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Address</Label>
                                    <Input value={editStudentState.address || ''} onChange={(e) => setEditStudentState(p => ({...p, address: e.target.value}))} disabled={isUpdating} />
                                </div>
                             </div>
                             <div className="pt-4">
                                 <h4 className="font-semibold mb-2">Parent/Guardian Info</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <Label>Parent Name</Label>
                                        <Input value={editStudentState.parentName || ''} onChange={(e) => setEditStudentState(p => ({...p, parentName: e.target.value}))} disabled={isUpdating} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Parent Phone</Label>
                                        <Input value={editStudentState.parentPhone || ''} onChange={(e) => setEditStudentState(p => ({...p, parentPhone: e.target.value}))} disabled={isUpdating} />
                                    </div>
                                     <div className="space-y-1 md:col-span-2">
                                        <Label>Parent Email</Label>
                                        <Input type="email" value={editStudentState.parentEmail || ''} onChange={(e) => setEditStudentState(p => ({...p, parentEmail: e.target.value}))} disabled={isUpdating} />
                                    </div>
                                 </div>
                             </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleProfileUpdate} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Activity Dialog */}
            <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedActivity ? "Edit" : "Add"} Activity</DialogTitle>
                        <DialogDescription>Record an extracurricular activity for this student.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1">
                            <Label>Activity Name</Label>
                            <Input value={activityFormState.name || ''} onChange={e => setActivityFormState(p => ({...p, name: e.target.value}))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Activity Type</Label>
                            <Select value={activityFormState.type} onValueChange={(v: string) => setActivityFormState(p => ({...p, type: v}))}>
                                <SelectTrigger><SelectValue placeholder="Select type..."/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sport">Sport</SelectItem>
                                    <SelectItem value="Club">Club</SelectItem>
                                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                                    <SelectItem value="Competition">Competition</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Role / Position</Label>
                            <Input value={activityFormState.role || ''} onChange={e => setActivityFormState(p => ({...p, role: e.target.value}))} placeholder="e.g., Member, Captain, Treasurer"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Start Date</Label>
                                <Input type="date" value={activityFormState.startDate || ''} onChange={e => setActivityFormState(p => ({...p, startDate: e.target.value}))} />
                            </div>
                            <div className="space-y-1">
                                <Label>End Date (optional)</Label>
                                <Input type="date" value={activityFormState.endDate || ''} onChange={e => setActivityFormState(p => ({...p, endDate: e.target.value}))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleActivitySubmit} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedActivity ? "Save Changes" : "Add Activity"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

    
