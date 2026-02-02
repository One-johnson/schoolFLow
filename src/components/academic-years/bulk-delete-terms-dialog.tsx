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
  status: 'active' | 'upcoming' | 'completed';
}

interface BulkDeleteTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terms: Term[];
  deletedBy: string;
  onDeleted: () => void;
}

export function BulkDeleteTermsDialog({
  open,
  onOpenChange,
  terms,
  deletedBy,
  onDeleted,
}: BulkDeleteTermsDialogProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const bulkDeleteTerms = useMutation(api.terms.bulkDeleteTerms);

  const handleDelete = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const result = await bulkDeleteTerms({
        termIds: terms.map((term) => term._id),
        deletedBy,
      });

      if (result.successCount > 0) {
        toast.success(
          `Successfully deleted ${result.successCount} term${result.successCount > 1 ? 's' : ''}`
        );
      }

      if (result.failCount > 0) {
        toast.error(
          `Failed to delete ${result.failCount} term${result.failCount > 1 ? 's' : ''}. ${result.errors.join(', ')}`
        );
      }

      onDeleted();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete terms');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group terms by academic year
  const termsByYear = terms.reduce((acc, term) => {
    const year = term.academicYearName;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {terms.length} Terms</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the following terms? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[300px] overflow-y-auto border rounded-md p-4">
          {Object.entries(termsByYear).map(([year, yearTerms]) => (
            <div key={year} className="mb-4 last:mb-0">
              <h4 className="font-semibold text-sm mb-2">{year} ({yearTerms.length})</h4>
              <ul className="list-disc list-inside space-y-1">
                {yearTerms.map((term) => (
                  <li key={term._id} className="text-sm text-muted-foreground">
                    {term.termName} - {term.termCode}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
