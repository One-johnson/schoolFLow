'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Teacher } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeleteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher;
  teachers?: Teacher[];
  deletedBy: string;
  onDeleted: () => void;
}

export function DeleteTeacherDialog({
  open,
  onOpenChange,
  teacher,
  teachers,
  deletedBy,
  onDeleted,
}: DeleteTeacherDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  
  const deleteTeacher = useMutation(api.teachers.deleteTeacher);
  const deleteBulkTeachers = useMutation(api.teachers.deleteBulkTeachers);

  // Determine if this is bulk delete mode
  const isBulkMode = teachers && teachers.length > 0;
  const teachersToShow = isBulkMode ? teachers : (teacher ? [teacher] : []);

  // Initialize selected teachers when dialog opens in bulk mode
  useState(() => {
    if (isBulkMode && open) {
      setSelectedTeachers(new Set(teachers.map(t => t._id)));
    }
  });

  const toggleTeacher = (teacherId: string): void => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  const toggleAll = (): void => {
    if (selectedTeachers.size === teachersToShow.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(teachersToShow.map(t => t._id)));
    }
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);

    try {
      if (isBulkMode) {
        // Bulk delete
        if (selectedTeachers.size === 0) {
          toast.error('Please select at least one teacher to delete');
          setIsDeleting(false);
          return;
        }

        const teacherIds = Array.from(selectedTeachers) as Id<'teachers'>[];
        const result = await deleteBulkTeachers({
          teacherIds,
          deletedBy,
        });

        if (result.success > 0) {
          toast.success(
            `Successfully deleted ${result.success} teacher${result.success > 1 ? 's' : ''}!${
              result.failed > 0 ? ` ${result.failed} failed.` : ''
            }`
          );

          if (result.errors.length > 0) {
            console.error('Failed to delete teachers:', result.errors);
          }
        } else {
          toast.error('Failed to delete any teachers');
        }
      } else if (teacher) {
        // Single delete
        await deleteTeacher({
          teacherId: teacher._id as Id<'teachers'>,
          deletedBy,
        });

        toast.success(`Teacher ${teacher.firstName} ${teacher.lastName} deleted successfully`);
      }

      onDeleted();
      onOpenChange(false);
      setSelectedTeachers(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete teacher(s)');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = selectedTeachers.size;
  const allSelected = selectedCount === teachersToShow.length && teachersToShow.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={isBulkMode ? 'max-w-2xl' : ''}>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>
              {isBulkMode ? 'Delete Multiple Teachers' : 'Delete Teacher'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isBulkMode ? (
              <>
                Are you sure you want to delete the selected teachers? This action cannot be undone.
                All teacher information will be permanently removed from your school&apos;s records.
              </>
            ) : teacher ? (
              <>
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {teacher.firstName} {teacher.lastName}
                </span>{' '}
                (ID: {teacher.teacherId})?
                <br />
                <br />
                This action cannot be undone. All teacher information will be permanently
                removed from your school&apos;s records.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isBulkMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  id="select-all"
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {teachersToShow.length} selected
              </span>
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {teachersToShow.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedTeachers.has(t._id)}
                      onCheckedChange={() => toggleTeacher(t._id)}
                      id={t._id}
                    />
                    <label
                      htmlFor={t._id}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="font-medium">
                        {t.firstName} {t.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {t.teacherId} • {t.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.subjects.join(', ')}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedTeachers(new Set());
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || (isBulkMode && selectedCount === 0)}
          >
            {isDeleting
              ? 'Deleting...'
              : isBulkMode
              ? `Delete ${selectedCount} Teacher${selectedCount !== 1 ? 's' : ''}`
              : 'Delete Teacher'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}