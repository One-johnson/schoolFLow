'use client';

import { useState, useMemo, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import { FileText, FileDown } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  _id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export default function AuditLogsPage(): React.JSX.Element {
  const logs = useQuery(api.auditLogs.list);
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      createSelectColumn<AuditLog>(),
      {
        accessorKey: 'timestamp',
        header: createSortableHeader('Timestamp'),
        cell: ({ row }) => (
          <span className="text-sm">{new Date(row.original.timestamp).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'userName',
        header: createSortableHeader('User'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.original.userId}</p>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: createSortableHeader('Action'),
        cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
      },
      {
        accessorKey: 'entity',
        header: createSortableHeader('Entity'),
        cell: ({ row }) => <Badge variant="secondary">{row.original.entity}</Badge>,
        filterFn: (row, id, value) => {
          return value === 'all' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
            {row.original.details}
          </p>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">{row.original.ipAddress}</span>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!logs) return [];
    if (entityFilter === 'all') return logs;
    return logs.filter((log) => log.entity === entityFilter);
  }, [logs, entityFilter]);

  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (filteredData) {
      if (format === 'json') {
        exportToJSON(filteredData, 'audit_logs');
      } else if (format === 'csv') {
        exportToCSV(filteredData, 'audit_logs');
      } else {
        exportToPDF(filteredData, 'audit_logs', 'Audit Logs Report');
      }
      toast.success(`Audit logs exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSelected = (selected: AuditLog[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'audit_logs_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[],  'audit_logs_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[],  'audit_logs_selected', 'Selected Audit Logs Report');
    }
    toast.success(`${selected.length} log(s) exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all platform activities for security and accountability
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={!logs}>
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
        <Select value={entityFilter} onValueChange={setEntityFilter} disabled={!logs}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="School">School</SelectItem>
            <SelectItem value="SchoolAdmin">School Admin</SelectItem>
            <SelectItem value="Subscription">Subscription</SelectItem>
            <SelectItem value="System">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Logs ({logs ? filteredData.length : '...'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              searchKey="action"
              searchPlaceholder="Search logs..."
              exportFormats={['json', 'csv', 'pdf']}
              onExport={handleExportSelected}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
