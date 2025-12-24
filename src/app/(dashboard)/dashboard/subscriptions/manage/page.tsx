"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Plus, Calendar as CalendarIcon, Check, X, Clock, Package, Download, Trash2, Edit2, MoreVertical, ChevronDown, ArrowUpDown, AlertTriangle, DollarSign, TrendingUp, TrendingDown, RefreshCw, Eye, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { StatsSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export const dynamic = "force-dynamic";
export const runtime = "edge";

interface EnrichedSubscription {
  _id: Id<"subscriptions">;
  schoolId: Id<"schools">;
  planId: Id<"subscriptionPlans">;
  status: string;
  startDate: number;
  endDate: number;
  autoRenew: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: Id<"users">;
  schoolName: string;
  planName: string;
  planPrice: number;
  creatorName: string;
}

export default function ManageSubscriptionsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<EnrichedSubscription | null>(null);
  const [deleteSubscriptionId, setDeleteSubscriptionId] = useState<Id<"subscriptions"> | null>(null);
  
  // Form states
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | "">("");
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"subscriptionPlans"> | "">("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [notes, setNotes] = useState("");
  
  // Edit form states
  const [editPlanId, setEditPlanId] = useState<Id<"subscriptionPlans"> | "">("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editAutoRenew, setEditAutoRenew] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState("");

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDateRange, setStartDateRange] = useState<DateRange | undefined>();
  const [endDateRange, setEndDateRange] = useState<DateRange | undefined>();

  const schools = useQuery(api.platform.getAllSchools);
  const plans = useQuery(api.subscriptionPlans.getAllPlans);
  const subscriptions = useQuery(api.subscriptions.getAllSubscriptions);
  const payments = useQuery(api.payments.getAllPayments);

  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const createPayment = useMutation(api.payments.createPayment);
  const seedPlans = useMutation(api.subscriptionPlans.seedDefaultPlans);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!subscriptions || !payments) return null;

    const now = Date.now();
    const activeCount = subscriptions.filter((s) => s.status === "active").length;
    const expiredCount = subscriptions.filter((s) => s.status === "expired").length;
    const trialingCount = subscriptions.filter((s) => s.status === "trialing").length;
    const inactiveCount = subscriptions.filter((s) => s.status === "inactive").length;

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const expiringSoon = subscriptions.filter(
      (s) => s.status === "active" && s.endDate > now && s.endDate <= sevenDaysFromNow
    );

    // MRR and ARR
    const activeSubs = subscriptions.filter((s) => s.status === "active");
    const mrr = activeSubs.reduce((sum, s) => sum + s.planPrice, 0);
    const arr = mrr * 12;

    // Renewal and churn rate (last 30 days)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentSubs = subscriptions.filter((s) => s.createdAt >= thirtyDaysAgo);
    const renewedSubs = recentSubs.filter((s) => s.autoRenew).length;
    const renewalRate = recentSubs.length > 0 ? (renewedSubs / recentSubs.length) * 100 : 0;

    const expiredInLast30 = subscriptions.filter(
      (s) => s.status === "expired" && s.updatedAt >= thirtyDaysAgo
    ).length;
    const totalActive30DaysAgo = subscriptions.filter(
      (s) => s.createdAt < thirtyDaysAgo && s.status === "active"
    ).length;
    const churnRate =
      totalActive30DaysAgo > 0 ? (expiredInLast30 / totalActive30DaysAgo) * 100 : 0;

    // Payment stats
    const totalRevenue = payments
      .filter((p) => p.paymentStatus === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      activeCount,
      expiredCount,
      trialingCount,
      inactiveCount,
      expiringSoon: expiringSoon.length,
      expiringSoonList: expiringSoon,
      mrr,
      arr,
      renewalRate,
      churnRate,
      totalRevenue,
    };
  }, [subscriptions, payments]);

  // Chart data
  const planDistributionData = useMemo(() => {
    if (!subscriptions) return [];

    const distribution: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      distribution[sub.planName] = (distribution[sub.planName] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      percentage: subscriptions.length > 0 ? ((value / subscriptions.length) * 100).toFixed(1) : "0",
    }));
  }, [subscriptions]);

  const statusDistributionData = useMemo(() => {
    if (!subscriptions) return [];

    return [
      { name: "Active", value: stats?.activeCount || 0, color: "#10b981" },
      { name: "Expired", value: stats?.expiredCount || 0, color: "#ef4444" },
      { name: "Trialing", value: stats?.trialingCount || 0, color: "#3b82f6" },
      { name: "Inactive", value: stats?.inactiveCount || 0, color: "#6b7280" },
    ];
  }, [subscriptions, stats]);

  const revenueData = useMemo(() => {
    if (!payments) return [];

    // Group payments by month
    const monthlyRevenue: Record<string, number> = {};
    payments
      .filter((p) => p.paymentStatus === "paid" && p.paymentDate)
      .forEach((payment) => {
        const date = new Date(payment.paymentDate!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + payment.amount;
      });

    return Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }));
  }, [payments]);

  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];

    return subscriptions.filter((sub) => {
      // Status filter
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;

      // Start date filter
      if (startDateRange?.from && sub.startDate < startDateRange.from.getTime()) return false;
      if (startDateRange?.to) {
        const endOfDay = new Date(startDateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (sub.startDate > endOfDay.getTime()) return false;
      }

      // End date filter
      if (endDateRange?.from && sub.endDate < endDateRange.from.getTime()) return false;
      if (endDateRange?.to) {
        const endOfDay = new Date(endDateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (sub.endDate > endOfDay.getTime()) return false;
      }

      return true;
    });
  }, [subscriptions, statusFilter, startDateRange, endDateRange]);

  // Table columns
  const columns: ColumnDef<EnrichedSubscription>[] = [
    {
      id: "select",
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
    },
    {
      accessorKey: "planName",
      header: "Plan",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.planName}</div>
          <div className="text-sm text-muted-foreground">
            GHS {row.original.planPrice.toLocaleString()}/month
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Start Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            End Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const daysLeft = getDaysUntilExpiry(row.original.endDate);
        const isExpiring = daysLeft <= 7 && daysLeft > 0;

        return (
          <div className="flex items-center gap-2">
            <span>{new Date(row.original.endDate).toLocaleDateString()}</span>
            {isExpiring && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {daysLeft}d
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "creatorName",
      header: "Created By",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subscription = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenEditDialog(subscription)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenPaymentDialog(subscription)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Add Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewPayments(subscription)}>
                <Eye className="mr-2 h-4 w-4" />
                View Payments
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeleteSubscriptionId(subscription._id);
                  setIsDeleteDialogOpen(true);
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
    data: filteredSubscriptions,
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const handleSeedPlans = async () => {
    try {
      await seedPlans();
      toast.success("Subscription plans created successfully!");
    } catch (error) {
      toast.error("Failed to create plans");
      console.error(error);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedSchoolId || !selectedPlanId || !user) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const start = new Date(startDate).getTime();
      const end = new Date(start);
      end.setMonth(end.getMonth() + durationMonths);

      await createSubscription({
        schoolId: selectedSchoolId as Id<"schools">,
        planId: selectedPlanId as Id<"subscriptionPlans">,
        startDate: start,
        endDate: end.getTime(),
        status: "active",
        notes,
        createdBy: user.id,
      });

      toast.success("Subscription created successfully");
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create subscription");
      console.error(error);
    }
  };

  const handleOpenEditDialog = (subscription: EnrichedSubscription) => {
    setSelectedSubscription(subscription);
    setEditPlanId(subscription.planId);
    setEditStatus(subscription.status);
    setEditStartDate(new Date(subscription.startDate).toISOString().split("T")[0]);
    setEditEndDate(new Date(subscription.endDate).toISOString().split("T")[0]);
    setEditAutoRenew(subscription.autoRenew);
    setEditNotes(subscription.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription || !user) return;

    try {
      await updateSubscription({
        subscriptionId: selectedSubscription._id,
        planId: editPlanId !== selectedSubscription.planId ? (editPlanId as Id<"subscriptionPlans">) : undefined,
        status: editStatus !== selectedSubscription.status ? editStatus : undefined,
        startDate: new Date(editStartDate).getTime() !== selectedSubscription.startDate ? new Date(editStartDate).getTime() : undefined,
        endDate: new Date(editEndDate).getTime() !== selectedSubscription.endDate ? new Date(editEndDate).getTime() : undefined,
        autoRenew: editAutoRenew !== selectedSubscription.autoRenew ? editAutoRenew : undefined,
        notes: editNotes !== selectedSubscription.notes ? editNotes : undefined,
        updatedBy: user.id,
      });

      toast.success("Subscription updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSubscription(null);
    } catch (error) {
      toast.error("Failed to update subscription");
      console.error(error);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!deleteSubscriptionId) return;

    try {
      await deleteSubscription({ subscriptionId: deleteSubscriptionId });
      toast.success("Subscription deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteSubscriptionId(null);
    } catch (error) {
      toast.error("Failed to delete subscription");
      console.error(error);
    }
  };

  const handleOpenPaymentDialog = (subscription: EnrichedSubscription) => {
    setSelectedSubscription(subscription);
    setPaymentAmount(subscription.planPrice);
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentReference("");
    setPaymentNotes("");
    setIsPaymentDialogOpen(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedSubscription || !user) return;

    try {
      await createPayment({
        schoolId: selectedSubscription.schoolId,
        subscriptionId: selectedSubscription._id,
        amount: paymentAmount,
        currency: "GHS",
        paymentMethod,
        paymentStatus: "paid",
        paymentDate: new Date(paymentDate).getTime(),
        dueDate: new Date(paymentDate).getTime(),
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
        recordedBy: user.id,
      });

      toast.success("Payment recorded successfully");
      setIsPaymentDialogOpen(false);
      setSelectedSubscription(null);
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    }
  };

  const handleViewPayments = (subscription: EnrichedSubscription) => {
    toast.info(`Viewing payments for ${subscription.schoolName} - Coming soon!`);
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((row) =>
          deleteSubscription({ subscriptionId: row.original._id })
        )
      );
      toast.success(`${selectedRows.length} subscriptions deleted successfully`);
      setIsBulkDeleteDialogOpen(false);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to delete subscriptions");
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : filteredSubscriptions;

    const columns: ExportColumn[] = [
      { header: "School", key: "schoolName" },
      { header: "Plan", key: "planName" },
      { header: "Price", key: "planPrice" },
      { header: "Status", key: "status" },
      { header: "Start Date", key: "startDate" },
      { header: "End Date", key: "endDate" },
      { header: "Auto Renew", key: "autoRenew" },
      { header: "Created By", key: "creatorName" },
      { header: "Notes", key: "notes" },
    ];

    exportToCSV( dataToExport as unknown as Record<string, unknown>[], columns, "subscriptions");
    toast.success("Subscriptions exported to CSV");
  };

  const handleExportPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : filteredSubscriptions;

    const columns: ExportColumn[] = [
      { header: "School", key: "schoolName" },
      { header: "Plan", key: "planName" },
      { header: "Status", key: "status" },
      { header: "Start Date", key: "startDate" },
      { header: "End Date", key: "endDate" },
    ];

    // Ensure the data is cast to Record<string, unknown>[] for type safety
    exportToPDF(
      dataToExport as unknown as Record<string, unknown>[],
      columns,
      "subscriptions",
      "Subscription Report"
    );
    toast.success("Subscriptions exported to PDF");
  };

  const resetForm = () => {
    setSelectedSchoolId("");
    setSelectedPlanId("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setDurationMonths(1);
    setNotes("");
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setStartDateRange(undefined);
    setEndDateRange(undefined);
    setGlobalFilter("");
    table.resetColumnFilters();
  };

  if (!schools || !plans || !subscriptions || !payments || !stats) {
    return <StatsSkeleton />;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: "bg-green-500", icon: <Check className="h-3 w-3" /> },
      inactive: { color: "bg-gray-500", icon: <X className="h-3 w-3" /> },
      expired: { color: "bg-red-500", icon: <X className="h-3 w-3" /> },
      trialing: { color: "bg-blue-500", icon: <Clock className="h-3 w-3" /> },
    };

    const { color, icon } = config[status] || config.inactive;

    return (
      <Badge className={`${color} flex items-center gap-1 w-fit`}>
        {icon}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (endDate: number) => {
    const days = Math.floor((endDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-6 pb-8 max-w-full">
      {/* No Plans Warning */}
      {plans.length === 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold mb-2">No Subscription Plans Found</h3>
            <p className="text-muted-foreground mb-4">
              You need to create subscription plans first before you can assign them to schools.
            </p>
            <Button onClick={handleSeedPlans} variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Create Default Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  {stats.expiringSoon} subscription{stats.expiringSoon > 1 ? "s" : ""} expiring within 7 days
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {stats.expiringSoonList.map((s) => s.schoolName).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ARR: GHS {stats.arr.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiringSoon} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.renewalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiredCount} expired total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Subscription breakdown by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percent}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
            <CardDescription>Subscription status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      {revenueData.length > 0 && (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/subscriptions/plans'}>
            <Package className="mr-2 h-4 w-4" />
            Manage Plans
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
                <DialogDescription>
                  Assign a subscription plan to a school
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Select
                    value={selectedSchoolId}
                    onValueChange={(value) => setSelectedSchoolId(value as Id<"schools">)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan *</Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={(value) =>
                      setSelectedPlanId(value as Id<"subscriptionPlans">)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan._id} value={plan._id}>
                          {plan.displayName} - GHS {plan.price}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (Months) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={durationMonths}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setDurationMonths(isNaN(value) || value < 1 ? 1 : value);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this subscription..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubscription}>Create Subscription</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Filter Buttons */}
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
                className={statusFilter === "active" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                <Check className="mr-1 h-3 w-3" />
                Active ({stats.activeCount})
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
                className={statusFilter === "expired" ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <X className="mr-1 h-3 w-3" />
                Expired ({stats.expiredCount})
              </Button>
              <Button
                variant={statusFilter === "trialing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("trialing")}
                className={statusFilter === "trialing" ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                <Clock className="mr-1 h-3 w-3" />
                Trialing ({stats.trialingCount})
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className={statusFilter === "inactive" ? "bg-gray-500 hover:bg-gray-600" : ""}
              >
                <X className="mr-1 h-3 w-3" />
                Inactive ({stats.inactiveCount})
              </Button>
            </div>

            {/* Date Range Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateRange?.from ? (
                        startDateRange.to ? (
                          <>
                            {new Date(startDateRange.from).toLocaleDateString()} -{" "}
                            {new Date(startDateRange.to).toLocaleDateString()}
                          </>
                        ) : (
                          new Date(startDateRange.from).toLocaleDateString()
                        )
                      ) : (
                        <span className="text-muted-foreground">Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={startDateRange}
                      onSelect={setStartDateRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateRange?.from ? (
                        endDateRange.to ? (
                          <>
                            {new Date(endDateRange.from).toLocaleDateString()} -{" "}
                            {new Date(endDateRange.to).toLocaleDateString()}
                          </>
                        ) : (
                          new Date(endDateRange.from).toLocaleDateString()
                        )
                      ) : (
                        <span className="text-muted-foreground">Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={endDateRange}
                      onSelect={setEndDateRange}
                      numberOfMonths={2}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscriptions..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedCount} row{selectedCount > 1 ? "s" : ""} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="capitalize"
                      onClick={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        className="mr-2"
                      />
                      {column.id}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
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
                  table.getRowModel().rows.map((row) => {
                    const daysLeft = getDaysUntilExpiry(row.original.endDate);
                    const isExpiring = daysLeft <= 7 && daysLeft > 0;

                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={isExpiring ? "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500" : ""}
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
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount > 0 && (
            <span>
              {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
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
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {">"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {">>"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedSubscription?.schoolName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPlan">Subscription Plan</Label>
              <Select
                value={editPlanId}
                onValueChange={(value) => setEditPlanId(value as Id<"subscriptionPlans">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.displayName} - GHS {plan.price}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
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
                <Label htmlFor="editStartDate">Start Date</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editAutoRenew"
                checked={editAutoRenew}
                onCheckedChange={(checked) => setEditAutoRenew(checked as boolean)}
              />
              <Label htmlFor="editAutoRenew" className="cursor-pointer">
                Auto-renewal enabled
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                placeholder="Add any notes about this subscription..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSubscription}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add payment record for {selectedSubscription?.schoolName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount (GHS) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">Reference Number</Label>
                <Input
                  id="paymentReference"
                  placeholder="e.g., TXN123456"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any notes about this payment..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscription
              and reset the school's plan to "free".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} subscription{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              subscriptions and reset affected schools' plans to "free".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
