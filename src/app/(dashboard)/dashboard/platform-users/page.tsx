"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Shield, ArrowUpDown } from "lucide-react";
import { roleDisplayNames } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { TablePageSkeleton } from "@/components/loading-skeletons";
import { Id } from "../../../../../convex/_generated/dataModel";

export const dynamic = 'force-dynamic';

type User = {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  role: string;
  status: string;
  lastLogin: number | undefined;
};

export default function PlatformUsersPage() {
  const users = useQuery(api.platform.getAllUsers);

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500",
      school_admin: "bg-blue-500",
      principal: "bg-cyan-500",
      teacher: "bg-green-500",
      student: "bg-yellow-500",
      parent: "bg-orange-500",
      staff: "bg-gray-500",
    };
    return <Badge className={colors[role] || "bg-gray-500"}>{roleDisplayNames[role as keyof typeof roleDisplayNames]}</Badge>;
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        return <div className="font-medium">{user.firstName} {user.lastName}</div>;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "schoolName",
      header: "School",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => getRoleBadge(row.getValue("role")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLogin") as number | undefined;
        return lastLogin ? new Date(lastLogin).toLocaleDateString() : "Never";
      },
    },
  ];

  if (users === undefined) {
    return <TablePageSkeleton />;
  }

  const roleStats = users.reduce((acc: Record<string, number>, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Users</h1>
          <p className="text-muted-foreground mt-1">
            View all users across all schools
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.school_admin || 0}</div>
            <p className="text-xs text-muted-foreground">
              Managing schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.teacher || 0}</div>
            <p className="text-xs text-muted-foreground">
              Teaching staff
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.student || 0}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and filter users across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={users} 
            searchKey="email"
            searchPlaceholder="Search by email..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
