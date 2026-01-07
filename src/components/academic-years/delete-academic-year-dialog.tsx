'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AcademicYear {
  _id: Id<'academicYears'>;
  yearName: string;
  yearCode: string;
}

interface DeleteAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear;
  deletedBy: string;
  onDeleted: () => void;
}

export function DeleteAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
  deletedBy,
  onDeleted,
}: DeleteAcademicYearDialogProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const deleteAcademicYear = useMutation(api.academicYears.deleteAcademicYear);

  const handleDelete = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await deleteAcademicYear({
        yearId: academicYear._id,
        deletedBy,
      });

      toast.success('Academic year deleted successfully');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete academic year';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the academic year <strong>{academicYear.yearName}</strong> ({academicYear.yearCode})?
            <br />
            <br />
            This action cannot be undone. All associated terms must be deleted first before you can delete this academic year.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
