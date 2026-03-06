'use client';

import { useState } from 'react';
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
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface DeleteFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structure: {
    _id: Id<'feeStructures'>;
    structureName: string;
    structureCode: string;
    totalAmount: number;
  } | null;
}

export function DeleteFeeStructureDialog({
  open,
  onOpenChange,
  structure,
}: DeleteFeeStructureDialogProps): React.JSX.Element | null {
  const [loading, setLoading] = useState<boolean>(false);
  const deleteStructure = useMutation(api.feeStructures.deleteFeeStructure);

  const handleDelete = async (): Promise<void> => {
    if (!structure) return;
    setLoading(true);
    try {
      await deleteStructure({ structureId: structure._id });
      toast.success('Fee structure deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete fee structure');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!structure) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the fee structure <strong>"{structure.structureName}"</strong> (Code: {structure.structureCode})?
            <span className="block mt-2 text-red-600 font-medium">This action cannot be undone.</span>
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
