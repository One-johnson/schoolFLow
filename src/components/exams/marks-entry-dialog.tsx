'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Download, Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/badge';
import { CSVMarksImportDialog } from './csv-marks-import-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MarksEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  schoolId: string;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  subjects: Record<string, { classScore: number; examScore: number }>;
}

interface Subject {
  name: string;
  id?: string;
  maxMarks: number;
}

const departmentNames: Record<string, string> = {
  creche: 'Creche',
  kindergarten: 'Kindergarten',
  primary: 'Primary',
  junior_high: 'Junior High',
};

export function MarksEntryDialog({ open, onOpenChange, examId, schoolId }: MarksEntryDialogProps) {
  const { toast } = useToast();
  const exam = useQuery(api.exams.getExamById, { examId });
  const allClasses = useQuery(api.classes.getClassesBySchool, { schoolId });
  const enterMarks = useMutation(api.marks.enterMarks);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loadStudents, setLoadStudents] = useState<boolean>(false);
  const [csvImportOpen, setCsvImportOpen] = useState<boolean>(false);

  // Filter classes by exam department
  const classes = allClasses?.filter((cls) => {
    if (!exam?.department) return true;
    return cls.department === exam.department;
  });

  // Get the selected class to find its classCode
  const selectedClass = classes?.find((c) => c._id === selectedClassId);
  
  // Query students from the selected class using classCode
  const studentsData = useQuery(
    api.students.getStudentsByClass,
    loadStudents && selectedClass ? { classId: selectedClass.classCode } : 'skip'
  );
  
  // Query existing marks for the selected class
  const existingMarks = useQuery(
    api.marks.getClassMarks,
    selectedClassId && selectedClass ? { examId, classId: selectedClass.classCode } : 'skip'
  );

  const subjects: Subject[] = exam?.subjects ? JSON.parse(exam.subjects) : [];

  // Load draft from localStorage
  useEffect(() => {
    if (open && selectedClassId) {
      const draftKey = `marks-draft-${examId}-${selectedClassId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setStudents(parsed);
          toast({
            title: 'Draft Loaded',
            description: 'Previous unsaved work has been restored',
          });
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }
    }
  }, [open, selectedClassId, examId, toast]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (students.length > 0 && selectedClassId) {
      const draftKey = `marks-draft-${examId}-${selectedClassId}`;
      localStorage.setItem(draftKey, JSON.stringify(students));
    }
  }, [students, selectedClassId, examId]);

  // Clear students when class selection changes
  useEffect(() => {
    setStudents([]);
    setLoadStudents(false);
  }, [selectedClassId]);

  // Handle loaded students data and merge with existing marks
  useEffect(() => {
    if (studentsData && studentsData.length > 0) {
      const initialMarks: StudentMark[] = studentsData.map((s) => {
        const subjectsMap: Record<string, { classScore: number; examScore: number }> = {};
        
        subjects.forEach((subject) => {
          // Check if existing marks exist for this student and subject
          const existingMark = existingMarks?.find(
            (m) => m.studentId === s.studentId && m.subjectName === subject.name
          );
          
          subjectsMap[subject.name] = existingMark 
            ? { classScore: existingMark.classScore, examScore: existingMark.examScore }
            : { classScore: 0, examScore: 0 };
        });
        
        return {
          studentId: s.studentId,
          studentName: `${s.firstName} ${s.lastName}`,
          subjects: subjectsMap,
        };
      });
      
      setStudents(initialMarks);
      setLoadStudents(false);
      
      // Show toast if existing marks were loaded
      if (existingMarks && existingMarks.length > 0) {
        toast({
          title: 'Existing Marks Loaded',
          description: `${existingMarks.length} existing mark entries pre-filled`,
        });
      }
    } else if (studentsData && studentsData.length === 0) {
      toast({
        title: 'No Students Found',
        description: 'No students found in the selected class',
        variant: 'destructive',
      });
      setStudents([]);
      setLoadStudents(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsData, existingMarks]);

  const handleLoadStudents = (): void => {
    if (!selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return;
    }
    
    setLoadStudents(true);
  };

  const handleMarkChange = (
    studentId: string,
    subjectName: string,
    field: 'classScore' | 'examScore',
    value: string
  ): void => {
    const numValue = Number(value);
    
    // Validate marks are between 0 and 100
    if (value !== '' && (numValue < 0 || numValue > 100)) {
      toast({
        title: 'Invalid Mark',
        description: 'Marks must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }
    
    setStudents(
      students.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              subjects: {
                ...s.subjects,
                [subjectName]: {
                  ...s.subjects[subjectName],
                  [field]: value === '' ? 0 : numValue,
                },
              },
            }
          : s
      )
    );
  };

  const calculateSubjectTotal = (classScore: number, examScore: number): number => {
    return classScore + examScore;
  };

  const calculateStudentAverage = (studentSubjects: Record<string, { classScore: number; examScore: number }>): number => {
    const totals = Object.values(studentSubjects).map((s) => s.classScore + s.examScore);
    const sum = totals.reduce((acc, val) => acc + val, 0);
    return totals.length > 0 ? sum / totals.length : 0;
  };

  const getCompletionStatus = (student: StudentMark): { completed: number; total: number } => {
    let completed = 0;
    const total = subjects.length;
    subjects.forEach((subject) => {
      const marks = student.subjects[subject.name];
      if (marks && (marks.classScore > 0 || marks.examScore > 0)) {
        completed++;
      }
    });
    return { completed, total };
  };

  const isOutOfRange = (value: number, max: number): boolean => {
    return value > max;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedClass) {
      toast({
        title: 'Error',
        description: 'Selected class not found',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let savedCount = 0;

      // Enter marks for each student and subject
      for (const student of students) {
        for (const subject of subjects) {
          const marks = student.subjects[subject.name];
          if (marks && (marks.classScore > 0 || marks.examScore > 0)) {
            await enterMarks({
              schoolId,
              examId,
              examCode: exam?.examCode || '',
              examName: exam?.examName || '',
              studentId: student.studentId,
              studentName: student.studentName,
              classId: selectedClass.classCode,
              className: selectedClass.className,
              subjectId: (subject.id || subject.name) as Id<'subjects'>,
              subjectName: subject.name,
              classScore: marks.classScore,
              examScore: marks.examScore,
              maxMarks: subject.maxMarks || 100,
              isAbsent: false,
              enteredBy: schoolId,
              enteredByRole: 'admin',
              enteredByName: 'School Admin',
            });
            savedCount++;
          }
        }
      }

      // Clear draft after successful save
      const draftKey = `marks-draft-${examId}-${selectedClassId}`;
      localStorage.removeItem(draftKey);

      toast({
        title: 'Success',
        description: `Marks entered successfully for ${students.length} student${students.length > 1 ? 's' : ''} (${savedCount} entries)`,
      });

      onOpenChange(false);
      // Reset state
      setSelectedClassId('');
      setStudents([]);
      setLoadStudents(false);
    } catch (error) {
      // Enhanced error handling with prominent toast notification
      const errorMessage = error instanceof Error ? error.message : 'Failed to enter marks';
      
      // Determine if this is a lock-related error
      const isLockError = errorMessage.toLowerCase().includes('locked') || 
                         errorMessage.toLowerCase().includes('cannot edit');
      
      toast({
        title: isLockError ? '🔒 Exam Locked' : 'Error Saving Marks',
        description: errorMessage,
        variant: 'destructive',
        // Removed invalid 'duration' property to fix type error
      });
      
      // Dialog stays open so user can see the error and take action
      // Do not close the dialog or reset state on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = (): void => {
    if (students.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please load students first',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV header
    const headers = ['Student Name'];
    subjects.forEach((subject) => {
      headers.push(`${subject.name} - Class Score`, `${subject.name} - Exam Score`);
    });
    headers.push('Average');

    // Create CSV rows
    const rows = students.map((student) => {
      const row = [student.studentName];
      subjects.forEach((subject) => {
        const marks = student.subjects[subject.name];
        row.push(String(marks?.classScore || 0), String(marks?.examScore || 0));
      });
      row.push(calculateStudentAverage(student.subjects).toFixed(1));
      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-${exam?.examName}-${selectedClass?.className}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Marks template exported as CSV',
    });
  };

  const handleCSVImport = (data: Array<{ studentId: string; subjects: Record<string, { classScore: number; examScore: number }> }>): void => {
    // Merge imported data with existing students
    setStudents(
      students.map((student) => {
        const importedStudent = data.find((d) => d.studentId === student.studentId);
        if (importedStudent) {
          return {
            ...student,
            subjects: importedStudent.subjects,
          };
        }
        return student;
      })
    );

    toast({
      title: 'Import Successful',
      description: `Marks imported for ${data.length} students`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[95vw] max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingMarks && existingMarks.length > 0 ? 'View & Edit Marks' : 'Enter Marks'} - {exam?.examName}
            {exam?.department && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({departmentNames[exam.department as keyof typeof departmentNames]})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Exam ID: {exam?.examCode} • Grid view - {existingMarks && existingMarks.length > 0 ? 'Edit existing marks or add new ones' : 'Enter marks for all subjects at once'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="class">Select Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exam?.department && classes && classes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No {departmentNames[exam.department as keyof typeof departmentNames]} classes found
                </p>
              )}
            </div>

            {students.length === 0 && (
              <Button onClick={handleLoadStudents} disabled={!selectedClassId || loadStudents}>
                {loadStudents && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load Students
              </Button>
            )}

            {students.length > 0 && (
              <>
                <Button variant="outline" onClick={() => setCsvImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </>
            )}
          </div>

          {students.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Info className="h-4 w-4" />
                <span>
                  Entering marks for {students.length} students across {subjects.length} subjects. 
                  Changes are auto-saved as drafts.
                </span>
              </div>

              <div className="flex-1 rounded-lg border overflow-auto max-h-125">
                <div className="min-w-max">
                  <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-left p-3 font-medium border-r min-w-50">
                          Student Name
                        </TableHead>
                        {subjects.map((subject) => (
                          <TableHead
                            key={subject.name}
                            className="text-center p-3 font-medium border-r"
                            colSpan={2}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{subject.name}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                Max: {subject.maxMarks}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center p-3 font-medium min-w-25">
                          Avg %
                        </TableHead>
                        <TableHead className="text-center p-3 font-medium min-w-30">
                          Status
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/80">
                        <TableHead className="p-2 border-r"></TableHead>
                        {subjects.map((subject) => (
                          <React.Fragment key={`${subject.name}-headers`}>
                            <TableHead className="text-xs p-2 font-normal text-muted-foreground">
                              CA
                            </TableHead>
                            <TableHead className="text-xs p-2 font-normal text-muted-foreground border-r">
                              Exam
                            </TableHead>
                          </React.Fragment>
                        ))}
                        <TableHead className="p-2"></TableHead>
                        <TableHead className="p-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => {
                        const avg = calculateStudentAverage(student.subjects);
                        const status = getCompletionStatus(student);
                        const isComplete = status.completed === status.total;

                        return (
                          <TableRow key={student.studentId} className="hover:bg-muted/30">
                            <TableCell className="p-3 font-medium border-r">
                              {student.studentName}
                            </TableCell>
                            {subjects.map((subject) => {
                              const marks = student.subjects[subject.name];
                              const total = calculateSubjectTotal(marks?.classScore || 0, marks?.examScore || 0);
                              const maxCA = subject.maxMarks * 0.4; // Assuming 40% for CA
                              const maxExam = subject.maxMarks * 0.6; // Assuming 60% for Exam

                              return (
                                <React.Fragment key={`${student.studentId}-${subject.name}`}>
                                  <TableCell className="p-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={marks?.classScore || ''}
                                      onChange={(e) =>
                                        handleMarkChange(student.studentId, subject.name, 'classScore', e.target.value)
                                      }
                                      className={`w-20 text-center ${
                                        (marks?.classScore || 0) > 100
                                          ? 'border-red-500 dark:border-red-400'
                                          : ''
                                      }`}
                                      placeholder="0"
                                    />
                                  </TableCell>
                                  <TableCell className="p-2 border-r">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={marks?.examScore || ''}
                                      onChange={(e) =>
                                        handleMarkChange(student.studentId, subject.name, 'examScore', e.target.value)
                                      }
                                      className={`w-20 text-center ${
                                        (marks?.examScore || 0) > 100
                                          ? 'border-red-500 dark:border-red-400'
                                          : ''
                                      }`}
                                      placeholder="0"
                                    />
                                  </TableCell>
                                </React.Fragment>
                              );
                            })}
                            <TableCell className="p-3 text-center font-medium">
                              {avg.toFixed(1)}%
                            </TableCell>
                            <TableCell className="p-3 text-center">
                              {isComplete ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {status.completed}/{status.total}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  💾 Draft auto-saved • {students.length} students • {subjects.length} subjects
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {existingMarks && existingMarks.length > 0 ? 'Update Marks' : 'Save All Marks'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <CSVMarksImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        subjects={subjects}
        students={students.map((s) => ({ studentId: s.studentId, studentName: s.studentName }))}
        onImport={handleCSVImport}
        examName={exam?.examName}
        className={selectedClass?.className}
      />
    </Dialog>
  );
}
