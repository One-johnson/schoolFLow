'use client';

import { useState, useMemo, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Edit, Ban, FileDown } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';

interface SchoolAdmin {
  _id: Id<'schoolAdmins'>;
  name: string;
  email: string;
  schoolId: string;
  status: 'active' | 'inactive' | 'pending';
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

export default function SchoolAdminsPage(): JSX.Element {
  const admins = useQuery(api.schoolAdmins.list);
  const createAdmin = useMutation(api.schoolAdmins.create);
  const updateAdminStatus = useMutation(api.schoolAdmins.updateStatus);
  const createAuditLog = useMutation(api.auditLogs.create);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '' });
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    schoolId: string;
    password: string;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const schoolId = generateSchoolId();
    const password = schoolId; // School ID is the password

    try {
      await createAdmin({
        ...createForm,
        schoolId,
        status: 'pending',
        invitedBy: 'super_admin',
        tempPassword: password,
      });
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
    } catch (error) {
      toast.error('Failed to create school admin');
    }
  };

  const handleCloseDialog = (): void => {
    setIsCreateOpen(false);
    setGeneratedCredentials(null);
  };

  const handleDeactivate = async (id: Id<'schoolAdmins'>): Promise<void> => {
    try {
      await updateAdminStatus({ id, status: 'inactive' });
      toast.success('School Admin deactivated');
    } catch (error) {
      toast.error('Failed to deactivate admin');
    }
  };

  const handleActivate = async (id: Id<'schoolAdmins'>): Promise<void> => {
    try {
      await updateAdminStatus({ id, status: 'active' });
      toast.success('School Admin activated');
    } catch (error) {
      toast.error('Failed to activate admin');
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
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'active'
                ? 'default'
                : row.original.status === 'pending'
                ? 'secondary'
                : 'outline'
            }
          >
            {row.original.status}
          </Badge>
        ),
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            {row.original.status === 'active' ? (
              <Button variant="outline" size="sm" onClick={() => handleDeactivate(row.original._id)}>
                <Ban className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleActivate(row.original._id)}>
                Activate
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
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
        <div className="flex items-center gap-2">
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
                        <Label className="text-xs text-green-700 dark:text-green-300">School ID (Login Username)</Label>
                        <p className="font-mono text-lg font-bold text-green-900 dark:text-green-100">
                          {generatedCredentials.schoolId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-green-700 dark:text-green-300">Password (Same as School ID)</Label>
                        <p className="font-mono text-lg font-bold text-green-900 dark:text-green-100">
                          {generatedCredentials.password}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-3">
                      Please save these credentials securely. The School Admin will use the School ID as both username and password to login.
                    </p>
                  </div>
                  <Button onClick={handleCloseDialog} className="w-full">
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All School Admins ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={admins}
            searchKey="name"
            searchPlaceholder="Search admins..."
            onExportSelected={(selected) => {
              // This will be handled by the DataTable component's export buttons
            }}
            exportFormats={['json', 'csv', 'pdf']}
            onExport={handleExportSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
