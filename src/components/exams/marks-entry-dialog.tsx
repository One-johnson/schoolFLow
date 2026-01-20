'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { Loader2, Save } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface MarksEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  schoolId: string;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  classScore: number;
  examScore: number;
}

export function MarksEntryDialog({ open, onOpenChange, examId, schoolId }: MarksEntryDialogProps) {
  const { toast } = useToast();
  const exam = useQuery(api.exams.getExamById, { examId });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const enterMarks = useMutation(api.marks.enterMarks);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const subjects = exam?.subjects ? JSON.parse(exam.subjects) : [];

  const handleLoadStudents = async (): Promise<void> => {
    if (!selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch students from the selected class
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol: 'https',
          origin: window.location.origin,
          path: '/api/students',
          method: 'GET',
          headers: {},
          body: JSON.stringify({ classId: selectedClassId }),
        }),
      });

      if (!response.ok) throw new Error('Failed to load students');

      const data = await response.json();
      setStudents(
        data.students?.map((s: { _id: string; firstName: string; lastName: string }) => ({
          studentId: s._id,
          studentName: `${s.firstName} ${s.lastName}`,
          classScore: 0,
          examScore: 0,
        })) || []
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, field: 'classScore' | 'examScore', value: string): void => {
    setStudents(
      students.map((s) =>
        s.studentId === studentId ? { ...s, [field]: Number(value) || 0 } : s
      )
    );
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedClassId || !selectedSubject) {
      toast({
        title: 'Validation Error',
        description: 'Please select class and subject',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classes?.find((c) => c._id === selectedClassId);
      const subjectData = subjects.find((s: { name: string; id: string }) => s.name === selectedSubject);

      // Enter marks for each student individually
      for (const student of students) {
        await enterMarks({
          schoolId,
          examId,
          examCode: exam?.examCode || '',
          examName: exam?.examName || '',
          studentId: student.studentId,
          studentName: student.studentName,
          classId: selectedClassId,
          className: selectedClass?.className || '',
          subjectId: subjectData?.id || selectedSubject,
          subjectName: selectedSubject,
          classScore: student.classScore,
          examScore: student.examScore,
          maxMarks: subjectData?.maxMarks || 100,
          isAbsent: false,
          enteredBy: schoolId,
          enteredByRole: 'admin',
          enteredByName: 'School Admin',
        });
      }

      toast({
        title: 'Success',
        description: `Marks entered successfully for ${students.length} student${students.length > 1 ? 's' : ''}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enter marks',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Marks - {exam?.examName}</DialogTitle>
          <DialogDescription>
            Record class scores and exam scores for students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Select Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: { name: string; maxMarks: number }) => (
                    <SelectItem key={subject.name} value={subject.name}>
                      {subject.name} (Max: {subject.maxMarks})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8">
              <Button onClick={handleLoadStudents} disabled={isLoading || !selectedClassId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load Students
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Student Name</th>
                      <th className="text-left p-3 font-medium w-32">Class Score (%)</th>
                      <th className="text-left p-3 font-medium w-32">Exam Score (%)</th>
                      <th className="text-left p-3 font-medium w-32">Total (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const total = student.classScore + student.examScore;
                      return (
                        <tr key={student.studentId} className="border-t">
                          <td className="p-3">{student.studentName}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={student.classScore || ''}
                              onChange={(e) =>
                                handleMarkChange(student.studentId, 'classScore', e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={student.examScore || ''}
                              onChange={(e) =>
                                handleMarkChange(student.studentId, 'examScore', e.target.value)
                              }
                              className="w-full"
                            />
                          </td>
                          <td className="p-3 font-medium">{total.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Marks
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
