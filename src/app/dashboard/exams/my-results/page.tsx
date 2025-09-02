
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, BarChart, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateGrade } from "@/lib/utils";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

// Data types
type Exam = { id: string; name: string; status: "Upcoming" | "Ongoing" | "Grading" | "Published"; };
type Subject = { id: string; name: string; };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; teacherComment?: string };
type Student = { id: string; name: string; email: string; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; };


type EnrichedGrade = {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
    teacherComment?: string;
};

export default function MyResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExamId, setSelectedExamId] = React.useState<string>();

  // Database hooks
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");
  const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");


  const loading = examsLoading || subjectsLoading || gradesLoading || studentsLoading || classesLoading;

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const student = React.useMemo(() => user ? students.find(s => s.id === user.uid) : null, [students, user]);
  const studentClass = React.useMemo(() => user ? classes.find(c => c.studentIds && c.studentIds[user.uid]) : null, [classes, user]);


  const studentResults = React.useMemo<EnrichedGrade[]>(() => {
    if (!user || !selectedExamId) return [];

    const studentGradesForExam = grades.filter(g => g.studentId === user.uid && g.examId === selectedExamId);
    
    return studentGradesForExam.map(grade => {
      const totalScore = (grade.classScore * 0.5) + (grade.examScore * 0.5);
      const { grade: letterGrade, remarks } = calculateGrade(totalScore);
      
      return {
        subjectName: subjectsMap.get(grade.subjectId) || 'Unknown Subject',
        classScore: grade.classScore,
        examScore: grade.examScore,
        totalScore: parseFloat(totalScore.toFixed(2)),
        grade: letterGrade,
        remarks: remarks,
        teacherComment: grade.teacherComment,
      };
    });
  }, [user, selectedExamId, grades, subjectsMap]);
  
  const performanceSummary = React.useMemo(() => {
    if (studentResults.length === 0) return { averageScore: 0, subjectsPassed: 0 };
    const totalScoreSum = studentResults.reduce((sum, result) => sum + result.totalScore, 0);
    const averageScore = totalScoreSum / studentResults.length;
    const subjectsPassed = studentResults.filter(r => r.totalScore >= 50).length;
    return {
        averageScore: parseFloat(averageScore.toFixed(2)),
        subjectsPassed
    };
  }, [studentResults]);

  
  const publishedExams = React.useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

  const handleGenerateReportCard = () => {
    if (!student || !selectedExamId || !studentClass) {
        toast({ title: "Error", description: "Could not retrieve all necessary data for the report card.", variant: "destructive" });
        return;
    }
    const exam = exams.find(e => e.id === selectedExamId);
    if(!exam) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SchoolFlow Academy", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Student Academic Report", doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Student Name: ${student.name}`, 15, 45);
    doc.text(`Class: ${studentClass.name}`, 15, 52);
    doc.text(`Examination: ${exam.name}`, 15, 59);

    (doc as any).autoTable({
        startY: 70,
        head: [['Subject', 'Class (50%)', 'Exam (50%)', 'Total', 'Grade', 'Remarks', 'Comment']],
        body: studentResults.map(r => [r.subjectName, r.classScore, r.examScore, r.totalScore, r.grade, r.remarks, r.teacherComment || ""]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text("Headmaster's Signature: ..........................", 15, finalY + 20);

    doc.save(`report-card-${student.name.replace(" ", "_")}-${exam.name.replace(" ", "_")}.pdf`);
    toast({ title: "Report Card Generated", description: "PDF has been downloaded." });
  }

  const chartConfig = { totalScore: { label: "Score", color: "hsl(var(--primary))" }};

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Exam Results</CardTitle>
        <CardDescription>
          View your scores and grades for past examinations. Final score is 50% class score + 50% exam score.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1.5">
                <label htmlFor="exam-select" className="text-sm font-medium">Select Examination Period</label>
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger id="exam-select" className="w-full sm:w-[250px]"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                  <SelectContent>
                    {publishedExams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateReportCard} disabled={!selectedExamId || studentResults.length === 0 || loading}>
                <Download className="mr-2 h-4 w-4" /> Generate Report Card
              </Button>
            </div>
            
            {loading ? (
                 <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : selectedExamId ? (
                 <>
                    {studentResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500"/> Performance Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Average Score:</span> <span className="font-bold">{performanceSummary.averageScore}%</span></div>
                                    <div className="flex justify-between"><span>Subjects Taken:</span> <span className="font-bold">{studentResults.length}</span></div>
                                    <div className="flex justify-between"><span>Subjects Passed:</span> <span className="font-bold text-green-600">{performanceSummary.subjectsPassed}</span></div>
                                    <div className="flex justify-between"><span>Subjects Failed:</span> <span className="font-bold text-red-600">{studentResults.length - performanceSummary.subjectsPassed}</span></div>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><BarChart className="h-5 w-5"/> Score Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                         <RechartsBarChart data={studentResults} layout="vertical" margin={{ left: 10, right: 20 }}>
                                            <YAxis dataKey="subjectName" type="category" width={80} tick={{ fontSize: 12 }}/>
                                            <XAxis type="number" domain={[0,100]} />
                                            <Tooltip content={<ChartTooltipContent indicator="dot"/>}/>
                                            <RechartsBar dataKey="totalScore" fill="var(--color-totalScore)" radius={4}/>
                                         </RechartsBarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <div className="rounded-md border mt-6">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">Class Score</TableHead>
                                <TableHead className="text-center">Exam Score</TableHead>
                                <TableHead className="text-center">Total Score</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead>Teacher's Comment</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {studentResults.length > 0 ? (
                                studentResults.map(result => (
                                    <TableRow key={result.subjectName}>
                                        <TableCell className="font-medium">{result.subjectName}</TableCell>
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
                                    <TableCell colSpan={7} className="h-24 text-center">
                                    No results found for this examination period.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : (
                <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">Select an examination period to view your results.</p>
                </div>
            )}
         </div>
      </CardContent>
    </Card>
  );
}
