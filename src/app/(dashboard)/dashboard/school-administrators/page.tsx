"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Shield, ArrowUpDown, MoreHorizontal, Eye, Mail, KeyRound, Building2, Activity, Clock, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { TablePageSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type SchoolAdmin = {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | undefined;
  photo: string | undefined;
  schoolId: Id<"schools">;
  schoolName: string;
  schoolStatus: string;
  role: string;
  status: string;
  lastLogin: number | undefined;
  createdAt: number;
};

export default function SchoolAdministratorsPage() {
  const admins = useQuery(api.platform.getSchoolAdmins);
  const [selectedAdmin, setSelectedAdmin] = useState<SchoolAdmin | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getSchoolStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      inactive: "bg-gray-500",
      suspended: "bg-red-500",
      trial: "bg-blue-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  const handleViewDetails = (admin: SchoolAdmin) => {
    setSelectedAdmin(admin);
    setIsDetailDialogOpen(true);
  };

  const handleSendWelcomeEmail = (admin: SchoolAdmin) => {
    // Placeholder for email functionality
    console.log("Sending welcome email to:", admin.email);
    toast.success(`Welcome email sent to ${admin.email}`);
  };

  const handleResetPassword = (admin: SchoolAdmin) => {
    // Placeholder for password reset
    console.log("Resetting password for:", admin.email);
    toast.success(`Password reset link sent to ${admin.email}`);
  };

  const columns: ColumnDef<SchoolAdmin>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Administrator
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const admin = row.original;
        const initials = `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={admin.photo} alt={`${admin.firstName} ${admin.lastName}`} />
              <AvatarFallback className="bg-blue-500 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{admin.firstName} {admin.lastName}</div>
              <div className="text-xs text-muted-foreground">{admin.email}</div>
            </div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const admin = row.original;
        const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase();
        const email = admin.email.toLowerCase();
        const searchValue = value.toLowerCase();
        return fullName.includes(searchValue) || email.includes(searchValue);
      },
    },
    {
      accessorKey: "schoolName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            School
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{admin.schoolName}</div>
              <div className="text-xs">{getSchoolStatusBadge(admin.schoolStatus)}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | undefined;
        return phone || <span className="text-muted-foreground text-xs">No phone</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "lastLogin",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Login
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLogin") as number | undefined;
        if (!lastLogin) {
          return <span className="text-muted-foreground text-xs">Never</span>;
        }
        const date = new Date(lastLogin);
        const now = Date.now();
        const diff = now - lastLogin;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return <span className="text-green-600 text-xs">Today</span>;
        if (days === 1) return <span className="text-xs">Yesterday</span>;
        if (days < 7) return <span className="text-xs">{days} days ago</span>;
        return <span className="text-xs">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(admin)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSendWelcomeEmail(admin)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Welcome Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(admin)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Initialize TanStack Table
  const table = useReactTable({
    data: admins || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const admin = row.original;
      const searchValue = filterValue.toLowerCase();
      return (
        `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(searchValue) ||
        admin.email.toLowerCase().includes(searchValue) ||
        admin.schoolName.toLowerCase().includes(searchValue) ||
        (admin.phone && admin.phone.toLowerCase().includes(searchValue))
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (admins === undefined) {
    return <TablePageSkeleton />;
  }

  // Calculate statistics
  const activeAdmins = admins.filter(a => a.status === "active").length;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentlyActive = admins.filter(a => a.lastLogin && a.lastLogin > thirtyDaysAgo).length;
  const neverLoggedIn = admins.filter(a => !a.lastLogin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">School Administrators</h1>
          <p className="text-muted-foreground mt-1">
            Manage school administrators across all schools
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
            <p className="text-xs text-muted-foreground">
              Managing all schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAdmins}</div>
            <p className="text-xs text-muted-foreground">
              {admins.length > 0 ? ((activeAdmins / admins.length) * 100).toFixed(0) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyActive}</div>
            <p className="text-xs text-muted-foreground">
              Logged in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Never Logged In</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{neverLoggedIn}</div>
            <p className="text-xs text-muted-foreground">
              Need activation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>School Administrators</CardTitle>
          <CardDescription>View and manage school administrators</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Table Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search administrators..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No administrators found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of{" "}
                {table.getFilteredRowModel().rows.length} results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Administrator Details</DialogTitle>
            <DialogDescription>
              Complete information about this school administrator
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAdmin.photo} alt={`${selectedAdmin.firstName} ${selectedAdmin.lastName}`} />
                  <AvatarFallback className="bg-blue-500 text-white text-lg">
                    {`${selectedAdmin.firstName[0]}${selectedAdmin.lastName[0]}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedAdmin.firstName} {selectedAdmin.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAdmin.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedAdmin.status)}
                    <Badge className="bg-blue-500">School Administrator</Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* School Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">School Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedAdmin.schoolName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      {getSchoolStatusBadge(selectedAdmin.schoolStatus)}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedAdmin.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedAdmin.phone || "Not provided"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">{new Date(selectedAdmin.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedAdmin.status)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last Login:</span>
                      <p className="font-medium">
                        {selectedAdmin.lastLogin 
                          ? new Date(selectedAdmin.lastLogin).toLocaleString()
                          : "Never logged in"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleSendWelcomeEmail(selectedAdmin)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Welcome Email
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleResetPassword(selectedAdmin)}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
