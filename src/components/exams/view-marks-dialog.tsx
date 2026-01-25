'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, Eye, EyeOff, FileText, Users, BookOpen, ChevronRight, GraduationCap, ChevronLeft } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface ViewMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  schoolId: string;
}

interface StudentMarksSummary {
  studentConvexId: string;
  customStudentId: string;
  studentName: string;
  totalSubjects: number;
  averageScore: number;
  averagePercentage: number;
  marks: Array<{
    _id: Id<'studentMarks'>;
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    percentage: number;
    grade: string;
    remarks: string;
    isAbsent: boolean;
  }>;
}

export function ViewMarksDialog({ open, onOpenChange, examId, schoolId }: ViewMarksDialogProps) {
  const exam = useQuery(api.exams.getExamById, { examId });
  const allClasses = useQuery(api.classes.getClassesBySchool, { schoolId });
  const allStudents = useQuery(api.students.getStudentsBySchool, { schoolId });

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [viewAllMode, setViewAllMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentMarksSummary | null>(null);

  // Get the selected class object to access classCode
  const selectedClassObj = allClasses?.find((c) => c._id === selectedClass);

  // Fetch marks based on mode
  const classMarks = useQuery(
    api.marks.getClassMarks,
    selectedClassObj && !viewAllMode ? { examId, classId: selectedClassObj.classCode } : 'skip'
  );
  const allMarks = useQuery(
    api.marks.getExamMarks,
    viewAllMode ? { examId } : 'skip'
  );

  // Use appropriate marks based on mode
  const marks = viewAllMode ? allMarks : classMarks;

  // Group marks by student
  const studentsSummary = useMemo(() => {
    if (!marks || !allStudents) return [];

    const studentMap = new Map<string, StudentMarksSummary>();

    marks.forEach((mark) => {
      // Find the student document to get custom studentId
      const studentDoc = allStudents.find((s) => s._id === mark.studentId);
      const customStudentId = studentDoc?.studentId || mark.studentId;

      if (!studentMap.has(mark.studentId)) {
        studentMap.set(mark.studentId, {
          studentConvexId: mark.studentId,
          customStudentId: customStudentId,
          studentName: mark.studentName,
          totalSubjects: 0,
          averageScore: 0,
          averagePercentage: 0,
          marks: [],
        });
      }

      const student = studentMap.get(mark.studentId)!;
      student.marks.push({
        _id: mark._id,
        subjectName: mark.subjectName,
        classScore: mark.classScore,
        examScore: mark.examScore,
        totalScore: mark.totalScore,
        percentage: mark.percentage,
        grade: mark.grade,
        remarks: mark.remarks,
        isAbsent: mark.isAbsent,
      });
    });

    // Calculate averages
    studentMap.forEach((student) => {
      student.totalSubjects = student.marks.length;
      const totalScore = student.marks.reduce((sum, m) => sum + m.totalScore, 0);
      const totalPercentage = student.marks.reduce((sum, m) => sum + m.percentage, 0);
      student.averageScore = totalScore / student.totalSubjects;
      student.averagePercentage = totalPercentage / student.totalSubjects;
    });

    return Array.from(studentMap.values());
  }, [marks, allStudents]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentsSummary) return [];

    return studentsSummary.filter((student) => {
      const matchesSearch = student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.customStudentId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [studentsSummary, searchQuery]);

  // Get unique subjects from marks
  const uniqueSubjects = useMemo(() => {
    if (!marks) return [];
    const subjects = new Set(marks.map((m) => m.subjectId));
    return Array.from(subjects).map((subjectId) => ({
      id: subjectId,
      name: marks.find((m) => m.subjectId === subjectId)?.subjectName || subjectId,
    }));
  }, [marks]);

  // Get unique classes from marks (for all mode)
  const uniqueClassesInMarks = useMemo(() => {
    if (!marks) return [];
    const classes = new Set(marks.map((m) => m.classId));
    return Array.from(classes).map((classId) => ({
      id: classId,
      name: marks.find((m) => m.classId === classId)?.className || classId,
    }));
  }, [marks]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!marks) return { total: 0, students: 0, classes: 0, subjects: 0 };

    return {
      total: marks.length,
      students: new Set(marks.map((m) => m.studentId)).size,
      classes: viewAllMode ? uniqueClassesInMarks.length : 1,
      subjects: uniqueSubjects.length,
    };
  }, [marks, uniqueSubjects, uniqueClassesInMarks, viewAllMode]);

  const handleExportCSV = (): void => {
    if (!marks || marks.length === 0) return;

    const headers = [
      'Student ID',
      'Student Name',
      'Class',
      'Subject',
      'Class Score',
      'Exam Score',
      'Total Score',
      'Percentage',
      'Grade',
      'Remarks',
    ];

    const rows = marks.map((mark) => {
      const studentDoc = allStudents?.find((s) => s._id === mark.studentId);
      const customStudentId = studentDoc?.studentId || mark.studentId;
      return [
        customStudentId,
        mark.studentName,
        mark.className,
        mark.subjectName,
        String(mark.classScore),
        String(mark.examScore),
        String(mark.totalScore),
        mark.percentage.toFixed(1),
        mark.grade,
        mark.remarks,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const className = viewAllMode ? 'All-Classes' : allClasses?.find((c) => c._id === selectedClass)?.className || 'Class';
    a.download = `marks-${exam?.examName}-${className}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleViewMode = (): void => {
    setViewAllMode(!viewAllMode);
    setSearchQuery('');
    setSelectedStudent(null);
  };

  const handleStudentClick = (student: StudentMarksSummary): void => {
    setSelectedStudent(student);
  };

  const handleBackToList = (): void => {
    setSelectedStudent(null);
  };

  const handleNextStudent = (): void => {
    if (!selectedStudent || !filteredStudents) return;
    const currentIndex = filteredStudents.findIndex(
      (s) => s.studentConvexId === selectedStudent.studentConvexId
    );
    if (currentIndex < filteredStudents.length - 1) {
      setSelectedStudent(filteredStudents[currentIndex + 1]);
    }
  };

  const handlePreviousStudent = (): void => {
    if (!selectedStudent || !filteredStudents) return;
    const currentIndex = filteredStudents.findIndex(
      (s) => s.studentConvexId === selectedStudent.studentConvexId
    );
    if (currentIndex > 0) {
      setSelectedStudent(filteredStudents[currentIndex - 1]);
    }
  };

  const currentStudentIndex = selectedStudent
    ? filteredStudents.findIndex((s) => s.studentConvexId === selectedStudent.studentConvexId) + 1
    : 0;
  const totalStudents = filteredStudents.length;

  const selectedClassName = allClasses?.find((c) => c._id === selectedClass)?.className || '';

  // Loading state
  const isLoading = (selectedClass || viewAllMode) && marks === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[95vw] max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>View Marks - {exam?.examName}</DialogTitle>
          <DialogDescription>
            {viewAllMode
              ? 'Viewing marks for all classes in this exam'
              : selectedClass
              ? `Viewing marks for ${selectedClassName}`
              : 'Select a class to view marks'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Class Selection (Required) */}
          {!viewAllMode && (
            <div className="space-y-2">
              <Label htmlFor="class-selector" className="text-base font-semibold">
                Select Class <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-selector" className="flex-1">
                    <SelectValue placeholder="Choose a class to view marks..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allClasses?.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={toggleViewMode} size="default">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Classes
                </Button>
              </div>
            </div>
          )}

          {/* View All Mode Header */}
          {viewAllMode && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <strong>Advanced Mode:</strong> Viewing marks for all classes. This may take longer to load.
                </span>
                <Button variant="outline" size="sm" onClick={toggleViewMode}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Back to Class View
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Show content only if class is selected or in view all mode */}
          {(selectedClass || viewAllMode) ? (
            <>
              {/* Loading State */}
              {isLoading ? (
                <div className="space-y-4 flex-1">
                  {/* Statistics Skeleton */}
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-6 w-12" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Search Skeleton */}
                  <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-32" />
                  </div>

                  {/* Table Skeleton */}
                  <div className="border rounded-lg p-4 space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              ) : selectedStudent ? (
                /* Student Detail View */
                <>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={handleBackToList}>
                      <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                      Back to Students
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Student {currentStudentIndex} of {totalStudents}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousStudent}
                          disabled={currentStudentIndex <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextStudent}
                          disabled={currentStudentIndex >= totalStudents}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold">{selectedStudent.studentName}</h3>
                          <p className="text-sm text-muted-foreground">Student ID: {selectedStudent.customStudentId}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">{selectedStudent.averagePercentage.toFixed(1)}%</div>
                          <p className="text-sm text-muted-foreground">Average</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Subjects</p>
                          <p className="text-lg font-semibold">{selectedStudent.totalSubjects}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Score</p>
                          <p className="text-lg font-semibold">{selectedStudent.averageScore.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <ScrollArea className="flex-1 border rounded-lg h-[400px]">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="min-w-[180px]">Subject</TableHead>
                          <TableHead className="text-center">Class Score</TableHead>
                          <TableHead className="text-center">Exam Score</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Percentage</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudent.marks.map((mark) => (
                          <TableRow key={mark._id}>
                            <TableCell className="font-medium">{mark.subjectName}</TableCell>
                            <TableCell className="text-center">{mark.classScore}</TableCell>
                            <TableCell className="text-center">{mark.examScore}</TableCell>
                            <TableCell className="text-center font-medium">{mark.totalScore}</TableCell>
                            <TableCell className="text-center">{mark.percentage.toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{mark.grade}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={mark.isAbsent ? 'destructive' : 'default'}>
                                {mark.isAbsent ? 'Absent' : mark.remarks}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </>
              ) : (
                /* Students List View */
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Entries</p>
                            <p className="text-xl font-bold">{stats.total}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Students</p>
                            <p className="text-xl font-bold">{stats.students}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Classes</p>
                            <p className="text-xl font-bold">{stats.classes}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Subjects</p>
                            <p className="text-xl font-bold">{stats.subjects}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search and Export */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="search">Search Students</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search by student name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button variant="outline" onClick={handleExportCSV} disabled={!marks || marks.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  {/* Students Table */}
                  <ScrollArea className="flex-1 border rounded-lg h-[400px]">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="min-w-[200px]">Student Name</TableHead>
                          <TableHead className="min-w-[150px]">Student ID</TableHead>
                          <TableHead className="text-center">Subjects</TableHead>
                          <TableHead className="text-center">Average Score</TableHead>
                          <TableHead className="text-center">Average %</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents && filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <TableRow 
                              key={student.studentConvexId} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleStudentClick(student)}
                            >
                              <TableCell className="font-medium">{student.studentName}</TableCell>
                              <TableCell className="text-muted-foreground">{student.customStudentId}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{student.totalSubjects}</Badge>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {student.averageScore.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant={
                                    student.averagePercentage >= 75 ? 'default' :
                                    student.averagePercentage >= 50 ? 'secondary' :
                                    'destructive'
                                  }
                                >
                                  {student.averagePercentage.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  View Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32">
                              <div className="flex flex-col items-center justify-center text-center">
                                <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">
                                  {marks && marks.length === 0 ? 'No students found' : 'No students match your search'}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredStudents?.length || 0} of {stats.students} students
                      {!viewAllMode && selectedClassName && ` in ${selectedClassName}`}
                    </p>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Empty State - No Class Selected */
            <div className="flex-1 flex items-center justify-center">
              <Card className="max-w-md border-dashed">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Select a Class to Get Started</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a class from the dropdown above to view student marks and performance data for this exam.
                      </p>
                    </div>
                    <div className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>View individual student performance</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Export marks data to CSV</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>Track subject-wise progress</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
