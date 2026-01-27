'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface GenerateReportCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export function GenerateReportCardsDialog({
  open,
  onOpenChange,
  schoolId,
}: GenerateReportCardsDialogProps) {
  const { toast } = useToast();
  const generateReportCards = useMutation(api.reportCards.generateReportCards);
  const exams = useQuery(api.exams.getExamsBySchool, { schoolId });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const students = useQuery(api.students.getStudentsBySchool, { schoolId });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Get class details and student count for selected class
  const selectedClass = classes?.find((cls) => cls.classCode === selectedClassId);
  const classStudents = students?.filter(
    (s) => s.classId === selectedClass?.classCode && s.status !== 'graduated'
  );
  const studentCount = classStudents?.length || 0;

  const handleGenerate = async (): Promise<void> => {
    if (!selectedExamId || !selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select both exam and class',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateReportCards({
        examId: selectedExamId as Id<'exams'>,
        classId: selectedClassId,
      });

      // Show success message with count
      toast({
        title: '✅ Report Cards Generated',
        description: `Successfully generated ${result.count} report card${result.count > 1 ? 's' : ''}${result.errors && result.errors.length > 0 ? ` (${result.errors.length} error${result.errors.length > 1 ? 's' : ''})` : ''}`,
      });

      // Show errors if any
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error: string) => {
          toast({
            title: '⚠️ Partial Error',
            description: error,
            variant: 'destructive',
          });
        });
      }

      onOpenChange(false);
      setSelectedExamId('');
      setSelectedClassId('');
    } catch (error) {
      toast({
        title: '❌ Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report cards',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Report Cards</DialogTitle>
          <DialogDescription>
            Select exam and class to generate report cards for all students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exam">Select Exam *</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger id="exam">
                <SelectValue placeholder="Choose exam" />
              </SelectTrigger>
              <SelectContent>
                {exams?.map((exam) => (
                  <SelectItem key={exam._id} value={exam._id}>
                    {exam.examName} - {exam.examType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Select Class *</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="class">
                <SelectValue placeholder="Choose class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => {
                  const classStudentCount = students?.filter(
                    (s) => s.classId === cls.classCode && s.status !== 'graduated'
                  ).length || 0;
                  return (
                    <SelectItem key={cls._id} value={cls.classCode}>
                      {cls.className} ({classStudentCount} student{classStudentCount !== 1 ? 's' : ''})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedClassId && (
              <p className="text-sm text-muted-foreground">
                📊 {studentCount} student{studentCount !== 1 ? 's' : ''} will receive report cards
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-1">📋 What will be generated:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Individual report cards for all students in the class</li>
              <li>Subject-wise marks and grades</li>
              <li>Overall percentage and position</li>
              <li>Attendance records</li>
              <li>Ready for class teacher comments</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FileText className="mr-2 h-4 w-4" />
            Generate Report Cards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
