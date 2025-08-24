
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
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Data types
type Exam = { id: string; name: string; status: "Upcoming" | "Ongoing" | "Grading" | "Published"; };
type Subject = { id: string; name: string; };
type ExamSchedule = { id: string; examId: string; subjectId: string; maxScore: number; };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; score: number; };

type EnrichedGrade = {
    subjectName: string;
    score: number;
    maxScore: number;
    grade: string;
    remarks: string;
};

// Simple grading function
const calculateGrade = (score: number, maxScore: number): { grade: string; remarks: string } => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { grade: "A+", remarks: "Excellent" };
    if (percentage >= 80) return { grade: "A", remarks: "Very Good" };
    if (percentage >= 70) return { grade: "B", remarks: "Good" };
    if (percentage >= 60) return { grade: "C", remarks: "Satisfactory" };
    if (percentage >= 50) return { grade: "D", remarks: "Pass" };
    return { grade: "F", remarks: "Needs Improvement" };
};

export default function MyResultsPage() {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = React.useState<string>();

  // Database hooks
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: schedules, loading: schedulesLoading } = useDatabase<ExamSchedule>("examSchedules");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");

  const loading = examsLoading || subjectsLoading || schedulesLoading || gradesLoading;

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

  const studentResults = React.useMemo<EnrichedGrade[]>(() => {
    if (!user || !selectedExamId) return [];

    const studentGradesForExam = grades.filter(g => g.studentId === user.uid && g.examId === selectedExamId);
    
    return studentGradesForExam.map(grade => {
      const schedule = schedules.find(s => s.examId === selectedExamId && s.subjectId === grade.subjectId);
      const { grade: letterGrade, remarks } = calculateGrade(grade.score, schedule?.maxScore || 100);
      
      return {
        subjectName: subjectsMap.get(grade.subjectId) || 'Unknown Subject',
        score: grade.score,
        maxScore: schedule?.maxScore || 100,
        grade: letterGrade,
        remarks: remarks,
      };
    });
  }, [user, selectedExamId, grades, schedules, subjectsMap]);
  
  const publishedExams = React.useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Exam Results</CardTitle>
        <CardDescription>
          View your scores and grades for past examinations.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
            <div className="max-w-xs space-y-1.5">
              <label htmlFor="exam-select">Select Examination Period</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger id="exam-select"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                <SelectContent>
                  {publishedExams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {loading ? (
                 <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : selectedExamId ? (
                 <div className="rounded-md border mt-6">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Remarks</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {studentResults.length > 0 ? (
                            studentResults.map(result => (
                                <TableRow key={result.subjectName}>
                                    <TableCell className="font-medium">{result.subjectName}</TableCell>
                                    <TableCell className="text-center">{result.score} / {result.maxScore}</TableCell>
                                    <TableCell className="text-center"><Badge variant="secondary">{result.grade}</Badge></TableCell>
                                    <TableCell>{result.remarks}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                No results found for this examination period.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
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
