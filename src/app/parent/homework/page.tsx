'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Calendar, Paperclip, Upload, CheckCircle } from 'lucide-react';
import { SubmitHomeworkDialog } from '../../../components/homework/submit-homework-dialog';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function ParentHomeworkPage() {
  const { parent } = useParentAuth();
  const [subjectIdFilter, setSubjectIdFilter] = useState<string>('__all__');
  const [submitTarget, setSubmitTarget] = useState<{
    homeworkId: Id<'homework'>;
    homeworkTitle: string;
    studentId: string;
    studentName: string;
    className: string;
  } | null>(null);

  const studentClassIds = parent?.students?.map((s) => s.classId) ?? [];

  const homework = useQuery(
    api.homework.getForParent,
    parent && studentClassIds.length > 0
      ? {
          schoolId: parent.schoolId,
          studentClassIds,
          subjectIdFilter: subjectIdFilter && subjectIdFilter !== '__all__' ? subjectIdFilter : undefined,
        }
      : 'skip'
  );

  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    parent?.schoolId ? { schoolId: parent.schoolId } : 'skip'
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          Homework
        </h1>
        <p className="text-muted-foreground mt-1">
          View and submit homework for your children
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={subjectIdFilter} onValueChange={setSubjectIdFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All subjects</SelectItem>
            {subjects?.filter((s) => s.status === 'active').map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {homework === undefined ? (
        <Skeleton className="h-32 w-full" />
      ) : homework.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No homework at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {homework.map((hw) => (
            <HomeworkCard
              key={hw._id}
              homework={hw}
              parent={parent}
              formatDate={formatDate}
              isOverdue={isOverdue}
              onSubmit={(studentId, studentName, className) =>
                setSubmitTarget({
                  homeworkId: hw._id,
                  homeworkTitle: hw.title,
                  studentId,
                  studentName,
                  className,
                })
              }
            />
          ))}
        </div>
      )}

      {submitTarget && (
        <SubmitHomeworkDialog
          open={!!submitTarget}
          onOpenChange={() => setSubmitTarget(null)}
          homeworkId={submitTarget.homeworkId}
          homeworkTitle={submitTarget.homeworkTitle}
          studentId={submitTarget.studentId}
          studentName={submitTarget.studentName}
          schoolId={parent.schoolId}
          parentId={parent.id}
          parentName={parent.name ?? 'Parent'}
          onSuccess={() => setSubmitTarget(null)}
        />
      )}
    </div>
  );
}

function HomeworkCard({
  homework,
  parent,
  formatDate,
  isOverdue,
  onSubmit,
}: {
  homework: {
    _id: Id<'homework'>;
    title: string;
    description?: string;
    dueDate: string;
    className: string;
    subjectName?: string;
    teacherName: string;
    attachmentStorageIds?: string[];
  };
  parent: { students?: { id: string; firstName: string; lastName: string; classId: string; className: string }[] };
  formatDate: (d: string) => string;
  isOverdue: (d: string) => boolean;
  onSubmit: (studentId: string, studentName: string, className: string) => void;
}) {
  const studentsInClass = homework.className
    ? parent.students?.filter((s) => s.className === homework.className) ?? []
    : parent.students ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{homework.title}</CardTitle>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span>{homework.className}</span>
              {homework.subjectName && <span>{homework.subjectName}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3" />
                Due {formatDate(homework.dueDate)}
                {isOverdue(homework.dueDate) && (
                  <Badge variant="destructive" className="ml-1 text-xs">Overdue</Badge>
                )}
              </span>
              {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3" />
                  {homework.attachmentStorageIds.length} attachment(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {homework.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {homework.description}
          </p>
        </CardContent>
      )}
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm font-medium">Submit for your child:</p>
          {studentsInClass.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None of your children are in this class.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {studentsInClass.map((student) => (
                <HomeworkStudentSubmit
                  key={student.id}
                  homeworkId={homework._id}
                  student={student}
                  onSubmit={onSubmit}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HomeworkStudentSubmit({
  homeworkId,
  student,
  onSubmit,
}: {
  homeworkId: Id<'homework'>;
  student: { id: string; firstName: string; lastName: string; className: string };
  onSubmit: (studentId: string, studentName: string, className: string) => void;
}) {
  const submission = useQuery(api.homework.getSubmissionByHomeworkAndStudent, {
    homeworkId,
    studentId: student.id,
  });
  const submitted = submission?.status === 'submitted' || submission?.status === 'marked';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {student.firstName} {student.lastName}
      </span>
      {submitted ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {submission?.status === 'marked' && submission.grade
            ? `Marked: ${submission.grade}`
            : 'Submitted'}
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onSubmit(
              student.id,
              `${student.firstName} ${student.lastName}`,
              student.className
            )
          }
        >
          <Upload className="h-4 w-4 mr-1" />
          Submit
        </Button>
      )}
    </div>
  );
}
