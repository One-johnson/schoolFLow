"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  UserPlus,
} from "lucide-react";
import { StatsSkeleton } from "@/components/loading-skeletons";

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const stats = useQuery(api.platform.getPlatformStats);

  if (stats === undefined) {
    return <StatsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            System-wide metrics and insights
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSchools} active
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
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

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Users currently online
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newUsersThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              New users this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>New This Week</CardTitle>
            <CardDescription>Recent growth metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">New Schools</span>
                </div>
                <span className="text-2xl font-bold">+{stats.newSchoolsThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">New Users</span>
                </div>
                <span className="text-2xl font-bold">+{stats.newUsersThisWeek}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role across platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / stats.totalUsers) * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Subscription Distribution</CardTitle>
          <CardDescription>Schools by subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(stats.schoolsByPlan).map(([plan, count]) => {
              const colors: Record<string, string> = {
                free: "bg-gray-500",
                basic: "bg-blue-500",
                premium: "bg-purple-500",
                enterprise: "bg-amber-500",
              };
              return (
                <div key={plan} className="text-center">
                  <div className={`${colors[plan]} text-white rounded-lg p-6 mb-2`}>
                    <div className="text-3xl font-bold">{count}</div>
                    <p className="text-sm opacity-90">schools</p>
                  </div>
                  <p className="text-sm font-medium capitalize">{plan} Plan</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Users/School</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSchools > 0
                ? Math.round(stats.totalUsers / stats.totalSchools)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average user count per school
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0
                ? Math.round((stats.activeSessions / stats.totalUsers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Users currently active
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0
                ? Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly user growth
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
