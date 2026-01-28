'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
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
import { Calendar, FileText, Edit, Trash2, Eye, Users, MoreVertical, ClipboardEdit, RefreshCw } from 'lucide-react';
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
    department?: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  };
  onView: (examId: Id<'exams'>) => void;
  onEdit: (examId: Id<'exams'>) => void;
  onDelete: (examId: Id<'exams'>) => void;
  onEnterMarks: (examId: Id<'exams'>) => void;
  onViewMarks: (examId: Id<'exams'>) => void;
  onChangeStatus: (examId: Id<'exams'>) => void;
}

export function ExamCard({ exam, onView, onEdit, onDelete, onEnterMarks, onViewMarks, onChangeStatus }: ExamCardProps) {
  const subjects = exam.subjects ? JSON.parse(exam.subjects) : [];
  
  // Get marks statistics for this exam
  const marksStats = useQuery(api.marks.getExamMarksStats, { examId: exam._id });
  
  const formatDepartment = (dept?: string): string => {
    if (!dept) return 'N/A';
    return dept.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  // Calculate progress percentage
  const getMarksProgress = (): { percentage: number; text: string } => {
    if (!marksStats || marksStats.totalMarksEntries === 0) {
      return { percentage: 0, text: 'No marks entered' };
    }
    
    const totalEntries = marksStats.totalMarksEntries;
    const students = marksStats.uniqueStudents;
    const subjectsCount = subjects.length;
    const expectedEntries = students * subjectsCount;
    
    if (expectedEntries === 0) return { percentage: 0, text: 'No marks entered' };
    
    const percentage = Math.round((totalEntries / expectedEntries) * 100);
    return {
      percentage,
      text: `${students} student${students !== 1 ? 's' : ''} • ${totalEntries} entries`,
    };
  };
  
  const progress = getMarksProgress();

  return (
    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-gray-800 hover:border-l-black dark:border-l-gray-300 dark:hover:border-l-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg text-black dark:text-white font-semibold">{exam.examName}</CardTitle>
            <CardDescription className="text-sm text-black dark:text-gray-400 font-medium">{exam.examCode}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ExamStatusBadge status={exam.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-blue-600" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(exam._id)} className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-black dark:text-white">View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEnterMarks(exam._id)} className="cursor-pointer">
                  <ClipboardEdit className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-black dark:text-white">{marksStats && marksStats.totalMarksEntries > 0 ? 'Edit Marks' : 'Enter Marks'}</span>
                </DropdownMenuItem>
                {marksStats && marksStats.totalMarksEntries > 0 && (
                  <DropdownMenuItem onClick={() => onViewMarks(exam._id)} className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-black dark:text-white">View All Marks</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeStatus(exam._id)} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="text-black dark:text-white">Change Status</span>
                </DropdownMenuItem>
                {exam.status !== 'published' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(exam._id)} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2 text-yellow-600" />
                      <span className="text-black dark:text-white">Edit Exam</span>
                    </DropdownMenuItem>
                  </>
                )}
                {exam.status === 'draft' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(exam._id)} 
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
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
          <div className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-black dark:text-gray-300">Start:</span>
            <span className="font-semibold text-black dark:text-white">{new Date(exam.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-black dark:text-gray-300">End:</span>
            <span className="font-semibold text-black dark:text-white">{new Date(exam.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
          <FileText className="h-4 w-4 text-indigo-600" />
          <span className="text-black dark:text-gray-300">Subjects:</span>
          <span className="font-semibold text-black dark:text-white">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
          <Users className="h-4 w-4 text-cyan-600" />
          <span className="text-black dark:text-gray-300">Weightage:</span>
          <span className="font-semibold text-black dark:text-white">{exam.weightage}%</span>
        </div>

        {marksStats && marksStats.totalMarksEntries > 0 && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Marks Progress</span>
              <span className="font-semibold text-black dark:text-white">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress.text}</p>
          </div>
        )}

        <div className="pt-2 border-t grid grid-cols-2 gap-4">
          <div className="text-xs text-black dark:text-gray-400">
            <span className="font-medium text-black dark:text-gray-300">Type:</span> {exam.examType.replace('_', ' ')}
          </div>
          <div className="text-xs text-black dark:text-gray-400 text-right">
            <span className="font-medium text-black dark:text-gray-300">Department:</span> {formatDepartment(exam.department)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
