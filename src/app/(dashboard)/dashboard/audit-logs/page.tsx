"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, LogIn, Calendar, ArrowUpDown } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { TablePageSkeleton } from "@/components/loading-skeletons";
import type { Id } from "../../../../../convex/_generated/dataModel";

export const dynamic = "force-dynamic";

type AuditLog = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: Id<any>;
  action: string;
  userName: string;
  userEmail: string;
  schoolName: string;
  timestamp: number;
};

export default function AuditLogsPage() {
  const logs = useQuery(api.platform.getAuditLogs, { limit: 100 });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-green-500",
      logout: "bg-gray-500",
      create: "bg-blue-500",
      update: "bg-yellow-500",
      delete: "bg-red-500",
    };
    return <Badge className={colors[action] || "bg-gray-500"}>{action}</Badge>;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60000) {
      return "Just now";
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    // Otherwise show date and time
    return date.toLocaleString();
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => getActionBadge(row.getValue("action")),
    },
    {
      accessorKey: "userName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("userName")}</div>
      ),
    },
    {
      accessorKey: "userEmail",
      header: "Email",
    },
    {
      accessorKey: "schoolName",
      header: "School",
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Timestamp
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatTimestamp(row.getValue("timestamp"))}
        </div>
      ),
    },
  ];

  if (logs === undefined) {
    return <TablePageSkeleton />;
  }

  const todayLogs = logs.filter((log) => {
    const today = new Date();
    const logDate = new Date(log.timestamp);
    return logDate.toDateString() === today.toDateString();
  });

  const thisWeekLogs = logs.filter((log) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return log.timestamp > weekAgo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            System activity and important events
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Last 100 events</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLogs.length}</div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekLogs.length}</div>
            <p className="text-xs text-muted-foreground">Events this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            searchKey="userEmail"
            searchPlaceholder="Search by email..."
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 card-hover">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            About Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            Audit logs track important system events and user actions across the
            platform. Currently showing login events. In future phases, this
            will include:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>User creation, updates, and deletions</li>
            <li>School configuration changes</li>
            <li>Subscription plan modifications</li>
            <li>Data exports and sensitive actions</li>
            <li>Failed login attempts and security events</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
