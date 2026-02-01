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

interface DeleteReportCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCardId: Id<'reportCards'>;
  studentName: string;
  adminId: string;
}

export function DeleteReportCardDialog({
  open,
  onOpenChange,
  reportCardId,
  studentName,
  adminId,
}: DeleteReportCardDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const deleteReportCard = useMutation(api.reportCards.deleteReportCard);

  const handleDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      await deleteReportCard({ reportCardId, deletedBy: adminId });
      toast({
        title: 'Success',
        description: 'Report card deleted successfully',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete report card',
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
          <AlertDialogTitle>Delete Report Card</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the report card for <strong>{studentName}</strong>?
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
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
