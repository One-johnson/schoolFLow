'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: 'owner' | 'admin' | 'moderator';
  createdBy: Id<'superAdmins'>;
}

export function AddAdminDialog({
  open,
  onOpenChange,
  currentUserRole,
  createdBy,
}: AddAdminDialogProps): React.JSX.Element {
  const [name, setName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [role, setRole] = React.useState<'admin' | 'moderator'>('admin');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/create-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          createdBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin');
      }

      toast.success('Admin created successfully', {
        description: `${name} has been added as a ${role}`,
      });

      setName('');
      setEmail('');
      setPassword('');
      setRole('admin');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create admin', {
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
        { value: 'moderator', label: 'Moderator', description: 'Limited access and permissions' },
      ];
    }

    return [];
  };

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogDescription>
            Create a new super administrator account with specific role and permissions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Minimum 8 characters
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as 'admin' | 'moderator')}
                  disabled={loading}
                >
                  <SelectTrigger id="role" className="pl-10">
                    <SelectValue placeholder="Select role" />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
