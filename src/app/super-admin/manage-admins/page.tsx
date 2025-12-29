'use client';

import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Shield, ShieldCheck, ShieldAlert, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { AddAdminDialog } from '../../../components/add-admin-dialog';
import { EditRoleDialog } from '../../../components/edit-admin-dialog';
import { DeleteAdminDialog } from'../../../components/delete-admin-dialog';
interface SuperAdmin {
  _id: Id<'superAdmins'>;
  _creationTime: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator';
  status: 'active' | 'suspended';
  createdAt: string;
  createdBy?: string;
  lastLogin?: string;
}

export default function ManageAdminsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = React.useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState<SuperAdmin | null>(null);
  const [showEditDialog, setShowEditDialog] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);

  // Queries
  const admins = useQuery(api.superAdmins.list);
  const stats = useQuery(api.superAdmins.getStats);
  const currentAdmin = useQuery(
    api.superAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  // Mutations
  const suspendAdmin = useMutation(api.superAdmins.suspend);
  const activateAdmin = useMutation(api.superAdmins.activate);

  const handleSuspend = async (adminId: Id<'superAdmins'>): Promise<void> => {
    try {
      await suspendAdmin({ id: adminId });
      toast.success('Admin suspended successfully');
    } catch (error) {
      toast.error('Failed to suspend admin', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleActivate = async (adminId: Id<'superAdmins'>): Promise<void> => {
    try {
      await activateAdmin({ id: adminId });
      toast.success('Admin activated successfully');
    } catch (error) {
      toast.error('Failed to activate admin', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getRoleBadge = (role: 'owner' | 'admin' | 'moderator'): React.JSX.Element => {
    const variants: Record<string, { icon: React.ElementType; variant: 'default' | 'secondary' | 'outline'; color: string }> = {
      owner: { icon: ShieldCheck, variant: 'default', color: 'bg-blue-600 hover:bg-blue-700' },
      admin: { icon: Shield, variant: 'secondary', color: 'bg-gray-600 hover:bg-gray-700' },
      moderator: { icon: ShieldAlert, variant: 'outline', color: 'border-gray-400' },
    };

    const config = variants[role] || variants.moderator;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: 'active' | 'suspended'): React.JSX.Element => {
    if (status === 'active') {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
    }
    return <Badge variant="destructive">Suspended</Badge>;
  };

  const canManageAdmin = (targetRole: 'owner' | 'admin' | 'moderator'): boolean => {
    if (!currentAdmin) return false;
    
    const roleHierarchy: Record<string, number> = { owner: 3, admin: 2, moderator: 1 };
    return roleHierarchy[currentAdmin.role] > roleHierarchy[targetRole];
  };

  const canModifyRole = (targetRole: 'owner' | 'admin' | 'moderator'): boolean => {
    if (!currentAdmin) return false;
    
    // Only owners can create/modify other owners
    if (targetRole === 'owner') {
      return currentAdmin.role === 'owner';
    }
    
    // Admins can manage moderators
    if (targetRole === 'moderator' && currentAdmin.role === 'admin') {
      return true;
    }
    
    return currentAdmin.role === 'owner';
  };

  if (!admins || !stats || !currentAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Admins</h1>
          <p className="text-gray-600 mt-1">
            Manage super administrator accounts and roles
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.active} active, {stats.suspended} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.owners}</div>
            <p className="text-xs text-gray-600 mt-1">Full system access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-gray-600 mt-1">Manage schools & users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderators</CardTitle>
            <ShieldAlert className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moderators}</div>
            <p className="text-xs text-gray-600 mt-1">Limited access</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Super Administrators</CardTitle>
          <CardDescription>
            A list of all super admin accounts with their roles and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>{getStatusBadge(admin.status)}</TableCell>
                    <TableCell>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {admin.lastLogin
                        ? new Date(admin.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {canModifyRole(admin.role) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setShowEditDialog(true);
                              }}
                            >
                              Edit Role
                            </DropdownMenuItem>
                          )}
                          {canManageAdmin(admin.role) && admin.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleSuspend(admin._id)}>
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {canManageAdmin(admin.role) && admin.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => handleActivate(admin._id)}>
                              Activate
                            </DropdownMenuItem>
                          )}
                          {canManageAdmin(admin.role) && admin._id !== currentAdmin._id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {admin._id === currentAdmin._id && (
                            <DropdownMenuItem disabled>
                              Cannot modify yourself
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddAdminDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        currentUserRole={currentAdmin.role}
        createdBy={currentAdmin._id}
      />

      {selectedAdmin && (
        <>
          <EditRoleDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            admin={selectedAdmin}
            currentUserRole={currentAdmin.role}
          />
          <DeleteAdminDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            admin={selectedAdmin}
          />
        </>
      )}
    </div>
  );
}
