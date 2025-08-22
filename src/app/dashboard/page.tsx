"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Users, UserCheck, Megaphone, BookOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/hooks/use-database";
import { useMemo } from "react";

type Student = { id: string };
type Teacher = { id: string };
type Announcement = { id: string; createdAt: number };
type Class = { id: string };

export default function DashboardPage() {
  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { data: announcements } = useDatabase<Announcement>('announcements');
  const { data: classes } = useDatabase<Class>('classes');

  const newAnnouncementsThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return announcements.filter(a => a.createdAt > oneWeekAgo.getTime()).length;
  }, [announcements]);

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
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Across all grades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground">{newAnnouncementsThisWeek} new this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
             <CardDescription>
              A log of recent activities across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-6 flex items-center gap-4">
             <Activity className="h-5 w-5 mr-3 text-muted-foreground" />
            <div className="text-2xl font-bold flex items-center gap-2">
              Operational <Badge className="bg-green-500 hover:bg-green-600"> </Badge>
            </div>
            <p className="text-sm text-muted-foreground">All systems running smoothly</p>
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

    