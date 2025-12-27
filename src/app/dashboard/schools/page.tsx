'use client';

import { JSX, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from  '../../../components/ui/data-table'
import type { SchoolStatus } from '@/types';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
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
import { useState } from 'react';

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

export default function SchoolsPage(): JSX.Element {
  const schools = useQuery(api.schools.list);
  const updateSchoolStatus = useMutation(api.schools.updateStatus);
  const createAuditLog = useMutation(api.auditLogs.create);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    } catch (error) {
      toast.error('Failed to approve school');
    }
  };

  const handleSuspend = async (id: Id<'schools'>): Promise<void> => {
    try {
      await updateSchoolStatus({ id, status: 'suspended' });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Suspended School',
        entity: 'School',
        entityId: id,
        details: 'School suspended',
        ipAddress: '192.168.1.1',
      });
      toast.success('School suspended');
    } catch (error) {
      toast.error('Failed to suspend school');
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
        header: createSortableHeader('School Name'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'adminName',
        header: createSortableHeader('Admin'),
      },
      {
        accessorKey: 'studentCount',
        header: createSortableHeader('Students'),
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
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
        header: createSortableHeader('Monthly Fee'),
        cell: ({ row }) => `$${row.original.monthlyFee.toLocaleString()}`,
      },
      {
        accessorKey: 'registrationDate',
        header: createSortableHeader('Registration Date'),
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
                variant="destructive"
                onClick={() => handleSuspend(row.original._id)}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Suspend
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
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
      exportToJSON(selected as unknown as Record<string, unknown>[], 'schools_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[], 'schools_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[], 'schools_selected', 'Selected Schools Report');
    }
    toast.success(`${selected.length} school(s) exported as ${format.toUpperCase()}`);
  };

  if (!schools) {
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
          <SelectTrigger className="w-[200px]">
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
