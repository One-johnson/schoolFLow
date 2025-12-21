"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Calendar } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Students",
      value: "0",
      icon: GraduationCap,
      description: "Active students enrolled",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Teachers",
      value: "0",
      icon: Users,
      description: "Active teaching staff",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Classes",
      value: "0",
      icon: BookOpen,
      description: "Active classes",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Today's Attendance",
      value: "0%",
      icon: Calendar,
      description: "Overall attendance rate",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening in your school today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates from your school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities</p>
              <p className="text-sm mt-1">Activities will appear here once you start using the system</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Important dates and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No upcoming events</p>
              <p className="text-sm mt-1">Events will appear here once scheduled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Set up your school management system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Set up academic year and terms</p>
                <p className="text-sm text-gray-500">Configure your school's academic calendar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Create classes and sections</p>
                <p className="text-sm text-gray-500">Set up your school's class structure</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Add teachers and staff</p>
                <p className="text-sm text-gray-500">Invite your team members to the platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Register students</p>
                <p className="text-sm text-gray-500">Start adding students to your classes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
