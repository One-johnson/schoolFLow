"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, TrendingUp, DollarSign, Users, Plus, Package, ArrowUpDown, MoreHorizontal, Search, ChevronDown, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CalendarIcon, X, TrendingDown, CheckCircle2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  autoRenew?: boolean;
  notes?: string;
};

type StatusFilter = "all" | "active" | "inactive" | "expired" | "trialing";

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
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDateFrom, setStartDateFrom] = useState<Date | undefined>();
  const [startDateTo, setStartDateTo] = useState<Date | undefined>();
  const [endDateFrom, setEndDateFrom] = useState<Date | undefined>();
  const [endDateTo, setEndDateTo] = useState<Date | undefined>();
  
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

  // Filter subscriptions based on status and date ranges
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    return subscriptions.filter((sub) => {
      // Status filter
      if (statusFilter !== "all" && sub.status !== statusFilter) {
        return false;
      }

      // Start date filter
      if (startDateFrom && sub.startDate < startDateFrom.getTime()) {
        return false;
      }
      if (startDateTo && sub.startDate > startDateTo.getTime()) {
        return false;
      }

      // End date filter
      if (endDateFrom && sub.endDate < endDateFrom.getTime()) {
        return false;
      }
      if (endDateTo && sub.endDate > endDateTo.getTime()) {
        return false;
      }

      return true;
    });
  }, [subscriptions, statusFilter, startDateFrom, startDateTo, endDateFrom, endDateTo]);

  const getDaysUntilExpiry = (endDate: number) => {
    return Math.floor((endDate - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const isExpiringSoon = (subscription: SchoolSubscription) => {
    const daysLeft = getDaysUntilExpiry(subscription.endDate);
    return daysLeft > 0 && daysLeft <= 7 && subscription.status === "active";
  };

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
    setEditNotes(subscription.notes || "");
    setEditAutoRenew(subscription.autoRenew || false);
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

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDateFrom(undefined);
    setStartDateTo(undefined);
    setEndDateFrom(undefined);
    setEndDateTo(undefined);
    setGlobalFilter("");
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
      cell: ({ row }) => {
        const subscription = row.original;
        const daysLeft = getDaysUntilExpiry(subscription.endDate);
        const expiringSoon = isExpiringSoon(subscription);

        return (
          <div className="flex items-center gap-2">
            <span>{new Date(row.getValue("endDate")).toLocaleDateString()}</span>
            {expiringSoon && (
              <Badge variant="outline" className="text-orange-500 border-orange-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {daysLeft}d left
              </Badge>
            )}
          </div>
        );
      },
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
    data: filteredSubscriptions || [],
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

  // Calculate churn and renewal metrics
  const expiredLastMonth = subscriptions.filter((s) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return s.status === "expired" && s.endDate >= thirtyDaysAgo && s.endDate <= Date.now();
  }).length;

  const totalLastMonth = subscriptions.filter((s) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return s.startDate <= thirtyDaysAgo;
  }).length;

  const churnRate = totalLastMonth > 0 ? ((expiredLastMonth / totalLastMonth) * 100).toFixed(1) : "0";
  const renewalRate = totalLastMonth > 0 ? (((totalLastMonth - expiredLastMonth) / totalLastMonth) * 100).toFixed(1) : "100";

  const hasActiveFilters = statusFilter !== "all" || startDateFrom || startDateTo || endDateFrom || endDateTo || globalFilter;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">
              Expire within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{renewalRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Active subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(planDistribution).map(([planName, count]) => {
                const plan = plans.find((p) => p.displayName === planName);
                const percentage = ((count / activeSubscriptions.length) * 100).toFixed(0);
                return (
                  <div key={planName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPlanBadge(planName)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                    {plan && (
                      <p className="text-xs text-muted-foreground">
                        Revenue: GHS {(count * plan.price).toLocaleString()}/mo
                      </p>
                    )}
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

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Last 30 days overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Renewal Rate</p>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">{renewalRate}%</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">{churnRate}%</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Total Revenue: GHS {paymentStats.totalRevenue.toLocaleString()}
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
          {/* Status Filter Buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({subscriptions.length})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className={statusFilter === "active" ? "" : "text-green-600"}
              >
                Active ({subscriptions.filter(s => s.status === "active").length})
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
                className={statusFilter === "expired" ? "" : "text-red-600"}
              >
                Expired ({subscriptions.filter(s => s.status === "expired").length})
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className={statusFilter === "inactive" ? "" : "text-gray-600"}
              >
                Inactive ({subscriptions.filter(s => s.status === "inactive").length})
              </Button>
              <Button
                variant={statusFilter === "trialing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("trialing")}
                className={statusFilter === "trialing" ? "" : "text-blue-600"}
              >
                Trialing ({subscriptions.filter(s => s.status === "trialing").length})
              </Button>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !startDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateFrom ? format(startDateFrom, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateFrom}
                      onSelect={setStartDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !startDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateTo ? format(startDateTo, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateTo}
                      onSelect={setStartDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !endDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateFrom ? format(endDateFrom, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateFrom}
                      onSelect={setEndDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !endDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateTo ? format(endDateTo, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateTo}
                      onSelect={setEndDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 lg:px-3"
                >
                  Clear Filters
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
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

          {/* Expiring Soon Alert */}
          {expiringSoon.length > 0 && statusFilter === "all" && (
            <div className="mb-4 p-4 border border-orange-200 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                    {expiringSoon.length} Subscription{expiringSoon.length !== 1 ? "s" : ""} Expiring Soon
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    {expiringSoon.map(s => s.schoolName).join(", ")} will expire within 7 days. Consider reaching out for renewal.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  table.getRowModel().rows.map((row) => {
                    const subscription = row.original;
                    const expiring = isExpiringSoon(subscription);
                    
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          expiring && "bg-orange-50 dark:bg-orange-950/10 border-l-4 border-l-orange-500"
                        )}
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
                    );
                  })
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
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {filteredSubscriptions.length} subscription(s)
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
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
