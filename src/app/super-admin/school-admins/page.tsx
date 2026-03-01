'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from  '../../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Edit, 
  Eye, 
  Trash2, 
  FileDown, 
  Upload, 
  Users, 
  AlertCircle,
  MoreVertical,
  Key
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { Textarea } from '@/components/ui/textarea';
import { AdminPasswordResetDialog } from '@/components/admin-password-reset-dialog';

interface SchoolAdmin {
  _id: Id<'schoolAdmins'>;
  name: string;
  email: string;
  schoolId: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  invitedBy: string;
  createdAt: string;
}

// Generate alphanumeric school ID
function generateSchoolId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SCH';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function SchoolAdminsPage(): React.JSX.Element {
  const admins = useQuery(api.schoolAdmins.list);
  const createAdmin = useMutation(api.schoolAdmins.create);
  const bulkCreateAdmins = useMutation(api.schoolAdmins.bulkCreate);
  const updateAdmin = useMutation(api.schoolAdmins.update);
  const bulkUpdateAdmins = useMutation(api.schoolAdmins.bulkUpdate);
  const removeAdmin = useMutation(api.schoolAdmins.remove);
  const bulkDeleteAdmins = useMutation(api.schoolAdmins.bulkDelete);
  const updateAdminStatus = useMutation(api.schoolAdmins.updateStatus);
  const createAuditLog = useMutation(api.auditLogs.create);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);
  const [selectedAdmins, setSelectedAdmins] = useState<SchoolAdmin[]>([]);

  const [createForm, setCreateForm] = useState({ name: '', email: '' });
  const [bulkCreateText, setBulkCreateText] = useState('');
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<'active' | 'inactive' | 'pending' | 'suspended'>('active');
  const [editForm, setEditForm] = useState({ name: '', email: '', status: 'active' as 'active' | 'inactive' | 'pending' | 'suspended' });
  
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    schoolId: string;
    password: string;
  } | null>(null);

  const [bulkGeneratedCredentials, setBulkGeneratedCredentials] = useState<Array<{
    name: string;
    email: string;
    schoolId: string;
    password: string;
  }>>([]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'suspended'>('all');

  // Calculate stats
  const stats = useMemo(() => {
    if (!admins) return { total: 0, active: 0, pending: 0, inactive: 0, suspended: 0 };
    return {
      total: admins.length,
      active: admins.filter((a) => a.status === 'active').length,
      pending: admins.filter((a) => a.status === 'pending').length,
      inactive: admins.filter((a) => a.status === 'inactive').length,
      suspended: admins.filter((a) => a.status === 'suspended').length,
    };
  }, [admins]);

  // Filter admins based on status
  const filteredAdmins = useMemo(() => {
    if (!admins) return [];
    if (statusFilter === 'all') return admins;
    return admins.filter((admin) => admin.status === statusFilter);
  }, [admins, statusFilter]);

  // Single create - using API route to properly hash password
  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const schoolId = generateSchoolId();
    const password = schoolId;

    try {
      const response = await fetch('/api/auth/create-school-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          schoolId,
          tempPassword: password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to create school admin');
        return;
      }

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Created School Admin',
        entity: 'SchoolAdmin',
        entityId: createForm.email,
        details: `Created ${createForm.name} (${createForm.email}) with School ID: ${schoolId}`,
        ipAddress: '192.168.1.1',
      });

      setGeneratedCredentials({ schoolId, password });
      toast.success('School Admin created successfully!');
      setCreateForm({ name: '', email: '' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to create school admin');
    }
  };

  // Bulk create - using API route to properly hash passwords
  const handleBulkCreate = async (): Promise<void> => {
    if (!bulkCreateText.trim()) {
      toast.error('Please enter admin details');
      return;
    }

    const lines = bulkCreateText.trim().split('\n');
    const adminsToCreate: Array<{
      name: string;
      email: string;
      schoolId: string;
      tempPassword: string;
    }> = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const [name, email] = parts;
        const schoolId = generateSchoolId();
        const password = schoolId;
        adminsToCreate.push({ name, email, schoolId, tempPassword: password });
      }
    }

    if (adminsToCreate.length === 0) {
      toast.error('No valid admin entries found');
      return;
    }

    try {
      const response = await fetch('/api/auth/bulk-create-school-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admins: adminsToCreate }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to create school admins');
        return;
      }

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Bulk Created School Admins',
        entity: 'SchoolAdmin',
        entityId: 'bulk',
        details: `Created ${adminsToCreate.length} school admins`,
        ipAddress: '192.168.1.1',
      });

      setBulkGeneratedCredentials(data.admins);
      toast.success(`${adminsToCreate.length} School Admins created successfully!`);
      setBulkCreateText('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to create school admins');
    }
  };

  // CSV Import - using API route to properly hash passwords
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const adminsToCreate: Array<{
          name: string;
          email: string;
          schoolId: string;
          tempPassword: string;
        }> = [];

        for (const row of results.data as Array<Record<string, string>>) {
          if (row.name && row.email) {
            const schoolId = generateSchoolId();
            const password = schoolId;
            adminsToCreate.push({
              name: row.name,
              email: row.email,
              schoolId,
              tempPassword: password,
            });
          }
        }

        if (adminsToCreate.length === 0) {
          toast.error('No valid entries found in CSV');
          return;
        }

        try {
          const response = await fetch('/api/auth/bulk-create-school-admins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admins: adminsToCreate }),
          });

          const data = await response.json();

          if (!data.success) {
            toast.error(data.message || 'Failed to import school admins');
            return;
          }

          await createAuditLog({
            userId: 'super_admin',
            userName: 'Super Admin',
            action: 'Bulk Imported School Admins',
            entity: 'SchoolAdmin',
            entityId: 'bulk',
            details: `Imported ${adminsToCreate.length} school admins from CSV`,
            ipAddress: '192.168.1.1',
          });

          setBulkGeneratedCredentials(data.admins);
          setIsBulkCreateOpen(true);
          toast.success(`${adminsToCreate.length} School Admins imported successfully!`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error('Failed to import school admins');
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file');
      },
    });

    e.target.value = '';
  };

  // Bulk update
  const handleBulkUpdate = async (): Promise<void> => {
    if (selectedAdmins.length === 0) {
      toast.error('No admins selected');
      return;
    }

    try {
      await bulkUpdateAdmins({
        updates: selectedAdmins.map((admin) => ({
          id: admin._id,
          status: bulkUpdateStatus,
        })),
      });

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Bulk Updated School Admins',
        entity: 'SchoolAdmin',
        entityId: 'bulk',
        details: `Updated status to ${bulkUpdateStatus} for ${selectedAdmins.length} admins`,
        ipAddress: '192.168.1.1',
      });

      toast.success(`${selectedAdmins.length} admin(s) updated successfully`);
      setIsBulkUpdateOpen(false);
      setSelectedAdmins([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to update admins');
    }
  };

  // Bulk delete
  const handleBulkDelete = async (): Promise<void> => {
    if (selectedAdmins.length === 0) {
      toast.error('No admins selected');
      return;
    }

    try {
      await bulkDeleteAdmins({
        ids: selectedAdmins.map((admin) => admin._id),
      });

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Bulk Deleted School Admins',
        entity: 'SchoolAdmin',
        entityId: 'bulk',
        details: `Deleted ${selectedAdmins.length} school admins`,
        ipAddress: '192.168.1.1',
      });

      toast.success(`${selectedAdmins.length} admin(s) deleted successfully`);
      setIsBulkDeleteOpen(false);
      setSelectedAdmins([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to delete admins');
    }
  };

  // Single edit
  const handleEdit = async (): Promise<void> => {
    if (!selectedAdmin) return;

    try {
      await updateAdmin({
        id: selectedAdmin._id,
        name: editForm.name,
        email: editForm.email,
        status: editForm.status,
      });

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Updated School Admin',
        entity: 'SchoolAdmin',
        entityId: selectedAdmin.email,
        details: `Updated ${editForm.name} (${editForm.email})`,
        ipAddress: '192.168.1.1',
      });

      toast.success('School Admin updated successfully');
      setIsEditOpen(false);
      setSelectedAdmin(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to update admin');
    }
  };

  // Single delete
  const handleDelete = async (): Promise<void> => {
    if (!selectedAdmin) return;

    try {
      await removeAdmin({ id: selectedAdmin._id });

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Deleted School Admin',
        entity: 'SchoolAdmin',
        entityId: selectedAdmin.email,
        details: `Deleted ${selectedAdmin.name} (${selectedAdmin.email})`,
        ipAddress: '192.168.1.1',
      });

      toast.success('School Admin deleted successfully');
      setIsDeleteOpen(false);
      setSelectedAdmin(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  // Change status
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleChangeStatus = async (admin: SchoolAdmin, newStatus: 'active' | 'inactive' | 'pending' | 'suspended'): Promise<void> => {
    try {
      await updateAdminStatus({ id: admin._id, status: newStatus });

      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Changed School Admin Status',
        entity: 'SchoolAdmin',
        entityId: admin.email,
        details: `Changed status to ${newStatus} for ${admin.name}`,
        ipAddress: '192.168.1.1',
      });

      toast.success(`Status changed to ${newStatus}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to change status');
    }
  };

  const columns: ColumnDef<SchoolAdmin>[] = useMemo(
     
    () => [
      createSelectColumn<SchoolAdmin>(),
      {
        accessorKey: 'name',
        header: createSortableHeader('Name'),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: createSortableHeader('Email'),
      },
      {
        accessorKey: 'schoolId',
        header: createSortableHeader('School ID'),
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => {
          const status = row.original.status;
          const variants: Record<typeof status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
            active: 'default',
            pending: 'secondary',
            inactive: 'outline',
            suspended: 'destructive',
          };
          return <Badge variant={variants[status]}>{status}</Badge>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: createSortableHeader('Created Date'),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAdmin(row.original);
                  setIsViewOpen(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAdmin(row.original);
                  setEditForm({
                    name: row.original.name,
                    email: row.original.email,
                    status: row.original.status,
                  });
                  setIsEditOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleChangeStatus(row.original, 'active')}>
                Set as Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus(row.original, 'suspended')}>
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus(row.original, 'inactive')}>
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAdmin(row.original);
                  setIsResetPasswordOpen(true);
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setSelectedAdmin(row.original);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [handleChangeStatus]
  );

  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (admins) {
      if (format === 'json') {
        exportToJSON(admins, 'school_admins');
      } else if (format === 'csv') {
        exportToCSV(admins, 'school_admins');
      } else {
        exportToPDF(admins, 'school_admins', 'School Admins Report');
      }
      toast.success(`School Admins exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSelected = (selected: SchoolAdmin[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'school_admins_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[], 'school_admins_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[], 'school_admins_selected', 'Selected School Admins Report');
    }
    toast.success(`${selected.length} admin(s) exported as ${format.toUpperCase()}`);
  };

  if (!admins) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">School Admins</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage school administrator accounts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export All
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportAll('json')}>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll('csv')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll('pdf')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="gap-2" asChild>
            <label htmlFor="csv-upload">
              <Upload className="h-4 w-4" />
              Import CSV
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
            </label>
          </Button>

          <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Bulk Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Create School Admins</DialogTitle>
                <DialogDescription>
                  Enter admin details (one per line): Name, Email
                </DialogDescription>
              </DialogHeader>
              {bulkGeneratedCredentials.length === 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-create">Admin Details</Label>
                    <Textarea
                      id="bulk-create"
                      placeholder="John Doe, john@school.com&#10;Jane Smith, jane@school.com"
                      value={bulkCreateText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setBulkCreateText(e.target.value)
                      }
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      Format: Name, Email (one per line)
                    </p>
                  </div>
                  <Button onClick={handleBulkCreate} className="w-full">
                    Create All Admins
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                      {bulkGeneratedCredentials.length} School Admins Created Successfully!
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {bulkGeneratedCredentials.map((cred, index) => (
                        <div key={index} className="p-3 bg-white dark:bg-gray-900 rounded border">
                          <p className="font-medium text-sm">{cred.name}</p>
                          <p className="text-xs text-muted-foreground">{cred.email}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs">
                              <span className="font-semibold">School ID:</span>{' '}
                              <span className="font-mono">{cred.schoolId}</span>
                            </p>
                            <p className="text-xs">
                              <span className="font-semibold">Password:</span>{' '}
                              <span className="font-mono">{cred.password}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setIsBulkCreateOpen(false);
                      setBulkGeneratedCredentials([]);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create School Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create School Admin</DialogTitle>
                <DialogDescription>Create a new school administrator account</DialogDescription>
              </DialogHeader>
              {!generatedCredentials ? (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Admin
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                      School Admin Created Successfully!
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-green-700 dark:text-green-300">
                          School ID (Login Username)
                        </Label>
                        <p className="font-mono text-lg font-bold text-green-900 dark:text-green-100">
                          {generatedCredentials.schoolId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-green-700 dark:text-green-300">
                          Password (Same as School ID)
                        </Label>
                        <p className="font-mono text-lg font-bold text-green-900 dark:text-green-100">
                          {generatedCredentials.password}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                      Please save these credentials securely. The School Admin will use the School ID as
                      both username and password to login.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsCreateOpen(false);
                      setGeneratedCredentials(null);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Admins</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All administrators</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-600 dark:text-green-400">Active</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">Pending</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting activation</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">Inactive</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">Not currently active</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">Suspended</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground mt-1">Temporarily blocked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>All School Admins ({filteredAdmins.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">Filter by Status:</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive' | 'pending' | 'suspended') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            {selectedAdmins.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkUpdateOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Update ({selectedAdmins.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete ({selectedAdmins.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredAdmins}
            searchKey="name"
            searchPlaceholder="Search admins..."
            onExportSelected={(selected) => {
              setSelectedAdmins(selected);
            }}
            exportFormats={['json', 'csv', 'pdf']}
            onExport={handleExportSelected}
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>School Admin Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{selectedAdmin.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedAdmin.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">School ID</Label>
                <p className="font-mono font-medium">{selectedAdmin.schoolId}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedAdmin.status === 'active'
                        ? 'default'
                        : selectedAdmin.status === 'pending'
                        ? 'secondary'
                        : selectedAdmin.status === 'suspended'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {selectedAdmin.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="font-medium">{new Date(selectedAdmin.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Invited By</Label>
                <p className="font-medium">{selectedAdmin.invitedBy}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit School Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: 'active' | 'inactive' | 'pending' | 'suspended') =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the school admin account for{' '}
              <strong>{selectedAdmin?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedAdmins.length} selected admin(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select
                value={bulkUpdateStatus}
                onValueChange={(value: 'active' | 'inactive' | 'pending' | 'suspended') =>
                  setBulkUpdateStatus(value)
                }
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBulkUpdate} className="w-full">
              Update {selectedAdmins.length} Admin(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDialogTitle>Delete Multiple Admins</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedAdmins.length}</strong> school admin
              account(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete {selectedAdmins.length} Admin(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <AdminPasswordResetDialog
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
        adminId={selectedAdmin?._id || null}
        adminName={selectedAdmin?.name || ''}
        adminEmail={selectedAdmin?.email || ''}
        onSuccess={() => {
          // Refresh data or show success message
        }}
      />
    </div>
  );
}
