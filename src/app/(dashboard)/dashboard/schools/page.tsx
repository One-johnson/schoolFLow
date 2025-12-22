"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
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
import { Building2, MoreHorizontal, Users, Calendar, CheckCircle, XCircle, AlertCircle, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { TablePageSkeleton } from "@/components/loading-skeletons";

export const dynamic = 'force-dynamic';

type School = {
  _id: Id<"schools">;
  name: string;
  email: string;
  userCount: number;
  subscriptionPlan: string;
  status: string;
  createdAt: number;
};

export default function AllSchoolsPage() {
  const schools = useQuery(api.platform.getAllSchools);
  const updateStatus = useMutation(api.platform.updateSchoolStatus);
  const updatePlan = useMutation(api.platform.updateSchoolPlan);
  const { toast } = useToast();

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

  if (schools === undefined) {
    return <TablePageSkeleton />;
  }

  const activeSchools = schools.filter(s => s.status === "active").length;
  const totalUsers = schools.reduce((sum, s) => sum + s.userCount, 0);

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeSchools} active
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.filter(s => {
                const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                return s.createdAt > monthAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              New schools registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Schools</CardTitle>
          <CardDescription>A list of all schools registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={schools.map(s => ({
              ...s,
              subscriptionPlan: s.subscriptionPlan ?? ""
            }))}
            searchKey="name"
            searchPlaceholder="Search schools..."
          
          />
            </CardContent>
      </Card>
    </div>
  );
}
