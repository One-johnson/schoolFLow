'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  emt1: number;
  emt2: number;
  emt3: number;
  sba: number;
  project: number;
  examRaw: number;
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
  const [studentFilter, setStudentFilter] = useState('');

  const searchParams = useSearchParams();
  const classIdFromUrl = searchParams.get('classId');
  const classId = useMemo(() => {
    if (!teacher?.classIds?.length) return undefined;
    if (classIdFromUrl && teacher.classIds.includes(classIdFromUrl))
      return classIdFromUrl;
    return teacher.classIds[0];
  }, [teacher?.classIds, classIdFromUrl]); // Class document _id (for getStudentsByClassId / getClassById)
  const currentClass = useQuery(
    api.classes.getClassById,
    classId ? { classId: classId as Id<'classes'> } : 'skip'
  );
  const classCode = currentClass?.classCode; // Use classCode for marks (report cards expect it)

  const exam = useQuery(api.exams.getExamById, { examId });

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const existingMarks = useQuery(
    api.marks.getMarksByClassAndExam,
    examId && classCode ? { examId, classId: classCode } : 'skip'
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
        emt1: existingMark?.emt1 ?? 0,
        emt2: existingMark?.emt2 ?? 0,
        emt3: existingMark?.emt3 ?? 0,
        sba: existingMark?.sba ?? 0,
        project: existingMark?.project ?? 0,
        examRaw: existingMark?.examRaw ?? 0,
        isAbsent: existingMark?.isAbsent ?? false,
        existingMarkId: existingMark?._id,
      });
    });

    setMarks(newMarks);
  }, [students, selectedSubject, existingMarks]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const updateMarkField = (
    studentId: string,
    field: keyof Omit<StudentMark, "studentId" | "studentName" | "isAbsent" | "existingMarkId">,
    value: string,
    max: number,
  ) => {
    const score = parseFloat(value);
    const safeScore = Number.isFinite(score) ? score : 0;
    const clamped = clamp(safeScore, 0, max);
    setMarks((prev) => {
      const next = new Map(prev);
      const existing = next.get(studentId);
      if (existing) {
        next.set(studentId, { ...existing, [field]: clamped });
      }
      return next;
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
          emt1: checked ? 0 : existing.emt1,
          emt2: checked ? 0 : existing.emt2,
          emt3: checked ? 0 : existing.emt3,
          sba: checked ? 0 : existing.sba,
          project: checked ? 0 : existing.project,
          examRaw: checked ? 0 : existing.examRaw,
        });
      }
      return newMarks;
    });
  };

  const handleSave = async () => {
    if (!teacher || !exam || !selectedSubject || !currentClass?.classCode) {
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
      // Ghana assessment model computes totals out of 100 per subject.

      for (const [studentId, mark] of marks.entries()) {
        await enterMarks({
          schoolId: teacher.schoolId,
          examId: examId,
          examCode: exam.examCode,
          examName: exam.examName,
          studentId: studentId,
          studentName: mark.studentName,
          classId: currentClass.classCode,
          className: currentClass.className,
          subjectId: selectedSubject.id,
          subjectName: selectedSubject.name,
          emt1: mark.emt1,
          emt2: mark.emt2,
          emt3: mark.emt3,
          sba: mark.sba,
          project: mark.project,
          examRaw: mark.examRaw,
          isAbsent: mark.isAbsent,
          enteredBy: teacher.id,
          enteredByRole: 'subject_teacher',
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

  if (teacher && !classId) {
    return (
      <div className="py-8 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No class selected</p>
        <Button variant="link" onClick={() => router.push('/teacher/exams')}>
          Back to exams
        </Button>
      </div>
    );
  }

  const maxMarks = 100;

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

      {/* Student Filter */}
      {selectedSubject && students && students.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Filter student</label>
          <Input
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            placeholder="Search student name or ID"
          />
        </div>
      )}

      {/* Marks Entry Table */}
      {selectedSubject && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selectedSubject.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Max: {maxMarks} (Class: 50, Exam: 50)
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
                      <TableHead className="w-[70px] text-center">EMT1</TableHead>
                      <TableHead className="w-[70px] text-center">EMT2</TableHead>
                      <TableHead className="w-[70px] text-center">EMT3</TableHead>
                      <TableHead className="w-[70px] text-center">SBA</TableHead>
                      <TableHead className="w-[80px] text-center">Project</TableHead>
                      <TableHead className="w-[80px] text-center">Exam</TableHead>
                      <TableHead className="w-[80px] text-center">Class/60</TableHead>
                      <TableHead className="w-[70px] text-center">Total</TableHead>
                      <TableHead className="w-[60px] text-center">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students
                      .filter((student) => {
                        if (!studentFilter.trim()) return true;
                        const q = studentFilter.toLowerCase();
                        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
                        return (
                          fullName.includes(q) ||
                          String(student.studentId || '').toLowerCase().includes(q)
                        );
                      })
                      .map((student) => {
                      const mark = marks.get(student._id);
                      const classTotal =
                        (mark?.emt1 || 0) +
                        (mark?.emt2 || 0) +
                        (mark?.emt3 || 0) +
                        (mark?.sba || 0) +
                        (mark?.project || 0);
                      const class50 = (classTotal / 60) * 50;
                      const exam50 = ((mark?.examRaw || 0) / 100) * 50;
                      const total = class50 + exam50;
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
                              max={10}
                              step={0.5}
                              value={mark?.emt1 || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "emt1", e.target.value, 10)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={mark?.emt2 || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "emt2", e.target.value, 10)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={mark?.emt3 || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "emt3", e.target.value, 10)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={mark?.sba || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "sba", e.target.value, 10)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              step={0.5}
                              value={mark?.project || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "project", e.target.value, 20)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={mark?.examRaw || 0}
                              onChange={(e) =>
                                updateMarkField(student._id, "examRaw", e.target.value, 100)
                              }
                              disabled={mark?.isAbsent}
                              className="w-16 text-center h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {mark?.isAbsent ? "-" : classTotal.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {mark?.isAbsent ? '-' : total.toFixed(1)}
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
