
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Megaphone, BookOpen, Users, UserCheck } from "lucide-react";
import Link from "next/link";
import { useDatabase } from "@/hooks/use-database";
import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type Student = { id: string; createdAt: number };
type Teacher = { id: string; createdAt: number };
type Announcement = { id: string; createdAt: number };
type Class = { id: string };

export function AdminDashboard() {
  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { data: announcements } = useDatabase<Announcement>('announcements');
  const { data: classes } = useDatabase<Class>('classes');

  const newAnnouncementsThisWeek = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return announcements.filter(a => a.createdAt > oneWeekAgo.getTime()).length;
  }, [announcements]);

  const onboardingData = useMemo(() => {
    const data: { [key: string]: { month: string; students: number; teachers: number } } = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${months[d.getMonth()]}`;
      data[monthKey] = { month: months[d.getMonth()], students: 0, teachers: 0 };
    }

    students.forEach(s => {
      if (s.createdAt) {
        const date = new Date(s.createdAt);
        const monthKey = `${date.getFullYear()}-${months[date.getMonth()]}`;
        if (data[monthKey]) {
          data[monthKey].students++;
        }
      }
    });
    
    teachers.forEach(t => {
      if (t.createdAt) {
        const date = new Date(t.createdAt);
        const monthKey = `${date.getFullYear()}-${months[date.getMonth()]}`;
        if (data[monthKey]) {
          data[monthKey].teachers++;
        }
      }
    });

    return Object.values(data);
  }, [students, teachers]);

  const chartConfig = {
    students: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
    teachers: {
      label: "Teachers",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your school.
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
            <CardTitle>Onboarding Overview</CardTitle>
            <CardDescription>New students and teachers from the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={onboardingData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Legend />
                  <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                  <Bar dataKey="teachers" fill="var(--color-teachers)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
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
