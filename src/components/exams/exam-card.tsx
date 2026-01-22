'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExamStatusBadge } from './exam-status-badge';
import { Calendar, FileText, Edit, Trash2, Eye, Users, MoreVertical, ClipboardEdit } from 'lucide-react';
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
    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-blue-600">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg text-red-600 font-semibold">{exam.examName}</CardTitle>
            <CardDescription className="text-sm text-blue-600 font-medium">{exam.examCode}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExamStatusBadge status={exam.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(exam._id)} className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2 text-blue-600" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEnterMarks(exam._id)} className="cursor-pointer">
                  <ClipboardEdit className="h-4 w-4 mr-2 text-green-600" />
                  <span>Enter Marks</span>
                </DropdownMenuItem>
                {exam.status !== 'published' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(exam._id)} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2 text-amber-600" />
                      <span>Edit Exam</span>
                    </DropdownMenuItem>
                  </>
                )}
                {exam.status === 'draft' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(exam._id)} 
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span>Delete Exam</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded-md transition-colors">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Start:</span>
            <span className="font-semibold text-gray-400">{new Date(exam.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded-md transition-colors">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">End:</span>
            <span className="font-semibold text-gray-400">{new Date(exam.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm hover:bg-purple-50 p-2 rounded-md transition-colors">
          <FileText className="h-4 w-4 text-purple-500" />
          <span className="text-gray-600">Subjects:</span>
          <span className="font-semibold text-purple-700">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2 text-sm hover:bg-green-50 p-2 rounded-md transition-colors">
          <Users className="h-4 w-4 text-green-500" />
          <span className="text-gray-600">Weightage:</span>
          <span className="font-semibold text-green-700">{exam.weightage}%</span>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 italic">
            Type: <span className="font-medium text-gray-700">{exam.examType}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
