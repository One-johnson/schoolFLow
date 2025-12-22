"use client";

import type { Table } from "@tanstack/react-table";
import { X, Download, FileText, Upload, Trash2, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onBulkDelete?: () => void;
  onBulkEdit?: () => void;
  onBulkAdd?: () => void;
  onImportCSV?: () => void;
  customActions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  onExportCSV,
  onExportPDF,
  onBulkDelete,
  onBulkEdit,
  onBulkAdd,
  onImportCSV,
  customActions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {customActions}
        
        {selectedRows > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Bulk Actions ({selectedRows})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onBulkEdit && (
                <DropdownMenuItem onClick={onBulkEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Selected
                </DropdownMenuItem>
              )}
              {onBulkDelete && (
                <DropdownMenuItem onClick={onBulkDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onExportCSV && (
              <DropdownMenuItem onClick={onExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
            )}
            {onExportPDF && (
              <DropdownMenuItem onClick={onExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            )}
            {(onImportCSV || onBulkAdd) && <DropdownMenuSeparator />}
            {onImportCSV && (
              <DropdownMenuItem onClick={onImportCSV}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </DropdownMenuItem>
            )}
            {onBulkAdd && (
              <DropdownMenuItem onClick={onBulkAdd}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Add
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
