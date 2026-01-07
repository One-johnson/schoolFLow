'use client';

import { useState } from 'react';
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
import React from 'react';

interface AcademicYear {
  _id: Id<'academicYears'>;
  yearName: string;
  yearCode: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
}

interface BulkDeleteAcademicYearsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYears: AcademicYear[];
  deletedBy: string;
  onDeleted: () => void;
}

export function BulkDeleteAcademicYearsDialog({
  open,
  onOpenChange,
  academicYears,
  deletedBy,
  onDeleted,
}: BulkDeleteAcademicYearsDialogProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const bulkDeleteAcademicYears = useMutation(api.academicYears.bulkDeleteAcademicYears);

  const handleDelete = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const result = await bulkDeleteAcademicYears({
        yearIds: academicYears.map((year) => year._id),
        deletedBy,
      });

      if (result.successCount > 0) {
        toast.success(
          `Successfully deleted ${result.successCount} academic year${result.successCount > 1 ? 's' : ''}`
        );
      }

      if (result.failCount > 0) {
        toast.error(
          `Failed to delete ${result.failCount} academic year${result.failCount > 1 ? 's' : ''}. ${result.errors.join(', ')}`
        );
      }

      onDeleted();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete academic years');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group years by status
  const yearsByStatus = academicYears.reduce((acc, year) => {
    const status = year.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(year);
    return acc;
  }, {} as Record<string, AcademicYear[]>);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {academicYears.length} Academic Years</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the following academic years? This action cannot be undone.
            <br />
            <br />
            Academic years with associated terms cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[300px] overflow-y-auto border rounded-md p-4">
          {Object.entries(yearsByStatus).map(([status, years]) => (
            <div key={status} className="mb-4 last:mb-0">
              <h4 className="font-semibold text-sm mb-2 capitalize">{status} ({years.length})</h4>
              <ul className="list-disc list-inside space-y-1">
                {years.map((year) => (
                  <li key={year._id} className="text-sm text-muted-foreground">
                    {year.yearName} - {year.yearCode}
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
