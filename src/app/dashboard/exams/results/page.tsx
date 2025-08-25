
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Data Types
type Exam = { id: string; name: string; status: string; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; };
type Student = { id: string; name: string; };
type Subject = { id: string; name: string; };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; teacherComment?: string; };

type EnrichedResult = {
    studentName: string;
    className: string;
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
    teacherComment?: string;
    classId?: string;
    studentId: string;
    examId: string;
};

// Grading logic
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


export default function ResultsPage() {
    const [selectedExamId, setSelectedExamId] = React.useState<string>("all");
    const [selectedClassId, setSelectedClassId] = React.useState<string>("all");
    const [selectedStudentId, setSelectedStudentId] = React.useState<string>("all");

    // Database Hooks
    const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
    const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
    const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");

    const loading = examsLoading || classesLoading || studentsLoading || subjectsLoading || gradesLoading;

    // Data maps for efficient lookups
    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    
    // Find class for each student
    const studentClassMap = React.useMemo(() => {
        const map = new Map<string, string>();
        classes.forEach(c => {
            if (c.studentIds) {
                Object.keys(c.studentIds).forEach(studentId => {
                    map.set(studentId, c.id);
                })
            }
        });
        return map;
    }, [classes]);

    const filteredResults = React.useMemo<EnrichedResult[]>(() => {
        let results: EnrichedResult[] = grades.map(grade => {
            const student = studentsMap.get(grade.studentId);
            const classId = studentClassMap.get(grade.studentId);
            const totalScore = (grade.classScore * 0.5) + (grade.examScore * 0.5);
            const { grade: letterGrade, remarks } = calculateGrade(totalScore);

            return {
                ...grade,
                studentName: student?.name || "Unknown Student",
                className: classId ? classesMap.get(classId) || "Unknown Class" : "Unknown Class",
                classId: classId,
                subjectName: subjectsMap.get(grade.subjectId) || "Unknown Subject",
                totalScore: parseFloat(totalScore.toFixed(2)),
                grade: letterGrade,
                remarks: remarks,
            }
        });

        if (selectedExamId !== "all") {
            results = results.filter(r => r.examId === selectedExamId);
        }
        if (selectedClassId !== "all") {
            results = results.filter(r => r.classId === selectedClassId);
        }
        if (selectedStudentId !== "all") {
            results = results.filter(r => r.studentId === selectedStudentId);
        }

        return results;

    }, [grades, studentsMap, classesMap, subjectsMap, studentClassMap, selectedExamId, selectedClassId, selectedStudentId]);

    const analyticsData = React.useMemo(() => {
        if (!filteredResults.length) return { gradeDistribution: [], classAverages: [] };
        
        const gradeDistribution = filteredResults.reduce((acc, result) => {
            acc[result.grade] = (acc[result.grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const classAverages = Object.values(filteredResults.reduce((acc, result) => {
            if(!result.classId) return acc;
            if (!acc[result.classId]) {
                acc[result.classId] = { name: result.className, totalScore: 0, count: 0 };
            }
            acc[result.classId].totalScore += result.totalScore;
            acc[result.classId].count++;
            return acc;
        }, {} as Record<string, {name: string, totalScore: number, count: number}>))
        .map(c => ({ name: c.name, averageScore: parseFloat((c.totalScore / c.count).toFixed(2)) }))
        .sort((a,b) => b.averageScore - a.averageScore);

        return {
            gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count })).sort((a,b) => a.grade.localeCompare(b.grade)),
            classAverages,
        }
    }, [filteredResults]);


    const handlePrint = () => {
        const doc = new jsPDF();
        doc.text("Exam Results Report", 14, 16);
        (doc as any).autoTable({
          startY: 20,
          head: [['Student', 'Class', 'Subject', 'Class Score', 'Exam Score', 'Total Score', 'Grade', 'Comment']],
          body: filteredResults.map(r => [r.studentName, r.className, r.subjectName, `${r.classScore}%`, `${r.examScore}%`, `${r.totalScore}%`, r.grade, r.teacherComment || ""]),
        });
        doc.save('results-report.pdf');
    };

    const handleExport = () => {
        const headers = ["Student", "Class", "Subject", "Class Score", "Exam Score", "Total Score", "Grade", "Remarks", "Teacher Comment"];
        const csvContent = [
            headers.join(','),
            ...filteredResults.map(r => [r.studentName, r.className, r.subjectName, r.classScore, r.examScore, r.totalScore, r.grade, r.remarks, `"${r.teacherComment || ''}"`].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'exam-results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const gradeDistConfig = { count: { label: 'Students' }};
    const classAvgConfig = { averageScore: { label: 'Avg. Score'}};

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Results Overview</CardTitle>
                    <CardDescription>Filter and view results for all students across the school.</CardDescription>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Exam..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Exams</SelectItem>
                                {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Class..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Student..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Students</SelectItem>
                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Visual Analytics</CardTitle>
                    <CardDescription>A visual summary of the filtered results.</CardDescription>
                </CardHeader>
                <CardContent>
                   {loading ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : filteredResults.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-center mb-2">Grade Distribution</h3>
                                <ChartContainer config={gradeDistConfig} className="h-[300px] w-full">
                                    <BarChart data={analyticsData.gradeDistribution} accessibilityLayer>
                                        <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                                        <YAxis />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill="var(--color-primary)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                             <div>
                                <h3 className="font-semibold text-center mb-2">Average Score by Class</h3>
                                <ChartContainer config={classAvgConfig} className="h-[300px] w-full">
                                     <BarChart data={analyticsData.classAverages} accessibilityLayer layout="vertical">
                                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80}/>
                                        <XAxis dataKey="averageScore" type="number" />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="averageScore" fill="var(--color-secondary)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </div>
                   ) : (
                       <p className="text-center text-muted-foreground py-8">No data to display. Select different filters.</p>
                   )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Results Table</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-center">Class Score</TableHead>
                                    <TableHead className="text-center">Exam Score</TableHead>
                                    <TableHead className="text-center">Total Score</TableHead>
                                    <TableHead className="text-center">Grade</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    <TableHead>Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredResults.length > 0 ? (
                                    filteredResults.map((result, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{result.studentName}</TableCell>
                                            <TableCell>{result.className}</TableCell>
                                            <TableCell>{result.subjectName}</TableCell>
                                            <TableCell className="text-center">{result.classScore}%</TableCell>
                                            <TableCell className="text-center">{result.examScore}%</TableCell>
                                            <TableCell className="text-center font-bold">{result.totalScore}%</TableCell>
                                            <TableCell className="text-center"><Badge variant="secondary">{result.grade}</Badge></TableCell>
                                            <TableCell>{result.remarks}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{result.teacherComment || "N/A"}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                        No results found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handlePrint} disabled={loading || filteredResults.length === 0}>
                        <Printer className="mr-2 h-4 w-4"/> Print Report
                    </Button>
                    <Button onClick={handleExport} disabled={loading || filteredResults.length === 0}>
                        <FileDown className="mr-2 h-4 w-4"/> Export to CSV
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

    