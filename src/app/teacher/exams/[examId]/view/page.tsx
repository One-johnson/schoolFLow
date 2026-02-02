'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, AlertCircle, User, TrendingUp } from 'lucide-react';
import type { Id } from '../../../../../../convex/_generated/dataModel';

interface Subject {
  id: string;
  name: string;
  maxMarks?: number;
}

export default function TeacherExamViewPage() {
  const params = useParams();
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const examId = params.examId as Id<'exams'>;

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

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

  // Parse subjects from exam
  const subjects: Subject[] = exam?.subjects ? JSON.parse(exam.subjects) : [];

  // Filter marks by selected subject
  const subjectMarks = selectedSubject
    ? existingMarks?.filter((m) => m.subjectId === selectedSubject.id)
    : [];

  // Calculate statistics
  const stats = selectedSubject && subjectMarks && subjectMarks.length > 0
    ? {
        average: subjectMarks.reduce((sum, m) => sum + m.percentage, 0) / subjectMarks.length,
        highest: Math.max(...subjectMarks.map((m) => m.totalScore)),
        lowest: Math.min(...subjectMarks.filter((m) => !m.isAbsent).map((m) => m.totalScore)),
        passed: subjectMarks.filter((m) => m.percentage >= 40).length,
        failed: subjectMarks.filter((m) => m.percentage < 40 && !m.isAbsent).length,
        absent: subjectMarks.filter((m) => m.isAbsent).length,
      }
    : null;

  const getGradeColor = (grade: string) => {
    const gradeNum = parseInt(grade);
    if (gradeNum <= 2) return 'bg-green-100 text-green-700';
    if (gradeNum <= 4) return 'bg-blue-100 text-blue-700';
    if (gradeNum <= 6) return 'bg-yellow-100 text-yellow-700';
    if (gradeNum <= 8) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
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
        <Badge
          variant="secondary"
          className={
            exam.status === 'published'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-green-100 text-green-700'
          }
        >
          {exam.status}
        </Badge>
      </div>

      {/* Exam Info */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Marks:</span>
            <span className="font-medium">{exam.totalMarks}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="secondary">{exam.examType?.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Students Marked:</span>
            <span className="font-medium">
              {existingMarks
                ? new Set(existingMarks.map((m) => m.studentId)).size
                : 0}{' '}
              / {students?.length || 0}
            </span>
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
            <SelectValue placeholder="Choose a subject to view marks" />
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

      {/* Statistics */}
      {selectedSubject && stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistics - {selectedSubject.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {stats.average.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.highest}
                </p>
                <p className="text-xs text-muted-foreground">Highest</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.lowest}
                </p>
                <p className="text-xs text-muted-foreground">Lowest</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t text-sm">
              <span className="text-green-600">
                Passed: <strong>{stats.passed}</strong>
              </span>
              <span className="text-red-600">
                Failed: <strong>{stats.failed}</strong>
              </span>
              <span className="text-muted-foreground">
                Absent: <strong>{stats.absent}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Table */}
      {selectedSubject && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{selectedSubject.name} - Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!students || !existingMarks ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : subjectMarks?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No marks entered for this subject</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Student</TableHead>
                      <TableHead className="w-[60px] text-center">Class</TableHead>
                      <TableHead className="w-[60px] text-center">Exam</TableHead>
                      <TableHead className="w-[60px] text-center">Total</TableHead>
                      <TableHead className="w-[60px] text-center">%</TableHead>
                      <TableHead className="w-[60px] text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectMarks
                      ?.sort((a, b) => b.totalScore - a.totalScore)
                      .map((mark) => (
                        <TableRow key={mark._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {mark.studentName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </span>
                              </div>
                              <span className="truncate text-sm">
                                {mark.studentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {mark.isAbsent ? '-' : mark.classScore}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {mark.isAbsent ? '-' : mark.examScore}
                          </TableCell>
                          <TableCell className="text-center font-medium text-sm">
                            {mark.isAbsent ? '-' : mark.totalScore}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {mark.isAbsent ? '-' : `${mark.percentage.toFixed(0)}%`}
                          </TableCell>
                          <TableCell className="text-center">
                            {mark.isAbsent ? (
                              <Badge variant="outline" className="text-xs">
                                ABS
                              </Badge>
                            ) : (
                              <Badge className={`text-xs ${getGradeColor(mark.grade)}`}>
                                {mark.grade}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
