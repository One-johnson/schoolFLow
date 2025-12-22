"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, Clock, Building2, Shield } from "lucide-react";
import { roleDisplayNames } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/loading-skeletons";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";

  // Fetch platform stats for super admin
  const platformStats = useQuery(
    api.dashboard.getPlatformDashboardStats,
    isSuperAdmin ? {} : "skip"
  );

  // Fetch school stats for school roles
  const schoolStats = useQuery(
    api.dashboard.getSchoolStats,
    !isSuperAdmin && user?.schoolId 
      ? { schoolId: user.schoolId as Id<"schools"> }
      : "skip"
  );

  // Fetch recent activities
  const platformActivities = useQuery(
    api.dashboard.getPlatformRecentActivities,
    isSuperAdmin ? { limit: 6 } : "skip"
  );

  const schoolActivities = useQuery(
    api.dashboard.getSchoolRecentActivities,
    !isSuperAdmin && user?.schoolId
      ? { schoolId: user.schoolId as Id<"schools">, limit: 6 }
      : "skip"
  );

  if (!user) return <DashboardSkeleton />;

  // Show loading skeleton while data is being fetched
  if (isSuperAdmin && platformStats === undefined) return <DashboardSkeleton />;
  if (!isSuperAdmin && schoolStats === undefined) return <DashboardSkeleton />;

  // Super Admin dashboard stats
  const platformStatsCards = [
    {
      title: "Total Schools",
      value: platformStats?.totalSchools.toString() || "0",
      icon: Building2,
      description: `${platformStats?.activeSchools || 0} active schools`,
      color: "bg-purple-500",
    },
    {
      title: "Total Users",
      value: platformStats?.totalUsers.toString() || "0",
      icon: Users,
      description: `${platformStats?.totalStudents || 0} students across platform`,
      color: "bg-blue-500",
    },
    {
      title: "Active Sessions",
      value: platformStats?.activeSessions.toString() || "0",
      icon: TrendingUp,
      description: "Currently online",
      color: "bg-green-500",
    },
    {
      title: "Platform Revenue",
      value: `$${platformStats?.platformRevenue.toLocaleString() || "0"}`,
      icon: DollarSign,
      description: "Monthly recurring",
      color: "bg-cyan-500",
    },
  ];

  // School role dashboard stats
  const schoolStatsCards = [
    {
      title: "Total Students",
      value: schoolStats?.totalStudents.toString() || "0",
      icon: GraduationCap,
      description: schoolStats?.newStudentsThisMonth 
        ? `+${schoolStats.newStudentsThisMonth} new this month`
        : "No new students",
      color: "bg-blue-500",
    },
    {
      title: "Total Teachers",
      value: schoolStats?.totalTeachers.toString() || "0",
      icon: Users,
      description: schoolStats?.newTeachersThisMonth
        ? `+${schoolStats.newTeachersThisMonth} new this month`
        : "No new teachers",
      color: "bg-green-500",
    },
    {
      title: "Total Classes",
      value: schoolStats?.totalClasses.toString() || "0",
      icon: Calendar,
      description: `${schoolStats?.totalSections || 0} sections`,
      color: "bg-purple-500",
    },
    {
      title: "Total Staff",
      value: schoolStats?.totalStaff.toString() || "0",
      icon: Shield,
      description: "School administrators",
      color: "bg-cyan-500",
    },
  ];

  const stats = isSuperAdmin ? platformStatsCards : schoolStatsCards;

  // Map activities to the format expected by the UI
  const recentActivities = isSuperAdmin
    ? (platformActivities || []).map(activity => ({
        action: activity.action,
        time: activity.time,
        icon: getIconForActivityType(activity.type),
      }))
    : (schoolActivities || []).map(activity => ({
        action: activity.action,
        time: activity.time,
        icon: getIconForActivityType(activity.type),
      }));

  // Show empty state if no activities
  if (recentActivities.length === 0) {
    recentActivities.push({
      action: isSuperAdmin 
        ? "Welcome to SchoolFlow Platform! Start by adding your first school."
        : "Welcome to SchoolFlow! Start by adding students and classes.",
      time: "Just now",
      icon: TrendingUp,
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isSuperAdmin
            ? "Platform overview and system metrics"
            : "Here's what's happening in your school today"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4 card-hover">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {isSuperAdmin ? "Latest platform updates" : "Latest updates from your school"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                    <activity.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Getting Started */}
        <Card className="col-span-3 card-hover">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSuperAdmin ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Manage Schools</p>
                      <p className="text-xs text-muted-foreground">Add or update school information</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Check platform performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Manage Subscriptions</p>
                      <p className="text-xs text-muted-foreground">Update school plans</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Review Audit Logs</p>
                      <p className="text-xs text-muted-foreground">Monitor system activity</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Account Created</p>
                      <p className="text-xs text-muted-foreground">Your profile is set up</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Add Classes</p>
                      <p className="text-xs text-muted-foreground">Organize your school structure</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Enroll Students</p>
                      <p className="text-xs text-muted-foreground">Add students to your school</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Invite Teachers</p>
                      <p className="text-xs text-muted-foreground">Build your teaching staff</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info Card */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
          <CardDescription>Account information and role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm text-foreground mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-sm text-foreground mt-1">{roleDisplayNames[user.role as keyof typeof roleDisplayNames]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">School</p>
              <p className="text-sm text-foreground mt-1">
                {isSuperAdmin ? "Platform Administrator" : user.schoolName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground mt-1">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get icon based on activity type
function getIconForActivityType(type: string) {
  switch (type) {
    case "student":
      return GraduationCap;
    case "login":
      return Clock;
    case "class":
      return Calendar;
    case "school":
      return Building2;
    case "upgrade":
      return TrendingUp;
    default:
      return DollarSign;
  }
}
