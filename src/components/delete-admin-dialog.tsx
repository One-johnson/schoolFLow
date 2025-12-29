'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface SuperAdmin {
  _id: Id<'superAdmins'>;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator';
}

interface DeleteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: SuperAdmin;
}

export function DeleteAdminDialog({
  open,
  onOpenChange,
  admin,
}: DeleteAdminDialogProps): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(false);

  const removeAdmin = useMutation(api.superAdmins.remove);

  const handleDelete = async (): Promise<void> => {
    setLoading(true);

    try {
      await removeAdmin({ id: admin._id });

      toast.success('Admin deleted successfully', {
        description: `${admin.name} has been removed from the system`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete admin', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Delete Super Admin</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{admin.name}</strong>? This action cannot be undone.
            </p>
            <p className="text-sm">
              Email: <strong>{admin.email}</strong>
            </p>
            <p className="text-sm">
              Role: <strong>{admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}</strong>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Admin'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
