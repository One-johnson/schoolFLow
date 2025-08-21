import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Users, UserCheck, Megaphone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Admin! Here's an overview of your school.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82</div>
            <p className="text-xs text-muted-foreground">+5 since last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              Operational <Badge className="bg-green-500 hover:bg-green-600"> </Badge>
            </div>
            <p className="text-xs text-muted-foreground">All systems running smoothly</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              A log of recent activities across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New student enrolled</p>
                  <p className="text-sm text-muted-foreground">John Doe has been added to Grade 10.</p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">5m ago</div>
              </div>
              <div className="flex items-center">
                <Megaphone className="h-5 w-5 mr-3" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New announcement posted</p>
                  <p className="text-sm text-muted-foreground">"Parent-Teacher Meeting next week."</p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">1h ago</div>
              </div>
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Teacher profile updated</p>
                  <p className="text-sm text-muted-foreground">Jane Smith updated her contact info.</p>
                </div>
                <div className="ml-auto font-medium text-xs text-muted-foreground">3h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-4 md:col-span-3">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Navigate to key areas of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/students" className="block p-4 bg-secondary hover:bg-muted rounded-lg text-center">
                Manage Students
              </Link>
              <Link href="/dashboard/teachers" className="block p-4 bg-secondary hover:bg-muted rounded-lg text-center">
                Manage Teachers
              </Link>
              <Link href="/dashboard/announcements" className="block p-4 bg-secondary hover:bg-muted rounded-lg text-center">
                Post Announcement
              </Link>
              <Link href="/dashboard/summarize" className="block p-4 bg-secondary hover:bg-muted rounded-lg text-center">
                AI Summarizer
              </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
