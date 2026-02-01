'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Id } from'../../../convex/_generated/dataModel';

interface BulkDeleteReportCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCardIds: Id<'reportCards'>[];
  onDeleteComplete: () => void;
  adminId: string;
}

export function BulkDeleteReportCardsDialog({
  open,
  onOpenChange,
  reportCardIds,
  onDeleteComplete,
  adminId,
}: BulkDeleteReportCardsDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const bulkDeleteReportCards = useMutation(api.reportCards.bulkDeleteReportCards);

  const handleDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      await bulkDeleteReportCards({ reportCardIds, deletedBy: adminId });
      toast({
        title: 'Success',
        description: `${reportCardIds.length} report card(s) deleted successfully`,
      });
      onDeleteComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete report cards',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Report Cards</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{reportCardIds.length}</strong> report card(s)?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete {reportCardIds.length} Report(s)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
