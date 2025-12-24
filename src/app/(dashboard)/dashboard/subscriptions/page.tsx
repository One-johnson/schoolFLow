"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingUp, DollarSign, Users, Plus, Package, ArrowUpDown, MoreHorizontal, Search, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { StatsSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type SchoolSubscription = {
  _id: Id<"subscriptions">;
  schoolName: string;
  planName: string;
  planPrice: number;
  status: string;
  startDate: number;
  endDate: number;
  createdAt: number;
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const subscriptions = useQuery(api.subscriptions.getAllSubscriptions);
  const plans = useQuery(api.subscriptionPlans.getAllPlans);
  const paymentStats = useQuery(api.payments.getPaymentStats);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SchoolSubscription | null>(null);

  // Edit form state
  const [editPlanId, setEditPlanId] = useState<Id<"subscriptionPlans"> | "">("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editAutoRenew, setEditAutoRenew] = useState<boolean>(false);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      inactive: "bg-gray-500",
      expired: "bg-red-500",
      trialing: "bg-blue-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status.toUpperCase()}</Badge>;
  };

  const getPlanBadge = (planName: string) => {
    const colors: Record<string, string> = {
      "Free Plan": "bg-gray-500",
      "Basic Plan": "bg-blue-500",
      "Premium Plan": "bg-purple-500",
      "Enterprise Plan": "bg-amber-500",
    };
    return <Badge className={colors[planName] || "bg-gray-500"}>{planName}</Badge>;
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;
    
    try {
      await deleteSubscription({ subscriptionId: selectedSubscription._id });
      toast.success("Subscription deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
    } catch (error) {
      toast.error("Failed to delete subscription");
      console.error(error);
    }
  };

  const handleEditClick = (subscription: SchoolSubscription) => {
    setSelectedSubscription(subscription);
    setEditPlanId("" as Id<"subscriptionPlans">);
    setEditStatus(subscription.status);
    setEditStartDate(new Date(subscription.startDate).toISOString().split("T")[0]);
    setEditEndDate(new Date(subscription.endDate).toISOString().split("T")[0]);
    setEditNotes("");
    setEditAutoRenew(false);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedSubscription || !user) return;

    try {
      const updates: {
        subscriptionId: Id<"subscriptions">;
        planId?: Id<"subscriptionPlans">;
        status?: string;
        startDate?: number;
        endDate?: number;
        notes?: string;
        autoRenew?: boolean;
        updatedBy: Id<"users">;
      } = {
        subscriptionId: selectedSubscription._id,
        updatedBy: user.id,
      };

      if (editPlanId) updates.planId = editPlanId;
      if (editStatus) updates.status = editStatus;
      if (editStartDate) updates.startDate = new Date(editStartDate).getTime();
      if (editEndDate) updates.endDate = new Date(editEndDate).getTime();
      if (editNotes) updates.notes = editNotes;
      updates.autoRenew = editAutoRenew;

      await updateSubscription(updates);
      toast.success("Subscription updated successfully");
      setEditDialogOpen(false);
      setSelectedSubscription(null);
    } catch (error) {
      toast.error("Failed to update subscription");
      console.error(error);
    }
  };

  const columns: ColumnDef<SchoolSubscription>[] = [
    {
      accessorKey: "schoolName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent"
          >
            School Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("schoolName")}</div>,
    },
    {
      accessorKey: "planName",
      header: "Current Plan",
      cell: ({ row }) => getPlanBadge(row.getValue("planName")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "monthlyCost",
      header: "Monthly Cost",
      cell: ({ row }) => {
        const price = row.original.planPrice;
        return `GHS ${price.toLocaleString()}/mo`;
      },
    },
    {
      accessorKey: "endDate",
      header: "Expiry Date",
      cell: ({ row }) => new Date(row.getValue("endDate")).toLocaleDateString(),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => new Date(row.getValue("startDate")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const subscription = row.original;

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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleEditClick(subscription)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedSubscription(subscription);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: subscriptions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
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

  if (subscriptions === undefined || plans === undefined || paymentStats === undefined) {
    return <StatsSkeleton />;
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const expiringSoon = subscriptions.filter((s) => {
    const daysUntilExpiry = (s.endDate - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7 && s.status === "active";
  });

  // Calculate plan distribution
  const planDistribution: Record<string, number> = {};
  activeSubscriptions.forEach((sub) => {
    planDistribution[sub.planName] = (planDistribution[sub.planName] || 0) + 1;
  });

  // Calculate monthly recurring revenue from active subscriptions
  const totalMRR = activeSubscriptions.reduce((sum, sub) => sum + sub.planPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage school subscription plans and payments
          </p>
        </div>
        {user?.role === "super_admin" && (
          <div className="flex gap-2">
            <Link href="/dashboard/subscriptions/plans">
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Manage Plans
              </Button>
            </Link>
            <Link href="/dashboard/subscriptions/manage">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Manage Subscriptions
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {totalMRR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              MRR from active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">
              Expire within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {paymentStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Active subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(planDistribution).map(([planName, count]) => {
                const plan = plans.find((p) => p.displayName === planName);
                return (
                  <div key={planName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPlanBadge(planName)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        {plan ? `GHS ${(count * plan.price).toLocaleString()}/mo` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(planDistribution).length === 0 && (
                <p className="text-sm text-muted-foreground">No active subscriptions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Projected revenue from active subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  GHS {totalMRR.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  GHS {(totalMRR * 12).toLocaleString()}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Based on {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>School Subscriptions</CardTitle>
          <CardDescription>Detailed subscription information for all schools</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Table Toolbar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 max-w-sm"
                />
              </div>
            </div>
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
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription for{" "}
              <strong>{selectedSubscription?.schoolName}</strong>. This action cannot be undone.
              The school will be reset to the free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Edit subscription for <strong>{selectedSubscription?.schoolName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Subscription Plan</Label>
              <Select
                value={editPlanId}
                onValueChange={(value) => setEditPlanId(value as Id<"subscriptionPlans">)}
              >
                <SelectTrigger id="edit-plan">
                  <SelectValue placeholder={selectedSubscription?.planName || "Select a plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.displayName} - GHS {plan.price}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Leave unchanged to keep current plan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editStatus}
                onValueChange={setEditStatus}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-auto-renew"
                checked={editAutoRenew}
                onCheckedChange={setEditAutoRenew}
              />
              <Label htmlFor="edit-auto-renew" className="cursor-pointer">
                Enable Auto-Renewal
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any notes about this subscription..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
