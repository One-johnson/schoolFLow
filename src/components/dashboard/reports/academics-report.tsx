
"use client"

import * as React from "react"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileDown, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { calculateGrade } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import jsPDF from "jspdf"
import "jspdf-autotable"

// Types
type Student = { id: string; name: string };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>, teacherId?: string };
type Subject = { id: string; name: string; };
type Exam = { id: string; name: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing" };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };
type EnrichedGrade = StudentGrade & { studentName: string; className: string; subjectName: string; totalScore: number; grade: string; remarks: string; };

export default function AcademicsReport() {
    const { user, role } = useAuth();
    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
    const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
    const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("grades");

    const [selectedExamId, setSelectedExamId] = React.useState<string>("all");
    const [selectedClassId, setSelectedClassId] = React.useState<string>("all");
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("all");

    const loading = studentsLoading || classesLoading || subjectsLoading || examsLoading || gradesLoading;

    // Mapped data for easy lookup
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const studentClassMap = React.useMemo(() => {
        const map = new Map<string, {name: string, id: string}>();
        classes.forEach(c => {
            if (c.studentIds) {
                Object.keys(c.studentIds).forEach(studentId => {
                    map.set(studentId, { name: c.name, id: c.id });
                });
            }
        });
        return map;
    }, [classes]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const publishedExams = React.useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

    const teacherClasses = React.useMemo(() => {
        if(role !== 'teacher' || !user) return classes;
        return classes.filter(c => c.teacherId === user.uid);
    }, [classes, role, user]);

    const filteredData = React.useMemo<EnrichedGrade[]>(() => {
        let data: EnrichedGrade[] = grades.map(grade => {
            const totalScore = (grade.classScore * 0.5) + (grade.examScore * 0.5);
            const { grade: letterGrade, remarks } = calculateGrade(totalScore);
            return {
                ...grade,
                studentName: studentsMap.get(grade.studentId) || 'Unknown',
                className: studentClassMap.get(grade.studentId)?.name || 'N/A',
                subjectName: subjectsMap.get(grade.subjectId) || 'Unknown',
                totalScore: parseFloat(totalScore.toFixed(2)),
                grade: letterGrade,
                remarks: remarks,
            }
        });

        if (role === 'teacher') {
            const teacherClassIds = new Set(teacherClasses.map(c => c.id));
            data = data.filter(d => teacherClassIds.has(studentClassMap.get(d.studentId)?.id || ''));
        }

        if (selectedExamId !== 'all') {
            data = data.filter(d => d.examId === selectedExamId);
        }
        if (selectedClassId !== 'all') {
            data = data.filter(d => studentClassMap.get(d.studentId)?.id === selectedClassId);
        }
        if (selectedSubjectId !== 'all') {
            data = data.filter(d => d.subjectId === selectedSubjectId);
        }
        
        return data;
    }, [grades, studentsMap, studentClassMap, subjectsMap, role, teacherClasses, selectedExamId, selectedClassId, selectedSubjectId]);
    
    const analyticsData = React.useMemo(() => {
        if (!filteredData.length) return { gradeDistribution: [], subjectAverages: [] };
        
        const gradeDistribution = filteredData.reduce((acc, result) => {
            acc[result.grade] = (acc[result.grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const subjectAverages = Object.values(filteredData.reduce((acc, result) => {
            if (!acc[result.subjectId]) {
                acc[result.subjectId] = { name: result.subjectName, totalScore: 0, count: 0 };
            }
            acc[result.subjectId].totalScore += result.totalScore;
            acc[result.subjectId].count++;
            return acc;
        }, {} as Record<string, {name: string, totalScore: number, count: number}>))
        .map(s => ({ name: s.name, averageScore: parseFloat((s.totalScore / s.count).toFixed(2)) }))
        .sort((a,b) => b.averageScore - a.averageScore);

        return {
            gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count })).sort((a,b) => a.grade.localeCompare(b.grade)),
            subjectAverages,
        }
    }, [filteredData]);

     const handlePrint = () => {
        const doc = new jsPDF();
        doc.text("Academics Report", 14, 16);
        (doc as any).autoTable({
          startY: 20,
          head: [['Student', 'Class', 'Subject', 'Total Score', 'Grade', 'Remarks']],
          body: filteredData.map(r => [r.studentName, r.className, r.subjectName, `${r.totalScore}%`, r.grade, r.remarks]),
        });
        doc.save('academics-report.pdf');
    };

    const handleExport = () => {
        const headers = ["Student", "Class", "Subject", "Class Score", "Exam Score", "Total Score", "Grade", "Remarks"];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(r => [r.studentName, r.className, r.subjectName, r.classScore, r.examScore, r.totalScore, r.grade, r.remarks].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'academics-report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const gradeDistConfig = { count: { label: 'Students' }};
    const subjectAvgConfig = { averageScore: { label: 'Avg. Score'}};

    return (
        <Card>
             <CardHeader>
                <CardTitle>Academic Report</CardTitle>
                <CardDescription>Filter and view student performance data.</CardDescription>
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
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Visual Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {filteredData.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold text-center mb-2">Grade Distribution</h3>
                                    <ChartContainer config={gradeDistConfig} className="h-[300px] w-full">
                                        <BarChart data={analyticsData.gradeDistribution} accessibilityLayer>
                                            <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                                            <YAxis />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-center mb-2">Average Score by Subject</h3>
                                    <ChartContainer config={subjectAvgConfig} className="h-[300px] w-full">
                                        <BarChart data={analyticsData.subjectAverages} accessibilityLayer layout="vertical">
                                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="text-xs truncate"/>
                                            <XAxis dataKey="averageScore" type="number" />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="averageScore" fill="hsl(var(--secondary-foreground))" radius={4} />
                                        </BarChart>
                                    </ChartContainer>
                                </div>
                            </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No data to display. Select different filters.</p>
                    )}
                    </CardContent>
                </Card>

                <div className="rounded-md border mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">Total Score</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                                <TableHead>Remarks</TableHead>
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
                                    <TableCell>{grade.remarks}</TableCell>
                                </TableRow>
                            ))}
                             {filteredData.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No academic records found for the selected filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                </>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 print-hidden">
                <Button variant="outline" onClick={handlePrint} disabled={filteredData.length === 0}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                <Button onClick={handleExport} disabled={filteredData.length === 0}><FileDown className="mr-2 h-4 w-4"/> Export to CSV</Button>
            </CardFooter>
        </Card>
    );
}

