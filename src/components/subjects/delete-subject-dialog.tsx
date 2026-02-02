'use client';

import { JSX, useState } from 'react';
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

interface Subject {
  _id: Id<'subjects'>;
  schoolId: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  category: 'core' | 'elective' | 'extracurricular';
  department: 'creche' | 'kindergarten' | 'primary' | 'junior_high';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface DeleteSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectData: Subject;
  deletedBy: string;
  onDeleted: () => void;
}

export function DeleteSubjectDialog({
  open,
  onOpenChange,
  subjectData,
  deletedBy,
  onDeleted,
}: DeleteSubjectDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteSubject = useMutation(api.subjects.deleteSubject);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteSubject({
        subjectId: subjectData._id,
        deletedBy,
      });
      toast.success('Subject deleted successfully');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Subject</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              Are you sure you want to delete <strong>{subjectData.subjectName}</strong> ({subjectData.subjectCode})?
            </span>
            <span className="block mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Subject'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
