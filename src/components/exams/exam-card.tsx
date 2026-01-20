'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExamStatusBadge } from './exam-status-badge';
import { Calendar, FileText, Edit, Trash2, Eye, Users } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface ExamCardProps {
  exam: {
    _id: Id<'exams'>;
    examCode: string;
    examName: string;
    examType: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';
    weightage: number;
    subjects?: string;
  };
  onView: (examId: Id<'exams'>) => void;
  onEdit: (examId: Id<'exams'>) => void;
  onDelete: (examId: Id<'exams'>) => void;
  onEnterMarks: (examId: Id<'exams'>) => void;
}

export function ExamCard({ exam, onView, onEdit, onDelete, onEnterMarks }: ExamCardProps) {
  const subjects = exam.subjects ? JSON.parse(exam.subjects) : [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{exam.examName}</CardTitle>
            <CardDescription className="text-sm">{exam.examCode}</CardDescription>
          </div>
          <ExamStatusBadge status={exam.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span className="font-medium">{new Date(exam.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">End:</span>
            <span className="font-medium">{new Date(exam.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Subjects:</span>
          <span className="font-medium">{subjects.length}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Weightage:</span>
          <span className="font-medium">{exam.weightage}%</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onView(exam._id)} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {exam.status !== 'published' && (
            <Button variant="outline" size="sm" onClick={() => onEdit(exam._id)} className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          <Button variant="default" size="sm" onClick={() => onEnterMarks(exam._id)} className="flex-1">
            <FileText className="h-4 w-4 mr-1" />
            Marks
          </Button>
          {exam.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={() => onDelete(exam._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
