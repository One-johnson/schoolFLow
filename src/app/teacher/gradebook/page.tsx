'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  BookOpen,
  Save,
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  
  Search,
  BarChart3,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface MarkEntry {
  studentId: string;
  studentName: string;
  classScore: number;
  examScore: number;
  isAbsent: boolean;
}

export default function GradeBookPage() {
  const { teacher } = useTeacherAuth();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const classId = teacher?.classIds?.[0];

  // Queries
  const exams = useQuery(
    api.exams.getExamsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const existingMarks = useQuery(
    api.marks.getMarksByClassAndExam,
    selectedExamId && classId
      ? { examId: selectedExamId as Id<'exams'>, classId }
      : 'skip'
  );

  const classSummary = useQuery(
    api.marks.getClassGradeSummary,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          examId: selectedExamId ? (selectedExamId as Id<'exams'>) : undefined,
        }
      : 'skip'
  );

  // Mutations
  const quickEnterMarks = useMutation(api.marks.quickEnterMarks);

  // Get selected exam details
  const selectedExam = exams?.find((e) => e._id === selectedExamId);
  const selectedSubject = subjects?.find((s) => s._id === selectedSubjectId);

  // Get exam subjects
  const examSubjects = selectedExam
    ? JSON.parse(selectedExam.subjects || '[]')
    : [];

  // Initialize mark entries when students or existing marks change
  useEffect(() => {
    if (students && selectedExamId && selectedSubjectId) {
      const subjectMarks = existingMarks?.filter(
        (m) => m.subjectId === selectedSubjectId
      );

      const entries = students.map((student) => {
        const existingMark = subjectMarks?.find(
          (m) => m.studentId === student._id
        );
        return {
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          classScore: existingMark?.classScore ?? 0,
          examScore: existingMark?.examScore ?? 0,
          isAbsent: existingMark?.isAbsent ?? false,
        };
      });

      setMarkEntries(entries);
    }
  }, [students, existingMarks, selectedExamId, selectedSubjectId]);

  const handleMarkChange = (
    studentId: string,
    field: 'classScore' | 'examScore',
    value: number
  ) => {
    setMarkEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarkEntries((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId
          ? { ...entry, isAbsent: !entry.isAbsent, classScore: 0, examScore: 0 }
          : entry
      )
    );
  };

  const handleSaveMarks = async () => {
    if (!teacher || !selectedExam || !selectedSubject || !classId) return;

    setIsSaving(true);
    try {
      const subjectInfo = examSubjects.find(
        (s: { subjectId: string }) => s.subjectId === selectedSubjectId
      );
      const maxMarks = subjectInfo?.maxMarks ?? 100;

      const result = await quickEnterMarks({
        schoolId: teacher.schoolId,
        examId: selectedExamId as Id<'exams'>,
        examCode: selectedExam.examCode,
        examName: selectedExam.examName,
        classId,
        className: teacher.classNames?.[0] ?? 'Unknown',
        subjectId: selectedSubjectId,
        subjectName: selectedSubject.subjectName,
        maxMarks,
        enteredBy: teacher.id,
        enteredByRole: 'class_teacher',
        enteredByName: `${teacher.firstName} ${teacher.lastName}`,
        marks: markEntries,
      });

      toast.success(`Saved ${result.successful} of ${result.total} marks`);
    } catch (error) {
      toast.error('Failed to save marks');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 80) return { grade: '1', color: 'bg-green-100 text-green-700' };
    if (percentage >= 70) return { grade: '2', color: 'bg-green-100 text-green-600' };
    if (percentage >= 60) return { grade: '3-4', color: 'bg-blue-100 text-blue-700' };
    if (percentage >= 50) return { grade: '5-6', color: 'bg-amber-100 text-amber-700' };
    return { grade: '7-9', color: 'bg-red-100 text-red-700' };
  };

  // Filter students for search
  const filteredEntries = markEntries.filter((entry) =>
    entry.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter active exams (scheduled, ongoing, or completed)
  const activeExams = exams?.filter(
    (e) => e.status === 'scheduled' || e.status === 'ongoing' || e.status === 'completed'
  );

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Grade Book
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter and manage student grades for {teacher.classNames?.join(', ')}
        </p>
      </div>

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Quick Entry</TabsTrigger>
          <TabsTrigger value="summary">Class Summary</TabsTrigger>
        </TabsList>

        {/* Quick Entry Tab */}
        <TabsContent value="entry" className="space-y-4">
          {/* Exam and Subject Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Exam & Subject</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Exam</label>
                  <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exam..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeExams?.map((exam) => (
                        <SelectItem key={exam._id} value={exam._id}>
                          <div className="flex items-center gap-2">
                            <span>{exam.examName}</span>
                            <Badge variant="outline" className="text-xs">
                              {exam.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={setSelectedSubjectId}
                    disabled={!selectedExamId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examSubjects.map((subject: { subjectId: string; subjectName: string }) => (
                        <SelectItem key={subject.subjectId} value={subject.subjectId}>
                          {subject.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Entry Table */}
          {selectedExamId && selectedSubjectId && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Enter Grades - {selectedSubject?.subjectName}
                  </CardTitle>
                  <Button
                    onClick={handleSaveMarks}
                    disabled={isSaving || markEntries.length === 0}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save All'}
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-50">Student</TableHead>
                        <TableHead className="w-25 text-center">Class Score</TableHead>
                        <TableHead className="w-25 text-center">Exam Score</TableHead>
                        <TableHead className="w-20 text-center">Total</TableHead>
                        <TableHead className="w-20 text-center">Grade</TableHead>
                        <TableHead className="w-20 text-center">Absent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!students ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ) : filteredEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEntries.map((entry) => {
                          const subjectInfo = examSubjects.find(
                            (s: { subjectId: string }) => s.subjectId === selectedSubjectId
                          );
                          const maxMarks = subjectInfo?.maxMarks ?? 100;
                          const total = entry.classScore + entry.examScore;
                          const percentage = (total / maxMarks) * 100;
                          const gradeInfo = getGradeBadge(percentage);

                          return (
                            <TableRow
                              key={entry.studentId}
                              className={entry.isAbsent ? 'opacity-50' : ''}
                            >
                              <TableCell className="font-medium">
                                {entry.studentName}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={40}
                                  value={entry.classScore}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      entry.studentId,
                                      'classScore',
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={entry.isAbsent}
                                  className="w-20 text-center"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={60}
                                  value={entry.examScore}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      entry.studentId,
                                      'examScore',
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={entry.isAbsent}
                                  className="w-20 text-center"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${getGradeColor(percentage)}`}>
                                  {entry.isAbsent ? '-' : total}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {!entry.isAbsent && (
                                  <Badge className={gradeInfo.color}>
                                    {gradeInfo.grade}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={entry.isAbsent}
                                  onChange={() => handleAbsentToggle(entry.studentId)}
                                  className="h-4 w-4"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {!selectedExamId && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Select an exam and subject to start entering grades
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Class Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{classSummary?.length ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classSummary && classSummary.length > 0
                      ? Math.round(
                          classSummary.reduce((sum, s) => sum + s.average, 0) /
                            classSummary.length
                        )
                      : '-'}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Class Average</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classSummary && classSummary.length > 0
                      ? Math.round(Math.max(...classSummary.map((s) => s.average)))
                      : '-'}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {classSummary
                      ? classSummary.filter((s) => s.average < 50).length
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Below 50%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exam Filter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filter by Exam</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Exams</SelectItem>
                  {activeExams?.map((exam) => (
                    <SelectItem key={exam._id} value={exam._id}>
                      {exam.examName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Student Rankings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Student Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!classSummary ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : classSummary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No grades recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classSummary.slice(0, 10).map((student, index) => (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                            ? 'bg-gray-200 text-gray-700'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.studentName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={student.average}
                            className="h-2 flex-1"
                          />
                          <span
                            className={`text-sm font-bold ${getGradeColor(
                              student.average
                            )}`}
                          >
                            {Math.round(student.average)}%
                          </span>
                        </div>
                      </div>
                      <Badge className={getGradeBadge(student.average).color}>
                        {student.subjectCount} subjects
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
