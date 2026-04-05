'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarksEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  schoolId: string;
}

interface Subject {
  id: string;
  name: string;
}

interface StudentRow {
  studentId: string;
  studentName: string;
  emt1: number;
  emt2: number;
  emt3: number;
  sba: number;
  project: number;
  examRaw: number;
  isAbsent: boolean;
}

export function MarksEntryDialog({
  open,
  onOpenChange,
  examId,
  schoolId,
}: MarksEntryDialogProps) {
  const { toast } = useToast();
  const exam = useQuery(api.exams.getExamById, { examId });
  const allClasses = useQuery(api.classes.getClassesBySchool, { schoolId });
  const enterMarks = useMutation(api.marks.enterMarks);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loadStudents, setLoadStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classes = useMemo(() => {
    return allClasses?.filter((cls) => {
      if (!exam?.departmentId) return true;
      return cls.departmentId === exam.departmentId;
    });
  }, [allClasses, exam?.departmentId]);

  const selectedClass = classes?.find((c) => c._id === selectedClassId);

  const studentsData = useQuery(
    api.students.getStudentsByClass,
    loadStudents && selectedClass ? { classId: selectedClass.classCode } : 'skip',
  );

  const existingMarks = useQuery(
    api.marks.getClassMarks,
    selectedClass ? { examId, classId: selectedClass.classCode } : 'skip',
  );

  const subjects: Subject[] = useMemo(() => {
    const raw = exam?.subjects ? JSON.parse(exam.subjects) : [];
    return raw.map((s: { subjectId: string; subjectName: string }) => ({
      id: s.subjectId,
      name: s.subjectName,
    }));
  }, [exam?.subjects]);

  useEffect(() => {
    if (!open) return;
    setRows([]);
    setLoadStudents(false);
    setStudentFilter('');
  }, [open, selectedClassId, selectedSubjectId]);

  useEffect(() => {
    if (!studentsData || !selectedSubjectId) return;
    const subjectMarks = (existingMarks || []).filter(
      (m) => m.subjectId === selectedSubjectId,
    );
    setRows(
      studentsData.map((s) => {
        const existing = subjectMarks.find((m) => m.studentId === s._id);
        return {
          studentId: s._id,
          studentName: `${s.firstName} ${s.lastName}`,
          emt1: existing?.emt1 ?? 0,
          emt2: existing?.emt2 ?? 0,
          emt3: existing?.emt3 ?? 0,
          sba: existing?.sba ?? 0,
          project: existing?.project ?? 0,
          examRaw: existing?.examRaw ?? 0,
          isAbsent: existing?.isAbsent ?? false,
        };
      }),
    );
  }, [studentsData, existingMarks, selectedSubjectId]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const updateField = (
    studentId: string,
    field: keyof Pick<StudentRow, 'emt1' | 'emt2' | 'emt3' | 'sba' | 'project' | 'examRaw'>,
    value: string,
    max: number,
  ) => {
    const n = parseFloat(value);
    const safe = Number.isFinite(n) ? n : 0;
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, [field]: clamp(safe, 0, max) } : r,
      ),
    );
  };

  const toggleAbsent = (studentId: string, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              isAbsent: checked,
              emt1: checked ? 0 : r.emt1,
              emt2: checked ? 0 : r.emt2,
              emt3: checked ? 0 : r.emt3,
              sba: checked ? 0 : r.sba,
              project: checked ? 0 : r.project,
              examRaw: checked ? 0 : r.examRaw,
            }
          : r,
      ),
    );
  };

  const filteredRows = rows.filter((r) =>
    r.studentName.toLowerCase().includes(studentFilter.toLowerCase()),
  );

  const handleLoadStudents = () => {
    if (!selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedSubjectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject',
        variant: 'destructive',
      });
      return;
    }
    setLoadStudents(true);
  };

  const handleSubmit = async () => {
    if (!exam || !selectedClass) return;
    const subject = subjects.find((s) => s.id === selectedSubjectId);
    if (!subject) return;

    setIsSubmitting(true);
    try {
      for (const r of rows) {
        await enterMarks({
          schoolId,
          examId,
          examCode: exam.examCode,
          examName: exam.examName,
          studentId: r.studentId,
          studentName: r.studentName,
          classId: selectedClass.classCode,
          className: selectedClass.className,
          subjectId: subject.id,
          subjectName: subject.name,
          emt1: r.emt1,
          emt2: r.emt2,
          emt3: r.emt3,
          sba: r.sba,
          project: r.project,
          examRaw: r.examRaw,
          isAbsent: r.isAbsent,
          enteredBy: schoolId,
          enteredByRole: 'admin',
          enteredByName: 'School Admin',
        });
      }
      toast({ title: 'Saved', description: 'Assessment sheet saved successfully.' });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save marks',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assessment Sheet</DialogTitle>
          <DialogDescription>
            EMT1/2/3 (/10 each) + SBA (/10) + Project (/20) = Class (/60), then 50/50 with Exam
            (/100).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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

            <div>
              <Label>Select Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filter student</Label>
              <Input
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Search by name"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleLoadStudents}
                disabled={!selectedClassId || !selectedSubjectId || loadStudents}
                className="w-full"
              >
                {loadStudents ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Students'
                )}
              </Button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Select class + subject, then load students.
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Student</TableHead>
                    <TableHead className="w-[70px] text-center">EMT1</TableHead>
                    <TableHead className="w-[70px] text-center">EMT2</TableHead>
                    <TableHead className="w-[70px] text-center">EMT3</TableHead>
                    <TableHead className="w-[70px] text-center">SBA</TableHead>
                    <TableHead className="w-[80px] text-center">Project</TableHead>
                    <TableHead className="w-[80px] text-center">Exam</TableHead>
                    <TableHead className="w-[80px] text-center">Class/60</TableHead>
                    <TableHead className="w-[70px] text-center">Total/100</TableHead>
                    <TableHead className="w-[60px] text-center">Absent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((r) => {
                    const classTotal = r.emt1 + r.emt2 + r.emt3 + r.sba + r.project;
                    const class50 = (classTotal / 60) * 50;
                    const exam50 = (r.examRaw / 100) * 50;
                    const total = class50 + exam50;
                    return (
                      <TableRow key={r.studentId}>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={r.emt1}
                            disabled={r.isAbsent}
                            onChange={(e) => updateField(r.studentId, 'emt1', e.target.value, 10)}
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={r.emt2}
                            disabled={r.isAbsent}
                            onChange={(e) => updateField(r.studentId, 'emt2', e.target.value, 10)}
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={r.emt3}
                            disabled={r.isAbsent}
                            onChange={(e) => updateField(r.studentId, 'emt3', e.target.value, 10)}
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={r.sba}
                            disabled={r.isAbsent}
                            onChange={(e) => updateField(r.studentId, 'sba', e.target.value, 10)}
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            step={0.5}
                            value={r.project}
                            disabled={r.isAbsent}
                            onChange={(e) =>
                              updateField(r.studentId, 'project', e.target.value, 20)
                            }
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={r.examRaw}
                            disabled={r.isAbsent}
                            onChange={(e) =>
                              updateField(r.studentId, 'examRaw', e.target.value, 100)
                            }
                            className="w-16 text-center h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {r.isAbsent ? '-' : classTotal.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {r.isAbsent ? '-' : total.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={r.isAbsent}
                            onCheckedChange={(checked) =>
                              toggleAbsent(r.studentId, checked as boolean)
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || rows.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Sheet
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
