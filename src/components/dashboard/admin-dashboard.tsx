
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
import { Megaphone, BookOpen, Users, UserCheck, DollarSign, CalendarCheck, Activity, CalendarPlus, Landmark } from "lucide-react";
import Link from "next/link";
import { useDatabase } from "@/hooks/use-database";
import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, isWithinInterval, startOfToday, endOfToday, addDays } from "date-fns";
import { Badge } from "../ui/badge";

type Student = { id: string; name: string };
type Teacher = { id: string; name: string };
type Class = { id: string; studentIds?: Record<string, boolean> };
type Event = { id: string; startDate: string };
type StudentFee = { id: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type AttendanceRecord = Record<string, "Present" | "Absent" | "Late" | "Excused">;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type Notification = { id: string, message: string, createdAt: number, type: string };

const iconMap: { [key: string]: React.ReactNode } = {
  student_enrolled: <Users className="h-4 w-4" />,
  teacher_added: <UserCheck className="h-4 w-4" />,
  class_created: <BookOpen className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
  default: <Activity className="h-4 w-4" />
};

export function AdminDashboard() {
  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { data: classes } = useDatabase<Class>('classes');
  const { data: events } = useDatabase<Event>('events');
  const { data: studentFees } = useDatabase<StudentFee>('studentFees');
  const { data: rawAttendance } = useDatabase<DailyAttendance>(`attendance`);
  const { data: notifications } = useDatabase<Notification>("notifications");

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  const attendanceStats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaysLog = rawAttendance.find(log => log.id === todayStr);

    if (!todaysLog || totalStudents === 0) return { present: 0, percentage: 0 };
    
    let presentCount = 0;
    Object.values(todaysLog).forEach(classRecords => {
      if (typeof classRecords === 'object' && classRecords !== null) {
        Object.values(classRecords).forEach(status => {
          if (status === 'Present') {
            presentCount++;
          }
        })
      }
    });

    return {
        present: presentCount,
        percentage: Math.round((presentCount / totalStudents) * 100)
    };

  }, [rawAttendance, totalStudents]);

  const eventStats = useMemo(() => {
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    const upcoming = events.filter(event => {
        try {
           const eventDate = new Date(event.startDate + 'T00:00:00'); // Ensure date is parsed correctly
           return isWithinInterval(eventDate, { start: today, end: nextWeek });
        } catch {
            return false;
        }
    }).length;
    return { upcoming };
  }, [events]);

  const feeStats = useMemo(() => {
    return studentFees.reduce((acc, fee) => {
        acc.totalPaid += fee.amountPaid;
        acc.totalDue += fee.amountDue;
        return acc;
    }, { totalPaid: 0, totalDue: 0 });
  }, [studentFees]);

  const recentActivity = useMemo(() => {
    return [...notifications].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [notifications]);

  const onboardingData = useMemo(() => {
    const data: { [key: string]: { month: string; students: number; teachers: number } } = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${months[d.getMonth()]}`;
      data[monthKey] = { month: months[d.getMonth()], students: 0, teachers: 0 };
    }
    // This part is placeholder logic as we don't have createdAt for students/teachers
    // In a real app, you would iterate over actual creation dates
    // For now, it will just show 0s.
    return Object.values(data);
  }, []);

  const chartConfig = {
    students: { label: "Students", color: "hsl(var(--chart-1))" },
    teachers: { label: "Teachers", color: "hsl(var(--chart-2))" },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a live overview of your school.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">On staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Across all grades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.percentage}%</div>
            <p className="text-xs text-muted-foreground">{attendanceStats.present} of {totalStudents} present</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{feeStats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">GH₵{(feeStats.totalDue - feeStats.totalPaid).toLocaleString()} outstanding</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.upcoming}</div>
            <p className="text-xs text-muted-foreground">In the next 7 days</p>
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of the latest events across the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentActivity.length > 0 ? recentActivity.map(item => (
                       <div key={item.id} className="flex items-center">
                           <div className="p-2 bg-muted rounded-full mr-3">
                            {iconMap[item.type] || iconMap.default}
                           </div>
                           <div className="flex-grow">
                             <p className="text-sm">{item.message}</p>
                             <p className="text-xs text-muted-foreground">
                                {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                             </p>
                           </div>
                       </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No recent activities.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
