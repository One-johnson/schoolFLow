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

interface Term {
  _id: Id<'terms'>;
  termName: string;
  termCode: string;
  academicYearName: string;
}

interface DeleteTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term;
  deletedBy: string;
  onDeleted: () => void;
}

export function DeleteTermDialog({
  open,
  onOpenChange,
  term,
  deletedBy,
  onDeleted,
}: DeleteTermDialogProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const deleteTerm = useMutation(api.terms.deleteTerm);

  const handleDelete = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await deleteTerm({
        termId: term._id,
        deletedBy,
      });

      toast.success('Term deleted successfully');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete term';
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
          <AlertDialogTitle>Delete Term</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the term <strong>{term.termName}</strong> ({term.termCode}) from <strong>{term.academicYearName}</strong>?
            <br />
            <br />
            This action cannot be undone.
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
