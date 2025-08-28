
"use client"

import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Users, BookCopy, ArrowRight, ClipboardCheck, Edit, MailCheck, Clock, XCircle } from "lucide-react";
import { format, parseISO, isFuture, startOfWeek, subDays, eachDayOfInterval } from 'date-fns';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";

// Data Types
type Class = { id: string; name: string; teacherId?: string; studentIds?: Record<string, boolean>; };
type Subject = { id: string; name: string; teacherIds?: Record<string, boolean>; };
type Student = { id: string; name: string; avatarUrl?: string; };
type Announcement = { id: string; title: string; content: string; createdAt: number; };
type Event = { id: string; title: string; startDate: string; };
type PermissionSlip = { id: string; studentName: string; studentId: string; startDate: string; endDate: string; status: "Pending" | "Approved" | "Rejected"; createdAt: number; };
type Exam = { id: string; name: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing"; };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceRecord = Record<string, AttendanceStatus>;
type DailyAttendance = { [classId: string]: AttendanceRecord };


export function TeacherDashboard() {
  const { user } = useAuth();
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');
  const { data: students, loading: studentsLoading } = useDatabase<Student>('students');
  const { data: announcements, loading: announcementsLoading } = useDatabase<Announcement>('announcements');
  const { data: events, loading: eventsLoading } = useDatabase<Event>('events');
  const { data: permissionSlips, loading: permissionsLoading } = useDatabase<PermissionSlip>("permissionSlips");
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");
  const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");
  
  const loading = classesLoading || subjectsLoading || studentsLoading || announcementsLoading || eventsLoading || permissionsLoading || examsLoading || gradesLoading || attendanceLoading;

  const [attendanceDateFilter, setAttendanceDateFilter] = useState('last7days');
  const [performanceExamFilter, setPerformanceExamFilter] = useState<string | undefined>();
  
  // Memoized data calculations
  const teacherClasses = useMemo(() => user ? classes.filter(c => c.teacherId === user.uid) : [], [classes, user]);
  const teacherSubjects = useMemo(() => user ? subjects.filter(s => s.teacherIds && s.teacherIds[user.uid]) : [], [subjects, user]);
  const studentIdsInTeacherClasses = useMemo(() => {
    const ids = new Set<string>();
    teacherClasses.forEach(c => {
        if(c.studentIds) Object.keys(c.studentIds).forEach(id => ids.add(id));
    })
    return ids;
  }, [teacherClasses]);
  const totalStudents = studentIdsInTeacherClasses.size;
  const recentAnnouncements = useMemo(() => [...announcements].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3), [announcements]);
  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  
  // Upcoming Events
  const upcomingEvents = useMemo(() => {
    return [...events]
        .filter(e => isFuture(parseISO(e.startDate)))
        .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3);
  }, [events]);
  
  // Attendance Chart Data
  const attendanceData = useMemo(() => {
    const today = new Date();
    let startDate;

    if (attendanceDateFilter === 'thisWeek') {
      startDate = startOfWeek(today, { weekStartsOn: 1 });
    } else { // last7days
      startDate = subDays(today, 6);
    }
    const dateInterval = eachDayOfInterval({ start: startDate, end: today });

    return dateInterval.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const todaysLog = rawAttendance.find(log => log.id === dateStr);
        const dailyCounts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
        
        const dailyStatuses: { [studentId: string]: AttendanceStatus } = {};
         if (todaysLog) {
            for (const classId in todaysLog) {
                if(classId === 'id') continue;
                const classRecords = todaysLog[classId] as AttendanceRecord;
                 Object.entries(classRecords).forEach(([studentId, status]) => {
                     if (studentIdsInTeacherClasses.has(studentId)) {
                        dailyStatuses[studentId] = status;
                     }
                 });
            }
        }

        studentIdsInTeacherClasses.forEach(studentId => {
            const status = dailyStatuses[studentId];
            if (status) {
                dailyCounts[status]++;
            } else {
                dailyCounts.Absent++;
            }
        });

        return { date: format(date, 'EEE'), ...dailyCounts };
    });
  }, [rawAttendance, attendanceDateFilter, studentIdsInTeacherClasses]);

  // Performance Chart Data
  const publishedExams = useMemo(() => exams.filter(e => e.status === 'Published'), [exams]);

  React.useEffect(() => {
    if (!performanceExamFilter && publishedExams.length > 0) {
      setPerformanceExamFilter(publishedExams[0].id);
    }
  }, [publishedExams, performanceExamFilter]);

  const topPerformers = useMemo(() => {
    if (!performanceExamFilter) return [];
    const scores = grades
      .filter(g => g.examId === performanceExamFilter && studentIdsInTeacherClasses.has(g.studentId))
      .map(g => ({ studentId: g.studentId, total: (g.classScore * 0.5) + (g.examScore * 0.5) }));
    
    // Aggregate scores if a student took multiple subjects
    const aggregatedScores = Array.from(
        scores.reduce((acc, { studentId, total }) => {
            if (!acc.has(studentId)) acc.set(studentId, { sum: 0, count: 0 });
            const current = acc.get(studentId)!;
            current.sum += total;
            current.count++;
            return acc;
        }, new Map<string, { sum: number, count: number}>()).entries()
    ).map(([studentId, {sum, count}]) => ({ studentId, average: sum / count }));


    return aggregatedScores
        .sort((a,b) => b.average - a.average)
        .slice(0, 5)
        .map(s => ({
            name: studentsMap.get(s.studentId)?.name || "N/A",
            score: parseFloat(s.average.toFixed(2)),
            avatarUrl: studentsMap.get(s.studentId)?.avatarUrl
        }));

  }, [grades, performanceExamFilter, studentIdsInTeacherClasses, studentsMap]);


  // Notice Board Data
  const noticeBoardItems = useMemo(() => {
    const items = [
      ...permissionSlips.filter(p => studentIdsInTeacherClasses.has(p.studentId)).map(p => ({
        id: p.id,
        type: 'permission',
        text: `${p.studentName} submitted a leave request.`,
        date: p.createdAt,
        icon: <MailCheck className="h-4 w-4 text-blue-500" />
      }))
    ];
    return items.sort((a,b) => b.date - a.date).slice(0,3);
  }, [permissionSlips, studentIdsInTeacherClasses]);


  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const names = name.split(' ');
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
  }
  
  const attendanceChartConfig = { 
      Present: { label: "Present", color: "hsl(var(--chart-2))" }, 
      Absent: { label: "Absent", color: "hsl(var(--chart-5))" },
      Late: { label: "Late", color: "hsl(var(--chart-4))" },
      Excused: { label: "Excused", color: "hsl(var(--chart-3))" }
  };
  const performanceChartConfig = { score: { label: "Avg. Score", color: "hsl(var(--chart-1))" }};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}! Here's your overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <Card className="bg-blue-50 dark:bg-blue-900/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">My Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600"/>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{teacherClasses.length}</div></CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-green-600"/>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalStudents}</div></CardContent>
            </Card>
            <Card className="bg-orange-50 dark:bg-orange-900/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Subjects Taught</CardTitle>
                    <BookCopy className="h-4 w-4 text-orange-600"/>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{teacherSubjects.length}</div></CardContent>
            </Card>
             <Card className="bg-purple-50 dark:bg-purple-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1"><Link href="/dashboard/attendance"><ClipboardCheck className="h-4 w-4"/> Attendance</Link></Button>
                    <Button asChild size="sm" variant="outline" className="flex-1"><Link href="/dashboard/exams/grading"><Edit className="h-4 w-4"/> Grading</Link></Button>
                </CardContent>
            </Card>
          </>
        )}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Class Attendance</CardTitle>
                            <CardDescription>A summary of student attendance in your classes.</CardDescription>
                        </div>
                        <Select value={attendanceDateFilter} onValueChange={setAttendanceDateFilter}>
                            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last7days">Last 7 Days</SelectItem>
                                <SelectItem value="thisWeek">This Week</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={attendanceChartConfig} className="h-[200px] w-full">
                            <RechartsBarChart data={attendanceData} accessibilityLayer stackOffset="expand">
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}/>
                                <YAxis tickFormatter={(value) => `${value * 100}%`} />
                                <Tooltip content={<ChartTooltipContent indicator="dot"/>}/>
                                <Legend />
                                <Bar dataKey="Present" fill="var(--color-Present)" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="Late" fill="var(--color-Late)" radius={[0, 0, 0, 0]} stackId="a" />
                                <Bar dataKey="Excused" fill="var(--color-Excused)" radius={[0, 0, 0, 0]} stackId="a" />
                                <Bar dataKey="Absent" fill="var(--color-Absent)" radius={[4, 4, 0, 0]} stackId="a" />
                            </RechartsBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center justify-between">
                         <div className="space-y-1">
                            <CardTitle>Top Student Performers</CardTitle>
                            <CardDescription>Average scores from the selected assessment.</CardDescription>
                        </div>
                        <Select value={performanceExamFilter} onValueChange={setPerformanceExamFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Exam..." /></SelectTrigger>
                            <SelectContent>
                                {publishedExams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {loading ? <Skeleton className="h-24 w-full" /> :
                        topPerformers.length > 0 ? topPerformers.map(performer => (
                            <div key={performer.name} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={performer.avatarUrl} />
                                    <AvatarFallback>{getInitials(performer.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{performer.name}</p>
                                     <Progress value={performer.score} className="h-2 mt-1" />
                                </div>
                                <span className="font-bold text-base">{performer.score}%</span>
                            </div>
                        )) : <p className="text-center text-sm text-muted-foreground py-4">No published results for this exam yet.</p>
                       }
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Recent Leave Requests</CardTitle>
                        <CardDescription>Latest permission slips from your students.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />) :
                        noticeBoardItems.length > 0 ? noticeBoardItems.map(p => {
                            const slip = permissionSlips.find(s => s.id === p.id);
                            if (!slip) return null;
                            const student = studentsMap.get(slip.studentId);
                            const statusIcons = { Pending: <Clock className="h-4 w-4 text-yellow-500" />, Approved: <MailCheck className="h-4 w-4 text-green-500"/>, Rejected: <XCircle className="h-4 w-4 text-red-500"/> };
                            return(
                                <div key={p.id} className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={student?.avatarUrl} />
                                        <AvatarFallback>{getInitials(student?.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{p.text}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(p.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                    {statusIcons[slip.status]}
                                </div>
                            )
                        }) : <p className="text-sm text-center text-muted-foreground py-8">No recent leave requests.</p>
                        }
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/permissions">View All Requests <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
       </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>What's next on the school calendar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? <Skeleton className="h-20 w-full" /> :
                    upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-4">
                             <div className="flex flex-col items-center justify-center p-2 h-12 w-12 bg-muted text-muted-foreground rounded-md">
                                <span className="text-xs font-bold">{format(parseISO(event.startDate), 'MMM')}</span>
                                <span className="text-lg font-bold">{format(parseISO(event.startDate), 'dd')}</span>
                            </div>
                            <p className="text-sm font-medium">{event.title}</p>
                        </div>
                    )) : <p className="text-sm text-center text-muted-foreground py-4">No upcoming events.</p>}
                </CardContent>
                <CardFooter>
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/events">View Full Calendar <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Announcements</CardTitle>
                    <CardDescription>Latest news and updates from the school.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     {loading ? <Skeleton className="h-20 w-full" /> :
                     recentAnnouncements.length > 0 ? recentAnnouncements.map(item => (
                         <div key={item.id}>
                             <h4 className="font-semibold text-sm">{item.title}</h4>
                             <p className="text-xs text-muted-foreground">{item.content.substring(0, 70)}...</p>
                         </div>
                     )) : <p className="text-sm text-center text-muted-foreground py-4">No recent announcements.</p>}
                </CardContent>
                 <CardFooter>
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/announcements">View All Announcements <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Notice Board</CardTitle>
                    <CardDescription>Recent activities from your students.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {loading ? <Skeleton className="h-20 w-full" /> :
                     noticeBoardItems.length > 0 ? noticeBoardItems.map(item => (
                         <div key={item.id} className="flex items-center gap-3">
                             <div className="p-2 bg-muted rounded-full text-muted-foreground">{item.icon}</div>
                             <div>
                                 <p className="text-sm">{item.text}</p>
                                 <p className="text-xs text-muted-foreground">{format(new Date(item.date), "PPP p")}</p>
                             </div>
                         </div>
                     )) : <p className="text-sm text-center text-muted-foreground py-4">No recent activities.</p>}
                </CardContent>
                 <CardFooter>
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/permissions">View All Activities <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>

    </div>
  );
}
