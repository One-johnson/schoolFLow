'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, FileDown, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JSX } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  additionalSearchKeys?: string[];
  onExportSelected?: (rows: TData[]) => void;
  onExportAll?: () => void;
  exportFormats?: ('json' | 'csv' | 'pdf')[];
  onExport?: (rows: TData[], format: 'json' | 'csv' | 'pdf') => void;
  onSelectionChange?: (rows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  additionalSearchKeys = [],
  onExportSelected,
  onExportAll,
  exportFormats = ['json', 'csv', 'pdf'],
  onExport,
  onSelectionChange,
}: DataTableProps<TData, TValue>): JSX.Element {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState<string>('');

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      // If additionalSearchKeys is provided, search across multiple fields
      if (searchKey && additionalSearchKeys.length > 0) {
        const searchKeys = [searchKey, ...additionalSearchKeys];
        const searchString = String(filterValue).toLowerCase().trim();
        
        return searchKeys.some((key) => {
          const value = row.getValue(key);
          const valueString = value ? String(value).toLowerCase().trim() : '';
          return valueString.includes(searchString);
        });
      }
      
      // Default behavior for single field search
      const value = row.getValue(columnId);
      const valueString = value ? String(value).toLowerCase().trim() : '';
      return valueString.includes(String(filterValue).toLowerCase().trim());
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const handleExportSelected = (format: 'json' | 'csv' | 'pdf'): void => {
    if (onExport) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onExport(selectedRows, format);
    } else if (onExportSelected) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onExportSelected(selectedRows);
    }
  };

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Notify parent component when selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={additionalSearchKeys.length > 0 ? globalFilter : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const value = event.target.value;
              if (additionalSearchKeys.length > 0) {
                setGlobalFilter(value);
              } else {
                table.getColumn(searchKey)?.setFilterValue(value);
              }
            }}
            className="max-w-sm"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedCount > 0 && onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export Selected ({selectedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {exportFormats.includes('json') && (
                <DropdownMenuItem onClick={() => handleExportSelected('json')}>
                  Export as JSON
                </DropdownMenuItem>
              )}
              {exportFormats.includes('csv') && (
                <DropdownMenuItem onClick={() => handleExportSelected('csv')}>
                  Export as CSV
                </DropdownMenuItem>
              )}
              {exportFormats.includes('pdf') && (
                <DropdownMenuItem onClick={() => handleExportSelected('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {selectedCount > 0 && onExportSelected && !onExport && (
          <Button variant="outline" onClick={() => onExportSelected(table.getFilteredSelectedRowModel().rows.map((row) => row.original))} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export Selected ({selectedCount})
          </Button>
        )}
        {onExportAll && (
          <Button variant="outline" onClick={onExportAll} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export All
          </Button>
        )}
      </div>
      <div className="rounded-md border dark:border-gray-800">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center gap-3 text-center py-12 animate-in fade-in-50 duration-500">
                    <div className="rounded-full bg-muted p-4 transition-all duration-300 hover:scale-110 hover:bg-muted/80">
                      <SearchX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold tracking-tight">No results found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Try adjusting your search or filter to find what you&apos;re looking for
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function createSortableHeader(column: unknown, label: string) {
  // eslint-disable-next-line react/display-name
  return ({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => string | boolean } }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent p-0"
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
}

export function createSelectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}
