'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExamStatusBadge } from './exam-status-badge';
import { Calendar, BookOpen, Award, FileText } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface ViewExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
}

export function ViewExamDialog({ open, onOpenChange, examId }: ViewExamDialogProps) {
  const exam = useQuery(api.exams.getExamById, { examId });

  if (!exam) {
    return null;
  }

  const subjects = exam.subjects ? JSON.parse(exam.subjects) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{exam.examName}</DialogTitle>
              <DialogDescription className="text-base mt-1">{exam.examCode}</DialogDescription>
            </div>
            <ExamStatusBadge status={exam.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Exam Type</p>
              <p className="font-medium capitalize">{exam.examType.replace('_', ' ')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium capitalize">{exam.department || 'N/A'}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(exam.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{new Date(exam.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Weightage */}
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Weightage</p>
              <p className="font-medium">{exam.weightage}%</p>
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Subjects ({subjects.length})</h3>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Subject Name</th>
                    <th className="text-left p-3 font-medium">Maximum Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject: { name: string; maxMarks: number }, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{subject.name}</td>
                      <td className="p-3">{subject.maxMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          {exam.instructions && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Instructions</h3>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{exam.instructions}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>Created: {new Date(exam.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(exam.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
