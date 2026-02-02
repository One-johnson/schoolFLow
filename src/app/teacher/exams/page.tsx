'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Calendar, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { Id } from '../../../../convex/_generated/dataModel';

type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';

const statusColors: Record<ExamStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  published: 'bg-purple-100 text-purple-700',
};

export default function TeacherExamsPage() {
  const { teacher } = useTeacherAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const classId = teacher?.classIds?.[0];

  const exams = useQuery(
    api.exams.getExamsByClass,
    teacher && classId
      ? { schoolId: teacher.schoolId, classId }
      : 'skip'
  );

  const filteredExams = exams?.filter((exam) => {
    if (statusFilter === 'all') return true;
    return exam.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if marks entry is allowed (ongoing or completed exams)
  const canEnterMarks = (status: ExamStatus) => {
    return status === 'ongoing' || status === 'scheduled';
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!classId) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No class assigned to you</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contact your administrator to assign a class.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Exams</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exam Count */}
      {exams && (
        <p className="text-sm text-muted-foreground">
          {filteredExams?.length} exam{filteredExams?.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' && ` (${statusFilter})`}
        </p>
      )}

      {/* Exams List */}
      <div className="space-y-3">
        {!exams ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : filteredExams?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No exams found</p>
            {statusFilter !== 'all' && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          filteredExams?.map((exam) => (
            <Card key={exam._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{exam.examName}</h3>
                      <Badge
                        variant="secondary"
                        className={statusColors[exam.status as ExamStatus]}
                      >
                        {exam.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {exam.examCode}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {exam.examType?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        Total: {exam.totalMarks} marks
                      </span>
                    </div>
                  </div>
                  {canEnterMarks(exam.status as ExamStatus) ? (
                    <Link href={`/teacher/exams/${exam._id}/marks`}>
                      <Button size="sm" className="gap-1">
                        Enter Marks
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/teacher/exams/${exam._id}/view`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        View
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
