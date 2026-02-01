'use client';

import { JSX, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import type { SchoolStatus } from '@/types';
import { toast } from 'sonner';
import { CheckCircle,  Ban, Loader2, Trash2 } from 'lucide-react';
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
import { FileDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface School {
  _id: Id<'schools'>;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: SchoolStatus;
  adminId: string;
  adminName: string;
  studentCount: number;
  subscriptionPlan: string;
  monthlyFee: number;
  registrationDate: string;
  approvalDate?: string;
  paymentVerified: boolean;
  paymentDate?: string;
}

type ActionType = 'suspend' | 'delete' | 'bulk-suspend' | 'bulk-delete';

export default function SchoolsPage(): JSX.Element {
  const schools = useQuery(api.schools.list);
  const updateSchoolStatus = useMutation(api.schools.updateStatus);
  const suspendSchool = useMutation(api.schools.suspendSchool);
  const deleteSchool = useMutation(api.schools.deleteSchool);
  const bulkSuspend = useMutation(api.schools.bulkSuspend);
  const bulkDelete = useMutation(api.schools.bulkDelete);
  const createAuditLog = useMutation(api.auditLogs.create);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [showActionDialog, setShowActionDialog] = useState<boolean>(false);
  const [actionType, setActionType] = useState<ActionType>('suspend');
  const [targetSchool, setTargetSchool] = useState<School | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleApprove = async (id: Id<'schools'>): Promise<void> => {
    try {
      await updateSchoolStatus({
        id,
        status: 'active',
        approvalDate: new Date().toISOString(),
      });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Approved School',
        entity: 'School',
        entityId: id,
        details: 'School approved and activated',
        ipAddress: '192.168.1.1',
      });
      toast.success('School approved successfully');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to approve school');
    }
  };

  const openSuspendDialog = (school: School): void => {
    setTargetSchool(school);
    setActionType('suspend');
    setActionReason('');
    setShowActionDialog(true);
  };

  const openDeleteDialog = (school: School): void => {
    setTargetSchool(school);
    setActionType('delete');
    setActionReason('');
    setShowActionDialog(true);
  };

  const openBulkSuspendDialog = (): void => {
    setActionType('bulk-suspend');
    setActionReason('');
    setShowActionDialog(true);
  };

  const openBulkDeleteDialog = (): void => {
    setActionType('bulk-delete');
    setActionReason('');
    setShowActionDialog(true);
  };

  const handleActionConfirm = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      if (actionType === 'suspend' && targetSchool) {
        await suspendSchool({
          id: targetSchool._id,
          reason: actionReason || undefined,
        });
        await createAuditLog({
          userId: 'super_admin',
          userName: 'Super Admin',
          action: 'Suspended School',
          entity: 'School',
          entityId: targetSchool._id,
          details: actionReason || 'School suspended',
          ipAddress: '192.168.1.1',
        });
        toast.success('School suspended successfully');
      } else if (actionType === 'delete' && targetSchool) {
        await deleteSchool({
          id: targetSchool._id,
          reason: actionReason || undefined,
        });
        await createAuditLog({
          userId: 'super_admin',
          userName: 'Super Admin',
          action: 'Deleted School',
          entity: 'School',
          entityId: targetSchool._id,
          details: actionReason || 'School deleted',
          ipAddress: '192.168.1.1',
        });
        toast.success('School deleted successfully');
      } else if (actionType === 'bulk-suspend') {
        const ids = selectedSchools.map((s) => s._id);
        await bulkSuspend({
          ids,
          reason: actionReason || undefined,
        });
        toast.success(`${ids.length} school(s) suspended successfully`);
        setSelectedSchools([]);
      } else if (actionType === 'bulk-delete') {
        const ids = selectedSchools.map((s) => s._id);
        await bulkDelete({
          ids,
          reason: actionReason || undefined,
        });
        toast.success(`${ids.length} school(s) deleted successfully`);
        setSelectedSchools([]);
      }
      setShowActionDialog(false);
      setTargetSchool(null);
      setActionReason('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(`Failed to ${actionType === 'suspend' || actionType === 'bulk-suspend' ? 'suspend' : 'delete'} school(s)`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (
    status: SchoolStatus
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    const variants: Record<SchoolStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      active: 'default',
      pending_approval: 'secondary',
      pending_payment: 'outline',
      suspended: 'destructive',
    };
    return variants[status];
  };

  const columns: ColumnDef<School>[] = useMemo(
    () => [
      createSelectColumn<School>(),
      {
        accessorKey: 'name',
        header: ({ column }) => createSortableHeader(column, 'School Name'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'adminName',
        header: ({ column }) => createSortableHeader(column, 'Admin'),
      },
      {
        accessorKey: 'studentCount',
        header: ({ column }) => createSortableHeader(column, 'Students'),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => createSortableHeader(column, 'Status'),
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          return value === 'all' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'monthlyFee',
        header: ({ column }) => createSortableHeader(column, 'Monthly Fee'),
        cell: ({ row }) => `$${row.original.monthlyFee.toLocaleString()}`,
      },
      {
        accessorKey: 'registrationDate',
        header: ({ column }) => createSortableHeader(column, 'Registration Date'),
        cell: ({ row }) => new Date(row.original.registrationDate).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            {row.original.status === 'pending_approval' && row.original.paymentVerified && (
              <Button size="sm" onClick={() => handleApprove(row.original._id)} className="gap-1">
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            )}
            {row.original.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openSuspendDialog(row.original)}
                className="gap-1"
              >
                <Ban className="h-4 w-4" />
                Suspend
              </Button>
            )}
            {row.original.status !== 'pending_approval' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openDeleteDialog(row.original)}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleApprove]
  );

  const filteredData = useMemo(() => {
    if (!schools) return [];
    if (statusFilter === 'all') return schools;
    return schools.filter((school) => school.status === statusFilter);
  }, [schools, statusFilter]);

  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (filteredData) {
      if (format === 'json') {
        exportToJSON(filteredData, 'schools');
      } else if (format === 'csv') {
        exportToCSV(filteredData, 'schools');
      } else {
        exportToPDF(filteredData, 'schools', 'Schools Report');
      }
      toast.success(`Schools exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSelected = (selected: School[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'schools_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[], 'schools_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[],  'Selected Schools Report');
    }
    toast.success(`${selected.length} school(s) exported as ${format.toUpperCase()}`);
  };

  const getDialogContent = (): { title: string; description: string; actionLabel: string } => {
    if (actionType === 'suspend') {
      return {
        title: 'Suspend School',
        description: `Are you sure you want to suspend "${targetSchool?.name}"? This will:
        
• Block access to school management features
• Notify the school admin
• Preserve all data for reactivation

The school admin can reactivate by contacting support.`,
        actionLabel: 'Suspend School',
      };
    } else if (actionType === 'delete') {
      return {
        title: 'Delete School',
        description: `⚠️ WARNING: You are about to permanently delete "${targetSchool?.name}". This will:

• Remove the school record completely
• Cancel active subscriptions
• Notify the school admin
• Allow admin to create a new school

This action cannot be undone. All school data will be lost.`,
        actionLabel: 'Delete Permanently',
      };
    } else if (actionType === 'bulk-suspend') {
      return {
        title: `Suspend ${selectedSchools.length} Schools`,
        description: `Are you sure you want to suspend ${selectedSchools.length} school(s)? This will:

• Block access for all selected schools
• Send individual notifications to each admin
• Preserve all data for reactivation

Schools can be reactivated later.`,
        actionLabel: `Suspend ${selectedSchools.length} Schools`,
      };
    } else {
      return {
        title: `Delete ${selectedSchools.length} Schools`,
        description: `⚠️ WARNING: You are about to permanently delete ${selectedSchools.length} school(s). This will:

• Remove all school records completely
• Cancel all active subscriptions
• Send notifications to each admin
• Allow admins to create new schools

This action cannot be undone. All data will be lost.`,
        actionLabel: `Delete ${selectedSchools.length} Schools`,
      };
    }
  };

  if (!schools) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const dialogContent = getDialogContent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schools</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all registered schools</p>
        </div>
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
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedSchools.length > 0 && (
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm font-medium">
            {selectedSchools.length} school(s) selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openBulkSuspendDialog}
              className="gap-2"
            >
              <Ban className="h-4 w-4" />
              Suspend Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={openBulkDeleteDialog}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Schools ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredData}
            searchKey="name"
            searchPlaceholder="Search schools..."
            exportFormats={['json', 'csv', 'pdf']}
            onExport={handleExportSelected}
            onSelectionChange={setSelectedSchools}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Provide a reason for this action..."
              value={actionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={isProcessing}
              className={
                actionType === 'delete' || actionType === 'bulk-delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                dialogContent.actionLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
