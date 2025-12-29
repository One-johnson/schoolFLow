'use client';

import * as React from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SuperAdmin {
  _id: Id<'superAdmins'>;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator';
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: SuperAdmin;
  currentUserRole: 'owner' | 'admin' | 'moderator';
}

export function EditRoleDialog({
  open,
  onOpenChange,
  admin,
  currentUserRole,
}: EditRoleDialogProps): React.JSX.Element {
  const [selectedRole, setSelectedRole] = React.useState<'owner' | 'admin' | 'moderator'>(admin.role);
  const [loading, setLoading] = React.useState<boolean>(false);

  const updateRole = useMutation(api.superAdmins.updateRole);

  React.useEffect(() => {
    setSelectedRole(admin.role);
  }, [admin.role]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (selectedRole === admin.role) {
      toast.error('Please select a different role');
      return;
    }

    setLoading(true);

    try {
      await updateRole({
        id: admin._id,
        role: selectedRole,
      });

      toast.success('Role updated successfully', {
        description: `${admin.name} is now a ${selectedRole}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update role', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = (): Array<{ value: 'owner' | 'admin' | 'moderator'; label: string; description: string }> => {
    if (currentUserRole === 'owner') {
      return [
        { value: 'owner', label: 'Owner', description: 'Full system access and control' },
        { value: 'admin', label: 'Admin', description: 'Manage schools and users' },
        { value: 'moderator', label: 'Moderator', description: 'Limited access and permissions' },
      ];
    }
    
    if (currentUserRole === 'admin') {
      return [
        { value: 'admin', label: 'Admin', description: 'Manage schools and users' },
        { value: 'moderator', label: 'Moderator', description: 'Limited access and permissions' },
      ];
    }

    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Admin Role</DialogTitle>
          <DialogDescription>
            Change the role and permissions for {admin.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Role</Label>
              <div className="text-sm text-gray-600">
                {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as 'owner' | 'admin' | 'moderator')}
                disabled={loading}
              >
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{roleOption.label}</span>
                        <span className="text-xs text-gray-600">
                          {roleOption.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedRole === admin.role}>
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
