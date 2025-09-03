
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileDown, Printer, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { calculateGrade } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ReportCard } from "./report-card"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// Types
type Student = { id: string; name: string, studentId: string, avatarUrl: string, house: string };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>, teacherId?: string };
type Subject = { id: string; name: string; };
type Exam = { id: string; name: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing", year: string, termId: string };
type Term = { id: string; name: string, vacationDate?: string, reopeningDate?: string };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };
type EnrichedGrade = StudentGrade & { studentName: string; className: string; subjectName: string; totalScore: number; grade: string; remarks: string; positionInClass: string; };
type ReportCardData = { student: Student, class: Class, term: Term, exam: Exam, results: EnrichedGrade[], termlyPerformance: any };

export default function AcademicsReport() {
    const { user, role } = useAuth();
    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
    const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
    const { data: terms, loading: termsLoading } = useDatabase<Term>("terms");
    const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("grades");

    const [selectedExamId, setSelectedExamId] = React.useState<string>("all");
    const [selectedClassId, setSelectedClassId] = React.useState<string>("all");
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("all");
    const [selectedReport, setSelectedReport] = React.useState<ReportCardData | null>(null);

    const loading = studentsLoading || classesLoading || subjectsLoading || examsLoading || gradesLoading || termsLoading;

    // Mapped data for easy lookup
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const publishedExams = React.useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

    const teacherClasses = React.useMemo(() => {
        if(role !== 'teacher' || !user) return classes;
        return classes.filter(c => c.teacherId === user.uid);
    }, [classes, role, user]);

    const filteredData = React.useMemo<EnrichedGrade[]>(() => {
        let data: Omit<EnrichedGrade, 'positionInClass'>[] = grades.map(grade => {
            const totalScore = (grade.classScore * 0.5) + (grade.examScore * 0.5);
            const { grade: letterGrade, remarks } = calculateGrade(totalScore);
            const studentClass = Array.from(classesMap.values()).find(c => c.studentIds?.[grade.studentId]);

            return {
                ...grade,
                studentName: studentsMap.get(grade.studentId)?.name || 'Unknown',
                className: studentClass?.name || 'N/A',
                subjectName: subjectsMap.get(grade.subjectId) || 'Unknown',
                totalScore: parseFloat(totalScore.toFixed(2)),
                grade: letterGrade,
                remarks: remarks,
            }
        });

        if (role === 'teacher') {
            const teacherClassIds = new Set(teacherClasses.map(c => c.id));
            data = data.filter(d => teacherClassIds.has(Array.from(classesMap.values()).find(c => c.name === d.className)?.id || ''));
        }

        if (selectedExamId !== 'all') {
            data = data.filter(d => d.examId === selectedExamId);
        }
        if (selectedClassId !== 'all') {
            data = data.filter(d => {
                const studentClass = Array.from(classesMap.values()).find(c => c.name === d.className);
                return studentClass?.id === selectedClassId;
            });
        }
        if (selectedSubjectId !== 'all') {
            data = data.filter(d => d.subjectId === selectedSubjectId);
        }
        
        // Calculate class position for each subject
        const dataWithPosition = data.map((grade, _, allGrades) => {
            const subjectGrades = allGrades.filter(g => g.subjectId === grade.subjectId && g.examId === grade.examId && Array.from(classesMap.values()).find(c => c.name === g.className)?.id === selectedClassId);
            const sortedGrades = subjectGrades.sort((a, b) => b.totalScore - a.totalScore);
            const position = sortedGrades.findIndex(g => g.studentId === grade.studentId) + 1;
            const suffix = (pos: number) => {
                if (pos > 3 && pos < 21) return 'th';
                switch (pos % 10) {
                  case 1: return "st";
                  case 2: return "nd";
                  case 3: return "rd";
                  default: return "th";
                }
            };
            return {
                ...grade,
                positionInClass: position > 0 ? `${position}${suffix(position)}` : 'N/A'
            }
        })

        return dataWithPosition;
    }, [grades, studentsMap, classesMap, subjectsMap, role, teacherClasses, selectedExamId, selectedClassId, selectedSubjectId]);
    
    const handleViewReport = (studentId: string) => {
        if (!selectedExamId || selectedExamId === 'all') {
            alert("Please select a specific exam to generate a report.");
            return;
        }

        const student = studentsMap.get(studentId);
        const exam = exams.find(e => e.id === selectedExamId);
        const term = terms.find(t => t.id === exam?.termId);
        const studentClass = Array.from(classesMap.values()).find(c => c.studentIds?.[studentId]);
        const results = filteredData.filter(d => d.studentId === studentId && d.examId === selectedExamId);

        if (student && exam && term && studentClass && results.length > 0) {
            setSelectedReport({
                student,
                class: studentClass,
                term,
                exam,
                results,
                termlyPerformance: {} // This can be populated with historical data later
            });
        } else {
            alert("Could not gather all necessary data for the report card.");
        }
    };

    const handlePrint = () => {
       const printContent = document.getElementById("report-card-to-print");
       if (printContent) {
           const originalContents = document.body.innerHTML;
           const newContent = printContent.innerHTML;
           document.body.innerHTML = `<div class="print-container">${newContent}</div>`;
           window.print();
           document.body.innerHTML = originalContents;
           // We need to re-add event listeners or simply reload. For simplicity:
           window.location.reload();
       }
    };
    
    return (
        <>
            <Card className="print-hidden">
                <CardHeader>
                    <CardTitle>Academic Report</CardTitle>
                    <CardDescription>Filter and view student performance data. Select a specific exam to enable report card viewing.</CardDescription>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Exam..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Published Exams</SelectItem>
                                {publishedExams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Class..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Subject..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary"/></div> : (
                    <div className="rounded-md border mt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-center">Total Score</TableHead>
                                    <TableHead className="text-center">Grade</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((grade, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{grade.studentName}</TableCell>
                                        <TableCell>{grade.className}</TableCell>
                                        <TableCell>{grade.subjectName}</TableCell>
                                        <TableCell className="text-center font-bold">{grade.totalScore}%</TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary">{grade.grade}</Badge></TableCell>
                                        <TableCell>{grade.positionInClass}</TableCell>
                                        <TableCell>{grade.remarks}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleViewReport(grade.studentId)} disabled={selectedExamId === 'all'}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredData.length === 0 && (
                                    <TableRow><TableCell colSpan={8} className="h-24 text-center">No academic records found for the selected filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-4xl p-0">
                   <div id="report-card-to-print">
                     {selectedReport && <ReportCard {...selectedReport} />}
                   </div>
                    <DialogFooter className="p-4 border-t print-hidden">
                        <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Report Card</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
