'use client';

import { useState, JSX } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
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

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    _id: Id<'feeCategories'>;
    categoryName: string;
  } | null;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: DeleteCategoryDialogProps): React.JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const deleteCategory = useMutation(api.feeCategories.deleteFeeCategory);

  const handleDelete = async (): Promise<void> => {
    if (!category) return;

    setLoading(true);
    try {
      await deleteCategory({ categoryId: category._id });
      toast.success('Fee category deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Fee Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the category <strong>"{category?.categoryName}"</strong>?
            This action cannot be undone and may affect existing payment records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
