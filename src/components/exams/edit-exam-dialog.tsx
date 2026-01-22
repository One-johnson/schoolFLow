'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface EditExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  schoolId: string;
}

interface Subject {
  name: string;
  maxMarks: number;
  id?: string;
}

export function EditExamDialog({ open, onOpenChange, examId, schoolId }: EditExamDialogProps) {
  const { toast } = useToast();
  const updateExam = useMutation(api.exams.updateExam);
  const exam = useQuery(api.exams.getExamById, { examId });
  const academicYears = useQuery(api.academicYears.getActiveAcademicYears, { schoolId });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [examName, setExamName] = useState<string>('');
  const [examType, setExamType] = useState<string>('mid_term');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [termId, setTermId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [department, setDepartment] = useState<string>('primary');
  const [weightage, setWeightage] = useState<string>('50');
  const [instructions, setInstructions] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([{ name: '', maxMarks: 100 }]);
  // Query subjects by department - always load for the exam's department
  const departmentSubjects = useQuery(
    api.subjects.getSubjectsByDepartment,
    department ? { 
      schoolId, 
      department: department as 'creche' | 'kindergarten' | 'primary' | 'junior_high' 
    } : 'skip'
  );

  // Initialize form with exam data
  useEffect(() => {
    if (exam && open) {
      setExamName(exam.examName);
      setExamType(exam.examType);
      setAcademicYearId(exam.academicYearId ?? "");
      setTermId(exam.termId ?? "");
      setStartDate(exam.startDate);
      setEndDate(exam.endDate);
      setDepartment(exam.department || 'primary');
      setWeightage(String(exam.weightage));
      setInstructions(exam.instructions || '');
    }
  }, [exam, open]);

  // Auto-populate subjects from database when department subjects load
  useEffect(() => {
    if (departmentSubjects && departmentSubjects.length > 0) {
      setSubjects(
        departmentSubjects.map((subj) => ({
          name: subj.subjectName,
          maxMarks: 100,
          id: subj._id,
        }))
      );
    }
  }, [departmentSubjects]);



  const handleSubjectChange = (index: number, field: keyof Subject, value: string | number): void => {
    const updated = [...subjects];
    if (field === 'maxMarks') {
      updated[index][field] = Number(value);
    } else if (field === 'name') {
      updated[index][field] = value as string;
    }
    setSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validSubjects = subjects.filter((s) => s.name.trim() !== '');
      if (validSubjects.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one subject',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate total marks
      const totalMarks: number = validSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

      await updateExam({
        examId,
        examName,
        examType: examType as 'mid_term' | 'end_of_term' | 'mock' | 'quiz' | 'assessment' | 'final',
        startDate,
        endDate,
        subjects: JSON.stringify(validSubjects),
        totalMarks,
        weightage: Number(weightage),
        instructions: instructions || undefined,
      });

      toast({
        title: 'Success',
        description: 'Exam updated successfully',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exam',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Update exam details and subjects</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Exam Name *</Label>
              <Input
                id="examName"
                placeholder="e.g., Mid-Term Exam"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type *</Label>
              <Select value={examType} onValueChange={setExamType} required>
                <SelectTrigger id="examType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mid_term">Mid-Term</SelectItem>
                  <SelectItem value="end_of_term">End of Term</SelectItem>
                  <SelectItem value="mock">Mock Exam</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId} required>
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.yearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Select value={termId} onValueChange={setTermId} required>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears
                    ?.find((y) => y._id === academicYearId)
                    ?.terms?.map((term: { termId: string; termName: string }) => (
                      <SelectItem key={term.termId} value={term.termId}>
                        {term.termName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={department} onValueChange={setDepartment} required disabled>
                <SelectTrigger id="department" className="opacity-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creche">Creche</SelectItem>
                  <SelectItem value="kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="junior_high">Junior High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Department cannot be changed after exam creation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%) *</Label>
              <Input
                id="weightage"
                type="number"
                min="0"
                max="100"
                value={weightage}
                onChange={(e) => setWeightage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subjects * <span className="text-sm text-muted-foreground">(Loaded from {department})</span></Label>
            {subjects.length > 0 && subjects[0].name !== '' ? (
              <div className="space-y-2">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Subject name"
                      value={subject.name}
                      onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                      className="flex-1"
                      disabled
                    />
                    <Input
                      type="number"
                      placeholder="Max marks"
                      value={subject.maxMarks}
                      onChange={(e) => handleSubjectChange(index, 'maxMarks', e.target.value)}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                No subjects found for {department}. Cannot edit this exam.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Enter exam instructions or notes"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
