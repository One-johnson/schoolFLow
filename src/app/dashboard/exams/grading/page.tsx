
"use client";

import * as React from "react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Exam = { id: string; name: string; status: "Upcoming" | "Ongoing" | "Grading" | "Published"; };
type Class = { id: string; name: string; teacherId?: string; studentIds?: Record<string, boolean>; };
type Subject = { id: string; name: string; classId?: string; teacherId?: string; };
type Student = { id: string; name: string };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; teacherComment?: string; };
type ScoresState = { [studentId: string]: { classScore: string; examScore: string; teacherComment: string } };

export default function GradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Database hooks
  const { data: exams } = useDatabase<Exam>("exams");
  const { data: classes } = useDatabase<Class>("classes");
  const { data: subjects } = useDatabase<Subject>("subjects");
  const { data: students } = useDatabase<Student>("students");
  const { data: schedules } = useDatabase<any>("examSchedules");
  const { data: grades, addDataWithId, updateData } = useDatabase<StudentGrade>("studentGrades");
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedExamId, setSelectedExamId] = React.useState<string>();
  const [selectedClassId, setSelectedClassId] = React.useState<string>();
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>();
  const [scores, setScores] = React.useState<ScoresState>({});

  // Filter data based on teacher's role and selections
  const teacherClasses = React.useMemo(() => classes.filter(c => c.teacherId === user?.uid), [classes, user]);
  
  const subjectsForClass = React.useMemo(() => {
    if (!selectedClassId) return [];
    return subjects.filter(s => (s.classIds && s.classIds[selectedClassId] && s.teacherIds && s.teacherIds[user?.uid]));
  }, [subjects, selectedClassId, user]);

  const studentsForClass = React.useMemo(() => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass?.studentIds) return [];
    const studentIds = Object.keys(selectedClass.studentIds);
    return students.filter(s => studentIds.includes(s.id));
  }, [students, classes, selectedClassId]);

  const currentSchedule = React.useMemo(() => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return null;
    return schedules.find(s => s.examId === selectedExamId && s.classId === selectedClassId && s.subjectId === selectedSubjectId);
  }, [schedules, selectedExamId, selectedClassId, selectedSubjectId]);

  // Pre-fill scores from database
  React.useEffect(() => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
      setScores({});
      return;
    }
    const newScores: ScoresState = {};
    studentsForClass.forEach(student => {
      const grade = grades.find(g => g.examId === selectedExamId && g.studentId === student.id && g.subjectId === selectedSubjectId);
      if (grade) {
        newScores[student.id] = {
            classScore: String(grade.classScore),
            examScore: String(grade.examScore),
            teacherComment: grade.teacherComment || ''
        };
      } else {
        newScores[student.id] = { classScore: '', examScore: '', teacherComment: '' };
      }
    });
    setScores(newScores);
  }, [studentsForClass, grades, selectedExamId, selectedSubjectId, selectedClassId]);

  const handleScoreChange = (studentId: string, type: 'classScore' | 'examScore' | 'teacherComment', value: string) => {
    setScores(prev => ({
        ...prev,
        [studentId]: {
            ...prev[studentId],
            [type]: value
        }
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
      toast({ title: "Error", description: "Incomplete selection.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const promises = studentsForClass.map(student => {
      const studentScores = scores[student.id];
      if (!studentScores) return Promise.resolve();

      const classScore = parseFloat(studentScores.classScore);
      const examScore = parseFloat(studentScores.examScore);

      const gradeId = `${selectedExamId}_${student.id}_${selectedSubjectId}`;
      const gradeData = {
        examId: selectedExamId,
        studentId: student.id,
        subjectId: selectedSubjectId,
        classScore: !isNaN(classScore) ? classScore : 0,
        examScore: !isNaN(examScore) ? examScore : 0,
        teacherComment: studentScores.teacherComment || ""
      };

      const existingGrade = grades.find(g => g.id === gradeId);
      if (existingGrade) {
          return updateData(gradeId, { 
              classScore: gradeData.classScore, 
              examScore: gradeData.examScore,
              teacherComment: gradeData.teacherComment
          });
      } else {
          return addDataWithId(gradeId, gradeData);
      }
    });

    try {
      await Promise.all(promises);
      toast({ title: "Success", description: "Grades saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save grades.", variant: "destructive" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Grading</CardTitle>
        <CardDescription>
          Enter class scores and examination scores for students in your subjects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1.5">
            <Label>Exam Period</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger><SelectValue placeholder="Select Exam..." /></SelectTrigger>
              <SelectContent>
                {exams.filter(e => e.status === "Grading" || e.status === "Ongoing").map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger><SelectValue placeholder="Select Class..." /></SelectTrigger>
              <SelectContent>
                {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
              <SelectTrigger><SelectValue placeholder="Select Subject..." /></SelectTrigger>
              <SelectContent>
                {subjectsForClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedExamId && selectedClassId && selectedSubjectId ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">Class Score</TableHead>
                  <TableHead className="w-[120px]">Exam Score</TableHead>
                  <TableHead>Teacher's Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsForClass.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="Class"
                        value={scores[student.id]?.classScore || ''}
                        onChange={(e) => handleScoreChange(student.id, 'classScore', e.target.value)}
                        max={100}
                      />
                    </TableCell>
                     <TableCell>
                      <Input
                        type="number"
                        placeholder="Exam"
                        value={scores[student.id]?.examScore || ''}
                        onChange={(e) => handleScoreChange(student.id, 'examScore', e.target.value)}
                        max={100}
                      />
                    </TableCell>
                     <TableCell>
                      <Textarea
                        placeholder="Add a comment..."
                        className="min-h-[40px]"
                        value={scores[student.id]?.teacherComment || ''}
                        onChange={(e) => handleScoreChange(student.id, 'teacherComment', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">Select an exam, class, and subject to start grading.</p>
          </div>
        )}
      </CardContent>
      {selectedExamId && selectedClassId && selectedSubjectId && (
        <CardFooter className="justify-end">
            <Button onClick={handleSaveGrades} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                <Save className="mr-2 h-4 w-4" />
                Save Grades
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
