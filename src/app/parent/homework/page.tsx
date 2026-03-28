'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, Calendar, Paperclip, CheckCircle, Search, FileDown, MoreVertical } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function ParentHomeworkPage() {
  const { parent } = useParentAuth();
  const [subjectIdFilter, setSubjectIdFilter] = useState<string>('__all__');
  const [classNameFilter, setClassNameFilter] = useState<string>('__all__');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('due_asc');

  const studentClassIds = parent?.students?.map((s) => s.classId) ?? [];

  const homework = useQuery(
    api.homework.getForParent,
    parent && studentClassIds.length > 0
      ? {
          schoolId: parent.schoolId,
          studentClassIds,
          subjectIdFilter: subjectIdFilter && subjectIdFilter !== '__all__' ? subjectIdFilter : undefined,
          classNameFilter: classNameFilter && classNameFilter !== '__all__' ? classNameFilter : undefined,
          searchQuery: searchQuery.trim() || undefined,
          sortOrder: sortOrder as 'due_asc' | 'due_desc' | 'newest',
        }
      : 'skip'
  );

  const uniqueClassNames = Array.from(
    new Set(parent?.students?.map((s) => s.className).filter(Boolean) ?? [])
  ).sort();

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
          View assignments for your children. Students submit work from their student portal.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search homework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={subjectIdFilter} onValueChange={setSubjectIdFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Subject" />
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
        <Select value={classNameFilter} onValueChange={setClassNameFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All classes</SelectItem>
            {uniqueClassNames.map((cn) => (
              <SelectItem key={cn} value={cn}>
                {cn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_asc">Due soonest</SelectItem>
            <SelectItem value="due_desc">Due latest</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {homework.map((hw) => (
            <HomeworkCard
              key={hw._id}
              homework={hw}
              parent={parent}
              formatDate={formatDate}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeworkCard({
  homework,
  parent,
  formatDate,
  isOverdue,
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
}) {
  const studentsInClass = homework.className
    ? parent.students?.filter((s) => s.className === homework.className) ?? []
    : parent.students ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate">{homework.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              <span>{homework.className}</span>
              {homework.subjectName && <span>{homework.subjectName}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Due {formatDate(homework.dueDate)}
                {isOverdue(homework.dueDate) && (
                  <Badge variant="destructive" className="ml-1 text-xs">Overdue</Badge>
                )}
              </span>
              {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3 shrink-0" />
                  {homework.attachmentStorageIds.length} attachment(s)
                </span>
              )}
            </div>
          </div>
          {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {homework.attachmentStorageIds.map((sid, i) => (
                  <HomeworkAttachmentDropdownItem key={sid} storageId={sid} label={`Download ${i + 1}`} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
          <p className="text-sm font-medium">Submission status</p>
          {studentsInClass.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None of your children are in this class.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {studentsInClass.map((student) => (
                <HomeworkStudentStatus
                  key={student.id}
                  homeworkId={homework._id}
                  student={student}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HomeworkAttachmentDropdownItem({ storageId, label }: { storageId: string; label: string }) {
  const url = useQuery(api.photos.getFileUrl, { storageId });
  if (!url) return null;
  return (
    <DropdownMenuItem asChild>
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center">
        <FileDown className="h-4 w-4 mr-2" />
        {label}
      </a>
    </DropdownMenuItem>
  );
}

function HomeworkStudentStatus({
  homeworkId,
  student,
}: {
  homeworkId: Id<'homework'>;
  student: { id: string; firstName: string; lastName: string; className: string };
}) {
  const submission = useQuery(api.homework.getSubmissionByHomeworkAndStudent, {
    homeworkId,
    studentId: student.id,
  });
  const submitted = submission?.status === 'submitted' || submission?.status === 'marked';

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>
        {student.firstName} {student.lastName}
      </span>
      {submitted ? (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <CheckCircle className="h-3 w-3" />
          {submission?.status === 'marked' && submission.grade
            ? `Marked: ${submission.grade}`
            : 'Submitted'}
        </Badge>
      ) : (
        <span className="text-muted-foreground">Not submitted yet</span>
      )}
    </div>
  );
}
