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

interface House {
  _id: Id<'houses'>;
  name: string;
  code: string;
}

interface DeleteHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  house: House | null;
  deletedBy: string;
}

export function DeleteHouseDialog({
  open,
  onOpenChange,
  house,
  deletedBy,
}: DeleteHouseDialogProps): React.JSX.Element {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteHouse = useMutation(api.houses.deleteHouse);

  const handleDelete = async (): Promise<void> => {
    if (!house) return;

    setIsDeleting(true);
    try {
      await deleteHouse({ houseId: house._id, deletedBy });
      toast.success('House deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete house');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete House</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{house?.name}</strong> ({house?.code})?
            This action cannot be undone. Students and teachers assigned to this house will have their house cleared.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
