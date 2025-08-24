
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
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };

type EnrichedGrade = {
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    remarks: string;
};

// Grading function based on the new criteria
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

export default function MyResultsPage() {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = React.useState<string>();

  // Database hooks
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");

  const loading = examsLoading || subjectsLoading || gradesLoading;

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

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
      };
    });
  }, [user, selectedExamId, grades, subjectsMap]);
  
  const publishedExams = React.useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Exam Results</CardTitle>
        <CardDescription>
          View your scores and grades for past examinations. Final score is 50% class score + 50% exam score.
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
                            <TableHead className="text-center">Class Score</TableHead>
                            <TableHead className="text-center">Exam Score</TableHead>
                            <TableHead className="text-center">Total Score</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Remarks</TableHead>
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
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
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
