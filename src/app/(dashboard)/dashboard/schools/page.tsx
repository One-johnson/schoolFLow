"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Building2, 
  MoreHorizontal, 
  Users, 
  CalendarIcon, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowUpDown,
  Search,
  Download,
  Filter,
  X,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TablePageSkeleton } from "@/components/loading-skeletons";
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
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { format } from "date-fns";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";
import { SchoolDetailDialog } from "../../../../components/school/school-detail-dialog";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type School = {
  _id: Id<"schools">;
  name: string;
  email: string;
  userCount: number;
  subscriptionPlan: string;
  status: string;
  createdAt: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AllSchoolsPage() {
  const schools = useQuery(api.platform.getAllSchools);
  const updateStatus = useMutation(api.platform.updateSchoolStatus);
  const updatePlan = useMutation(api.platform.updateSchoolPlan);
  const { toast } = useToast();

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<Id<"schools"> | null>(null);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | null>(null);

  const handleStatusChange = async (schoolId: Id<"schools">, status: "active" | "inactive" | "suspended") => {
    try {
      await updateStatus({ schoolId, status });
      toast({
        title: "Status Updated",
        description: `School status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update school status",
        variant: "destructive",
      });
    }
  };

  const handlePlanChange = async (schoolId: Id<"schools">, plan: "free" | "basic" | "premium" | "enterprise") => {
    try {
      await updatePlan({ schoolId, plan });
      toast({
        title: "Plan Updated",
        description: `Subscription plan changed to ${plan}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription plan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
      case "inactive":
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />Inactive</Badge>;
      case "suspended":
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      premium: "bg-purple-500",
      enterprise: "bg-amber-500",
    };
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan}</Badge>;
  };

  // Filter data based on all filters
  const filteredData = useMemo(() => {
    if (!schools) return [];

    return schools.filter((school: School) => {
      // Status filter
      if (statusFilter !== "all" && school.status !== statusFilter) return false;

      // Plan filter
      if (planFilter !== "all" && school.subscriptionPlan !== planFilter) return false;

      // Date range filter
      if (dateFrom && school.createdAt < dateFrom.getTime()) return false;
      if (dateTo && school.createdAt > dateTo.getTime()) return false;

      // Global search
      if (globalFilter) {
        const searchLower = globalFilter.toLowerCase();
        return (
          school.name.toLowerCase().includes(searchLower) ||
          school.email.toLowerCase().includes(searchLower) ||
          school.subscriptionPlan.toLowerCase().includes(searchLower) ||
          school.status.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [schools, statusFilter, planFilter, dateFrom, dateTo, globalFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!schools) return {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      totalUsers: 0,
      newThisMonth: 0,
      planDistribution: [],
      statusDistribution: [],
      growthData: [],
    };

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const active = schools.filter((s: School) => s.status === "active").length;
    const inactive = schools.filter((s: School) => s.status === "inactive").length;
    const suspended = schools.filter((s: School) => s.status === "suspended").length;
    const totalUsers = schools.reduce((sum: number, s: School) => sum + s.userCount, 0);
    const newThisMonth = schools.filter((s: School) => s.createdAt > monthAgo).length;

    // Plan distribution
    const planCounts: Record<string, number> = {};
    schools.forEach((s: School) => {
      planCounts[s.subscriptionPlan] = (planCounts[s.subscriptionPlan] || 0) + 1;
    });
    const planDistribution = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

    // Status distribution
    const statusDistribution = [
      { name: "Active", value: active, fill: "#10b981" },
      { name: "Inactive", value: inactive, fill: "#6b7280" },
      { name: "Suspended", value: suspended, fill: "#ef4444" },
    ];

    // Growth data (last 6 months)
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
      const count = schools.filter((s: School) => s.createdAt >= monthStart && s.createdAt <= monthEnd).length;
      growthData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        schools: count,
      });
    }

    return {
      total: schools.length,
      active,
      inactive,
      suspended,
      totalUsers,
      newThisMonth,
      planDistribution,
      statusDistribution,
      growthData,
    };
  }, [schools]);

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            School Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "userCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Users
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Plan",
      cell: ({ row }) => getPlanBadge(row.getValue("subscriptionPlan") || "free"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const school = row.original;
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
                onClick={() => {
                  setSelectedSchoolId(school._id);
                  setDetailDialogOpen(true);
                }}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Change Status
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleStatusChange(school._id, "active")}>
                Set as Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(school._id, "inactive")}>
                Set as Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(school._id, "suspended")}>
                Suspend
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Change Plan
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handlePlanChange(school._id, "free")}>
                Free Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanChange(school._id, "basic")}>
                Basic Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanChange(school._id, "premium")}>
                Premium Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePlanChange(school._id, "enterprise")}>
                Enterprise Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Export handlers
  const handleExportCSV = () => {
    const exportColumns: ExportColumn<School>[] = [
      { header: "School Name", accessor: "name" },
      { header: "Email", accessor: "email" },
      { header: "Users", accessor: "userCount" },
      { header: "Plan", accessor: "subscriptionPlan" },
      { header: "Status", accessor: "status" },
      { 
        header: "Created", 
        accessor: (row: School) => new Date(row.createdAt).toLocaleDateString() 
      },
    ];

    exportToCSV(filteredData, exportColumns, "schools");
    toast({
      title: "Export Successful",
      description: "Schools data exported to CSV",
    });
  };

  const handleExportPDF = () => {
    const exportColumns: ExportColumn<School>[] = [
      { header: "School Name", accessor: "name" },
      { header: "Email", accessor: "email" },
      { header: "Users", accessor: "userCount" },
      { header: "Plan", accessor: "subscriptionPlan" },
      { header: "Status", accessor: "status" },
      { 
        header: "Created", 
        accessor: (row: School) => new Date(row.createdAt).toLocaleDateString() 
      },
    ];

    exportToPDF(filteredData, exportColumns, "Schools Report", "schools-report");
    toast({
      title: "Export Successful",
      description: "Schools data exported to PDF",
    });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPlanFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setGlobalFilter("");
  };

  const hasActiveFilters = statusFilter !== "all" || planFilter !== "all" || dateFrom || dateTo || globalFilter;

  if (schools === undefined) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Schools</h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered schools on the platform
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inactive / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.suspended / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New schools registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Plan Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Schools by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
            <CardDescription>Schools by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>School Growth</CardTitle>
            <CardDescription>New schools (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="schools" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Schools Management</CardTitle>
          <CardDescription>
            Filter, search, and manage all schools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Section */}
          <div className="space-y-4">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className={statusFilter === "active" ? "bg-green-500 hover:bg-green-600" : ""}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Active ({stats.active})
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className={statusFilter === "inactive" ? "bg-gray-500 hover:bg-gray-600" : ""}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Inactive ({stats.inactive})
              </Button>
              <Button
                variant={statusFilter === "suspended" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("suspended")}
                className={statusFilter === "suspended" ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <AlertCircle className="mr-1 h-3 w-3" />
                Suspended ({stats.suspended})
              </Button>
            </div>

            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Global Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schools by name, email, plan, or status..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Plan Filter */}
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      dateTo ? (
                        <>
                          {format(dateFrom, "LLL dd, y")} - {format(dateTo, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateFrom, "LLL dd, y")
                      )
                    ) : (
                      <span>Registration Date Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From</label>
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To</label>
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Export Buttons */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
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

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
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
                      No schools found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} of {stats.total} school(s)
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
                  className="hidden h-8 w-8 p-0 lg:flex"
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
                  className="hidden h-8 w-8 p-0 lg:flex"
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

      {/* School Detail Dialog */}
      <SchoolDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        schoolId={selectedSchoolId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the school
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (schoolToDelete) {
                  // Handle delete logic here
                  toast({
                    title: "School Deleted",
                    description: "The school has been permanently deleted",
                  });
                  setSchoolToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
