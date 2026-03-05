'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AddExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  adminId: string;
}

interface Subject {
  name: string;
  maxMarks: number;
  id?: string;
}

export function AddExamDialog({ open, onOpenChange, schoolId, adminId }: AddExamDialogProps) {
  const { toast } = useToast();
  const createExam = useMutation(api.exams.createExam);
  const academicYears = useQuery(api.academicYears.getActiveAcademicYears, { schoolId });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [examName, setExamName] = useState<string>('');
  const [examType, setExamType] = useState<string>('mid_term');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [termId, setTermId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [weightage, setWeightage] = useState<string>('50');
  const [instructions, setInstructions] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([{ name: '', maxMarks: 100 }]);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);

  const allClasses = useQuery(
    api.classes.getClassesBySchool,
    schoolId ? { schoolId } : 'skip'
  );

  const departments = useQuery(
    api.departments.getDepartmentsBySchool,
    schoolId ? { schoolId } : 'skip'
  );

  // Query subjects by department
  const departmentSubjects = useQuery(
    api.subjects.getSubjectsByDepartment,
    departmentId ? { schoolId, departmentId: departmentId as Id<'departments'> } : 'skip'
  );

  // Classes in selected department (for target classes)
  const departmentClasses = allClasses?.filter(
    (c) => c.departmentId === departmentId
  ) ?? [];

  // Set default department when departments load
  useEffect(() => {
    if (departments?.length && !departmentId) {
      setDepartmentId(departments[0]._id);
    }
  }, [departments, departmentId]);

  // Clear target classes when department changes (optional: keep if still valid)
  useEffect(() => {
    if (departmentId && departmentClasses.length > 0) {
      setTargetClassIds((prev) =>
        prev.filter((id) => departmentClasses.some((c) => c._id === id))
      );
    } else {
      setTargetClassIds([]);
    }
  }, [departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-populate subjects when department changes
  useEffect(() => {
    if (departmentSubjects && departmentSubjects.length > 0) {
      setSubjects(
        departmentSubjects.map((subj) => ({
          name: subj.subjectName,
          maxMarks: 100,
          id: subj._id,
        }))
      );
      const deptName = departments?.find((d) => d._id === departmentId)?.name ?? departmentId;
      toast({
        title: 'Subjects Loaded',
        description: `Loaded ${departmentSubjects.length} subject(s) for ${deptName}`,
      });
    } else if (departmentSubjects && departmentSubjects.length === 0) {
      setSubjects([{ name: '', maxMarks: 100 }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentSubjects, departmentId]);



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
      // Validate subjects
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

      if (targetClassIds.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please select at least one target class',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate total marks
      const totalMarks: number = validSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

      await createExam({
        schoolId,
        examName,
        examType: examType as 'mid_term' | 'end_of_term' | 'mock' | 'quiz' | 'assessment' | 'final',
        academicYearId,
        termId,
        startDate,
        endDate,
        departmentId: departmentId ? (departmentId as Id<'departments'>) : undefined,
        targetClasses: targetClassIds,
        weightage: Number(weightage),
        instructions: instructions || undefined,
        subjects: JSON.stringify(validSubjects),
        totalMarks,
        createdBy: adminId,
      });

      toast({
        title: 'Success',
        description: 'Exam created successfully',
      });

      // Reset form
      setExamName('');
      setExamType('mid_term');
      setAcademicYearId('');
      setTermId('');
      setStartDate('');
      setEndDate('');
      setWeightage('50');
      setInstructions('');
      setSubjects([{ name: '', maxMarks: 100 }]);
      setTargetClassIds([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create exam',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Set up a new exam with subjects and marking criteria
          </DialogDescription>
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
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(new Date(startDate + 'T12:00:00'), 'PPP')
                      : 'Pick start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate + 'T12:00:00') : undefined}
                    onSelect={(date) => date && setStartDate(format(date, 'yyyy-MM-dd'))}
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                    endMonth={new Date(new Date().getFullYear() + 2, 11, 31)}
                    defaultMonth={startDate ? new Date(startDate + 'T12:00:00') : new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(new Date(endDate + 'T12:00:00'), 'PPP')
                      : 'Pick end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate + 'T12:00:00') : undefined}
                    onSelect={(date) => date && setEndDate(format(date, 'yyyy-MM-dd'))}
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(new Date().getFullYear() - 1, 0, 1)}
                    endMonth={new Date(new Date().getFullYear() + 2, 11, 31)}
                    defaultMonth={endDate ? new Date(endDate + 'T12:00:00') : new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} required>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label>Target Classes *</Label>
            <p className="text-sm text-muted-foreground">Select which classes this exam applies to (teachers for these classes will see the exam)</p>
            {departmentClasses.length > 0 ? (
              <ScrollArea className="h-[120px] border rounded-md p-3">
                <div className="space-y-2">
                  {departmentClasses.map((cls) => (
                    <div key={cls._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`target-${cls._id}`}
                        checked={targetClassIds.includes(cls._id)}
                        onCheckedChange={(checked) => {
                          setTargetClassIds((prev) =>
                            checked
                              ? [...prev, cls._id]
                              : prev.filter((id) => id !== cls._id)
                          );
                        }}
                      />
                      <label
                        htmlFor={`target-${cls._id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {cls.className}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No classes in this department. Select a department first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subjects * {departmentSubjects && departmentSubjects.length > 0 && <span className="text-sm text-muted-foreground">(Auto-loaded from {departments?.find((d) => d._id === departmentId)?.name ?? 'department'})</span>}</Label>
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
                No subjects found for {departments?.find((d) => d._id === departmentId)?.name ?? 'this department'}. Please add subjects in the Subjects section first.
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
              Create Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
