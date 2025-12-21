"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react";
import { roleDisplayNames } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/loading-skeletons";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return <DashboardSkeleton />;

  const isSuperAdmin = user.role === "super_admin";

  // Super Admin stats
  const platformStats = [
    {
      title: "Total Schools",
      value: "0",
      icon: Users,
      description: "Registered schools",
      color: "bg-purple-500",
    },
    {
      title: "Total Users",
      value: "0",
      icon: GraduationCap,
      description: "Across all schools",
      color: "bg-blue-500",
    },
    {
      title: "Active Sessions",
      value: "0",
      icon: TrendingUp,
      description: "Currently online",
      color: "bg-green-500",
    },
    {
      title: "Platform Revenue",
      value: "$0",
      icon: DollarSign,
      description: "Monthly recurring",
      color: "bg-cyan-500",
    },
  ];

  // School role stats
  const schoolStats = [
    {
      title: "Total Students",
      value: "1,234",
      icon: GraduationCap,
      description: "+12% from last month",
      color: "bg-blue-500",
    },
    {
      title: "Total Teachers",
      value: "89",
      icon: Users,
      description: "+3 new this month",
      color: "bg-green-500",
    },
    {
      title: "Attendance Today",
      value: "94.5%",
      icon: Calendar,
      description: "1,167 present",
      color: "bg-purple-500",
    },
    {
      title: "Fees Collected",
      value: "$45,231",
      icon: DollarSign,
      description: "+8% from last month",
      color: "bg-cyan-500",
    },
  ];

  const stats = isSuperAdmin ? platformStats : schoolStats;

  const recentActivities = isSuperAdmin
    ? [
        { action: "New school registered", time: "2 hours ago", icon: Users },
        { action: "School plan upgraded to Premium", time: "5 hours ago", icon: TrendingUp },
        { action: "System maintenance completed", time: "1 day ago", icon: Clock },
        { action: "New super admin login", time: "2 days ago", icon: DollarSign },
      ]
    : [
        { action: "New student enrolled", time: "2 hours ago", icon: GraduationCap },
        { action: "Attendance marked for Grade 10-A", time: "3 hours ago", icon: Clock },
        { action: "Report cards generated", time: "5 hours ago", icon: TrendingUp },
        { action: "Fee payment received", time: "1 day ago", icon: DollarSign },
      ];

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
            <CardDescription>Latest updates from your school</CardDescription>
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
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete your setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Create your account</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 text-xs font-bold text-muted-foreground">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Add classes and subjects</p>
                  <p className="text-xs text-muted-foreground">Coming in Phase 3</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 text-xs font-bold text-muted-foreground">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Register students</p>
                  <p className="text-xs text-muted-foreground">Coming in Phase 4</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 text-xs font-bold text-muted-foreground">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Start taking attendance</p>
                  <p className="text-xs text-muted-foreground">Coming in Phase 5</p>
                </div>
              </div>
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
              <p className="text-sm text-foreground mt-1">{user.schoolName}</p>
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
