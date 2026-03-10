'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Calendar,
  Archive,
  Pencil,
  Paperclip,
  Users,
  Search,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import type { Id } from '../../../../convex/_generated/dataModel';
import { AddHomeworkDialog } from '../../../components/homework/add-homework-dialog';
import { EditHomeworkDialog } from '../../../components/homework/edit-homework-dialog';

export default function TeacherHomeworkPage() {
  const { teacher } = useTeacherAuth();
  const [classIdFilter, setClassIdFilter] = useState<string>('__all__');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Id<'homework'> | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<{ id: Id<'homework'>; title: string } | null>(null);

  const homework = useQuery(
    api.homework.getByTeacher,
    teacher
      ? {
          schoolId: teacher.schoolId,
          teacherId: teacher.id,
          teacherClassIds: teacher.classIds ?? [],
          classIdFilter: classIdFilter && classIdFilter !== '__all__' ? classIdFilter : undefined,
          statusFilter,
          searchQuery: searchQuery.trim() || undefined,
          sortOrder: sortOrder as 'newest' | 'due_asc' | 'due_desc',
        }
      : 'skip'
  );

  const archiveHomework = useMutation(api.homework.archive);

  const handleArchive = async () => {
    if (!archiveTarget || !teacher) return;
    try {
      await archiveHomework({ id: archiveTarget.id, teacherId: teacher.id });
      toast.success('Homework archived');
      setArchiveTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to archive');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7" />
            Homework
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage homework for your classes
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Homework
        </Button>
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
        <Select value={classIdFilter} onValueChange={setClassIdFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All classes</SelectItem>
            {(teacher.classIds ?? []).map((cid, i) => (
              <SelectItem key={cid} value={cid}>
                {teacher.classNames?.[i] ?? cid}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter ?? 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : (v as 'active' | 'archived'))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="due_asc">Due soonest</SelectItem>
            <SelectItem value="due_desc">Due latest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {homework === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : homework.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No homework yet.</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first homework
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {homework.map((hw) => (
            <Card key={hw._id} className={hw.status === 'archived' ? 'opacity-75' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base flex items-center gap-2 truncate">
                      {hw.title}
                      {hw.status === 'archived' && (
                        <Badge variant="secondary" className="shrink-0">Archived</Badge>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {hw.className}
                      </span>
                      {hw.subjectName && <span>{hw.subjectName}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Due {formatDate(hw.dueDate)}
                      </span>
                      {hw.attachmentStorageIds && hw.attachmentStorageIds.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3 shrink-0" />
                          {hw.attachmentStorageIds.length}
                        </span>
                      )}
                    </div>
                  </div>
                  {hw.status === 'active' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/homework/${hw._id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTarget(hw._id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setArchiveTarget({ id: hw._id, title: hw.title })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              {hw.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {hw.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <AddHomeworkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        teacher={teacher}
      />
      {editTarget && (
        <EditHomeworkDialog
          open={!!editTarget}
          onOpenChange={() => setEditTarget(null)}
          homeworkId={editTarget}
          teacher={teacher}
        />
      )}

      <AlertDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive homework?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{archiveTarget?.title}&quot; will be moved to archived. You can still view it but it won&apos;t appear in the active list for parents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
