'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '../../../../../../convex/_generated/dataModel';

interface Subject {
  id: string;
  name: string;
  maxMarks?: number;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  classScore: number;
  examScore: number;
  isAbsent: boolean;
  existingMarkId?: Id<'studentMarks'>;
}

export default function TeacherMarksEntryPage() {
  const params = useParams();
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const examId = params.examId as Id<'exams'>;

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [marks, setMarks] = useState<Map<string, StudentMark>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const classId = teacher?.classIds?.[0];

  const exam = useQuery(api.exams.getExamById, { examId });

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const existingMarks = useQuery(
    api.marks.getMarksByClassAndExam,
    classId ? { examId, classId } : 'skip'
  );

  const currentClass = useQuery(
    api.classes.getClassById,
    classId ? { classId: classId as Id<'classes'> } : 'skip'
  );

  const enterMarks = useMutation(api.marks.enterMarks);

  // Parse subjects from exam
  const subjects: Subject[] = exam?.subjects
    ? JSON.parse(exam.subjects)
    : [];

  // Initialize marks when students load or subject changes
  useEffect(() => {
    if (!students || !selectedSubject) return;

    const newMarks = new Map<string, StudentMark>();

    students.forEach((student) => {
      // Check if there's existing mark for this student and subject
      const existingMark = existingMarks?.find(
        (m) => m.studentId === student._id && m.subjectId === selectedSubject.id
      );

      newMarks.set(student._id, {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        classScore: existingMark?.classScore ?? 0,
        examScore: existingMark?.examScore ?? 0,
        isAbsent: existingMark?.isAbsent ?? false,
        existingMarkId: existingMark?._id,
      });
    });

    setMarks(newMarks);
  }, [students, selectedSubject, existingMarks]);

  const handleClassScoreChange = (studentId: string, value: string) => {
    const score = parseFloat(value) || 0;
    const maxClassScore = (selectedSubject?.maxMarks || exam?.totalMarks || 100) * 0.3; // 30% for class score
    const clampedScore = Math.min(Math.max(0, score), maxClassScore);

    setMarks((prev) => {
      const newMarks = new Map(prev);
      const existing = newMarks.get(studentId);
      if (existing) {
        newMarks.set(studentId, { ...existing, classScore: clampedScore });
      }
      return newMarks;
    });
  };

  const handleExamScoreChange = (studentId: string, value: string) => {
    const score = parseFloat(value) || 0;
    const maxExamScore = (selectedSubject?.maxMarks || exam?.totalMarks || 100) * 0.7; // 70% for exam score
    const clampedScore = Math.min(Math.max(0, score), maxExamScore);

    setMarks((prev) => {
      const newMarks = new Map(prev);
      const existing = newMarks.get(studentId);
      if (existing) {
        newMarks.set(studentId, { ...existing, examScore: clampedScore });
      }
      return newMarks;
    });
  };

  const handleAbsentChange = (studentId: string, checked: boolean) => {
    setMarks((prev) => {
      const newMarks = new Map(prev);
      const existing = newMarks.get(studentId);
      if (existing) {
        newMarks.set(studentId, {
          ...existing,
          isAbsent: checked,
          classScore: checked ? 0 : existing.classScore,
          examScore: checked ? 0 : existing.examScore,
        });
      }
      return newMarks;
    });
  };

  const handleSave = async () => {
    if (!teacher || !exam || !selectedSubject || !classId || !currentClass) {
      toast.error('Missing required data');
      return;
    }

    if (!navigator.onLine) {
      toast.error('You must be online to save marks');
      return;
    }

    setIsSaving(true);
    try {
      const enteredByName = `${teacher.firstName} ${teacher.lastName}`;
      const maxMarks = selectedSubject.maxMarks || exam.totalMarks;

      for (const [studentId, mark] of marks.entries()) {
        await enterMarks({
          schoolId: teacher.schoolId,
          examId: examId,
          examCode: exam.examCode,
          examName: exam.examName,
          studentId: studentId,
          studentName: mark.studentName,
          classId: classId,
          className: currentClass.className,
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
          classScore: mark.classScore,
          examScore: mark.examScore,
          maxMarks: maxMarks,
          isAbsent: mark.isAbsent,
          enteredBy: teacher.id,
          enteredByRole: 'class_teacher',
          enteredByName: enteredByName,
        });
      }

      toast.success('Marks saved successfully!');
    } catch (error) {
      console.error('Failed to save marks:', error);
      toast.error('Failed to save marks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (exam === undefined) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (exam === null) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const maxMarks = selectedSubject?.maxMarks || exam.totalMarks;
  const maxClassScore = maxMarks * 0.3;
  const maxExamScore = maxMarks * 0.7;

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{exam.examName}</h1>
          <p className="text-sm text-muted-foreground">{exam.examCode}</p>
        </div>
      </div>

      {/* Exam Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Marks:</span>
            <span className="font-medium">{exam.totalMarks}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="secondary">{exam.examType?.replace('_', ' ')}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subject Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Select Subject</label>
        <Select
          value={selectedSubject?.id || ''}
          onValueChange={(value) => {
            const subject = subjects.find((s) => s.id === value);
            setSelectedSubject(subject || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a subject to enter marks" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Marks Entry Table */}
      {selectedSubject && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selectedSubject.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Max: {maxMarks} (Class: {maxClassScore}, Exam: {maxExamScore})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!students ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No students in this class</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Student</TableHead>
                      <TableHead className="w-[80px] text-center">
                        Class
                        <br />
                        <span className="text-xs font-normal">
                          (max {maxClassScore})
                        </span>
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        Exam
                        <br />
                        <span className="text-xs font-normal">
                          (max {maxExamScore})
                        </span>
                      </TableHead>
                      <TableHead className="w-[70px] text-center">Total</TableHead>
                      <TableHead className="w-[60px] text-center">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const mark = marks.get(student._id);
                      const total = (mark?.classScore || 0) + (mark?.examScore || 0);
                      return (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {student.studentId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={maxClassScore}
                              step={0.5}
                              value={mark?.classScore || 0}
                              onChange={(e) =>
                                handleClassScoreChange(student._id, e.target.value)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={maxExamScore}
                              step={0.5}
                              value={mark?.examScore || 0}
                              onChange={(e) =>
                                handleExamScoreChange(student._id, e.target.value)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {mark?.isAbsent ? '-' : total}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={mark?.isAbsent || false}
                              onCheckedChange={(checked) =>
                                handleAbsentChange(student._id, checked as boolean)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {selectedSubject && students && students.length > 0 && (
        <div className="sticky bottom-20 pb-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !navigator.onLine}
            className="w-full gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Marks'}
          </Button>
        </div>
      )}
    </div>
  );
}
