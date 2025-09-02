
"use client"

import * as React from "react";
import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar as CalendarIcon, ClipboardCheck, DollarSign, GraduationCap, Megaphone, User, School, Clock, MessageSquare } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { format, isFuture, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { Badge } from "../ui/badge";
import { cn, calculateGrade } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "@/components/ui/calendar"

// Data Types
type Student = { id: string; name: string; studentId: string; avatarUrl?: string; createdAt: number; };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; };
type Event = { id: string; title: string; startDate: string; };
type StudentFee = { id: string; studentId: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type Announcement = { id: string; title: string; content: string; createdAt: number; audience: 'school' | string; };
type Exam = { id: string; name: string; status: "Published" | "Grading" | "Upcoming" | "Ongoing" };
type StudentGrade = { id: string; examId: string; studentId: string; subjectId: string; classScore: number; examScore: number; };
type Subject = { id: string; name: string; };
type TimetableEntry = { subjectId: string; teacherId: string; };
type ClassTimetable = { id: string, [day: string]: { [timeSlot: string]: TimetableEntry | null } };
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceEntry = { status: AttendanceStatus, comment?: string };
type AttendanceRecord = Record<string, AttendanceEntry>;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type Message = { id: string; senderId: string; content: string; timestamp: number; read: boolean; };
type UserProfile = { id: string; name: string; avatarUrl?: string; role: 'student' | 'teacher' | 'admin' };


export function StudentDashboard() {
  const { user } = useAuth();
  const { data: students, loading: studentsLoading } = useDatabase<Student>('students');
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { data: events, loading: eventsLoading } = useDatabase<Event>('events');
  const { data: studentFees, loading: feesLoading } = useDatabase<StudentFee>('studentFees');
  const { data: announcements, loading: announcementsLoading } = useDatabase<Announcement>('announcements');
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>("subjects");
  const { data: timetables, loading: timetablesLoading } = useDatabase<ClassTimetable>("timetables");
  const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");
  const { data: messages, loading: messagesLoading } = useDatabase<Message>("messages");
  const { data: users, loading: usersLoading } = useDatabase<UserProfile>("users");

  const [attendanceDateRange, setAttendanceDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const loading = studentsLoading || classesLoading || eventsLoading || feesLoading || announcementsLoading || examsLoading || gradesLoading || subjectsLoading || timetablesLoading || attendanceLoading || messagesLoading || usersLoading;

  // Memoized calculations
  const student = React.useMemo(() => user ? students.find(s => s.id === user.uid) : null, [students, user]);
  const studentClass = React.useMemo(() => user ? classes.find(c => c.studentIds && c.studentIds[user.uid]) : null, [classes, user]);
  
  const upcomingEvents = React.useMemo(() => 
      [...events]
      .filter(e => isFuture(parseISO(e.startDate)))
      .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 2), 
  [events]);

  const myFees = React.useMemo(() => user ? studentFees.filter(f => f.studentId === user.uid) : [], [studentFees, user]);
  
  const feeStats = React.useMemo(() => {
    return myFees.reduce((acc, fee) => {
        acc.totalDue += fee.amountDue;
        acc.totalPaid += fee.amountPaid;
        return acc;
    }, { totalDue: 0, totalPaid: 0 });
  }, [myFees]);
  
  const outstandingFees = feeStats.totalDue - feeStats.totalPaid;
  
  const recentAnnouncements = React.useMemo(() => 
    [...announcements]
      .filter(a => a.audience === 'school' || a.audience === studentClass?.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2), 
  [announcements, studentClass]);

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

  const latestResults = React.useMemo(() => {
    const publishedExams = exams.filter(e => e.status === "Published").sort((a,b) => b.name.localeCompare(a.name));
    if (publishedExams.length === 0 || !user) return null;
    const latestExam = publishedExams[0];
    const results = grades
        .filter(g => g.examId === latestExam.id && g.studentId === user.uid)
        .map(g => ({
            ...g,
            subjectName: subjectsMap.get(g.subjectId) || "Unknown Subject",
            totalScore: (g.classScore * 0.5) + (g.examScore * 0.5),
        }));

    return {
        examName: latestExam.name,
        results: results
    }
  }, [exams, grades, user, subjectsMap]);
  
  const todaysSchedule = React.useMemo(() => {
    if (!studentClass || timetablesLoading) return [];
    const todayStr = format(new Date(), 'eeee'); // "Monday", "Tuesday", etc.
    const timetable = timetables.find(t => t.id === studentClass.id);
    if (!timetable || !timetable[todayStr]) return [];

    const schedule: { time: string, subject: string }[] = [];
    const daySchedule = timetable[todayStr];
    Object.entries(daySchedule).forEach(([time, entry]) => {
      if (entry?.subjectId) {
        schedule.push({
          time: time,
          subject: subjectsMap.get(entry.subjectId) || 'Unknown Subject',
        });
      }
    });
    return schedule.sort((a, b) => a.time.localeCompare(b.time));

  }, [timetables, studentClass, subjectsMap, timetablesLoading]);

  const attendanceStats = React.useMemo(() => {
    if (!user || attendanceLoading) return [];
    
    let totalDays = 0;
    const stats: Record<AttendanceStatus, number> = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    

    rawAttendance.forEach(dailyRecord => {
        const recordDate = parseISO(dailyRecord.id);

        if (attendanceDateRange?.from && attendanceDateRange?.to && isWithinInterval(recordDate, { start: attendanceDateRange.from, end: attendanceDateRange.to })) {
            if (!studentClass) return;
            const classRecord = dailyRecord[studentClass.id] as AttendanceRecord | undefined;
            if (classRecord && classRecord[user.uid]) {
              const studentStatus = classRecord[user.uid].status;
              if (studentStatus) {
                  stats[studentStatus]++;
                  totalDays++;
              }
            }
        }
    });

    if (totalDays === 0) return [];

    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      fill: `hsl(var(--chart-${Object.keys(stats).indexOf(name) + 1}))`,
      percentage: ((value / totalDays) * 100).toFixed(1)
    })).filter(item => item.value > 0);

  }, [rawAttendance, user, studentClass, attendanceDateRange, attendanceLoading]);
  
   const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
   const recentMessages = React.useMemo(() => {
    if (!user) return [];
    return messages
        .filter(m => m.read === false)
        .sort((a,b) => b.timestamp - a.timestamp)
        .slice(0, 3);
  }, [messages, user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
  }

  const gradesChartConfig = {
    totalScore: {
      label: "Total Score",
      color: "hsl(var(--primary))",
    },
  };
  
  const attendanceChartConfig = {
    value: { label: "Days" },
    Present: { label: "Present", color: "hsl(var(--chart-2))" },
    Absent: { label: "Absent", color: "hsl(var(--chart-5))" },
    Late: { label: "Late", color: "hsl(var(--chart-4))" },
    Excused: { label: "Excused", color: "hsl(var(--chart-1))" },
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1 space-y-4">
        {loading ? <Skeleton className="h-8 w-1/2"/> : <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>}
        {loading ? <Skeleton className="h-4 w-1/3 mt-2"/> : <p className="text-muted-foreground">Welcome back, {user?.displayName}!</p>}
      </div>
      
      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
          <CardHeader className="flex flex-row items-center gap-4">
              {loading ? <Skeleton className="h-16 w-16 rounded-full" /> : (
                 <Avatar className="h-16 w-16">
                    <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                    <AvatarFallback className="text-2xl">{getInitials(student?.name)}</AvatarFallback>
                  </Avatar>
              )}
              <div className="grid gap-1">
                {loading ? <Skeleton className="h-7 w-48" /> : <CardTitle className="text-2xl">{student?.name}</CardTitle> }
                {loading ? <Skeleton className="h-5 w-32" /> : <CardDescription>ID: {student?.studentId || 'N/A'}</CardDescription>}
              </div>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Class</p>
                    {loading ? <Skeleton className="h-5 w-24 mt-1"/> : <p className="font-semibold">{studentClass?.name || 'Not Assigned'}</p> }
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date Registered</p>
                     {loading ? <Skeleton className="h-5 w-24 mt-1"/> : <p className="font-semibold">{student?.createdAt ? format(student.createdAt, 'MMM d, yyyy') : 'N/A'}</p> }
                  </div>
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Financial Overview</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-2/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-blue-600 font-medium">Total Fees</span>
                  <span className="text-lg font-bold text-blue-600">GH₵{feeStats.totalDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-green-600 font-medium">Fees Paid</span>
                  <span className="text-lg font-bold text-green-600">GH₵{feeStats.totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-red-600 font-medium">Outstanding</span>
                  <span className="text-lg font-bold text-red-600">GH₵{outstandingFees.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-full" /> : (
              upcomingEvents.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {upcomingEvents.map(e => <li key={e.id} className="flex justify-between"><span>{e.title}</span> <span>{format(parseISO(e.startDate), 'MMM dd')}</span></li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            {/* Grades Chart */}
            <Card>
              <CardHeader>
                <CardTitle>My Grades Overview</CardTitle>
                <CardDescription>{loading ? <Skeleton className="h-5 w-1/3"/> : `Results from the latest exam: ${latestResults?.examName || 'N/A'}`}</CardDescription>
              </CardHeader>
              <CardContent>
                 {loading ? <Skeleton className="h-[250px] w-full" /> : !latestResults || latestResults.results.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-8">No results have been published for the latest exam yet.</p>
                 ) : (
                    <ChartContainer config={gradesChartConfig} className="h-[250px] w-full">
                      <LineChart data={latestResults.results} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subjectName" tick={{fontSize: 12}} interval={0} angle={-30} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip content={<ChartTooltipContent formatter={(value) => `${(value as number).toFixed(1)}%`} indicator="dot"/>}/>
                        <Line type="monotone" dataKey="totalScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, style: { stroke: "hsl(var(--primary))" }}}/>
                      </LineChart>
                    </ChartContainer>
                 )}
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/exams/my-results">View All My Results <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Attendance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Summary</CardTitle>
                    <CardDescription>Your attendance record for the selected period.</CardDescription>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant={cn(attendanceDateRange?.from === startOfWeek(new Date()) ? 'default' : 'outline')} onClick={() => setAttendanceDateRange({ from: startOfWeek(new Date()), to: endOfWeek(new Date())})}>This Week</Button>
                        <Button size="sm" variant={cn(attendanceDateRange?.from === startOfMonth(new Date()) ? 'default' : 'outline')} onClick={() => setAttendanceDateRange({ from: startOfMonth(new Date()), to: new Date() })}>This Month</Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="sm" variant="outline"><CalendarIcon className="mr-2 h-4 w-4" /> Custom Range</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={attendanceDateRange?.from}
                                    selected={attendanceDateRange}
                                    onSelect={setAttendanceDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-[200px] w-full"/> : attendanceStats.length > 0 ? (
                        <ChartContainer config={attendanceChartConfig} className="h-[200px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Tooltip
                                    content={<ChartTooltipContent 
                                        nameKey="name" 
                                        formatter={(value, name) => `${value} days (${(attendanceStats.find(s=>s.name === name))?.percentage}%)`}
                                    />}
                                />
                                <Pie data={attendanceStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percentage }) => `${name} ${percentage}%`} >
                                    {attendanceStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : (
                         <p className="text-sm text-center text-muted-foreground py-8">No attendance records found for this period.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
            {/* Today's Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>{format(new Date(), "eeee, MMMM d")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? <Skeleton className="h-32 w-full" /> : todaysSchedule.length > 0 ? (
                         todaysSchedule.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center p-2 h-12 w-20 bg-muted text-muted-foreground rounded-md">
                                    <span className="text-xs font-bold">{item.time.split('-')[0]}</span>
                                    <span className="text-xs text-muted-foreground">{item.time.split('-')[1]}</span>
                                </div>
                                <p className="text-sm font-semibold">{item.subject}</p>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                            <Clock className="h-8 w-8 mb-2"/>
                            <p>No classes scheduled for today.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/timetable">View Full Timetable <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardFooter>
            </Card>

             {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                     <Button asChild variant="outline"><Link href="/dashboard/attendance"><ClipboardCheck/>Attendance</Link></Button>
                     <Button asChild variant="outline"><Link href="/dashboard/fees/my-fees"><DollarSign/>My Fees</Link></Button>
                     <Button asChild variant="outline"><Link href="/dashboard/exams/my-results"><GraduationCap/>Results</Link></Button>
                     <Button asChild variant="outline"><Link href={`/dashboard/students/${user?.uid}`}><User/>Profile</Link></Button>
                </CardContent>
            </Card>

            {/* New Messages Card */}
            <Card>
              <CardHeader>
                <CardTitle>New Messages</CardTitle>
                <CardDescription>Recent unread conversations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <Skeleton className="h-20 w-full" /> : recentMessages.length > 0 ? (
                  recentMessages.map(msg => {
                    const sender = usersMap.get(msg.senderId);
                    return (
                        <div key={msg.id} className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={sender?.avatarUrl} />
                                <AvatarFallback>{getInitials(sender?.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{sender?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}</p>
                            </div>
                        </div>
                    )
                  })
                ) : <p className="text-sm text-center text-muted-foreground py-4">No new messages.</p>}
              </CardContent>
               <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/messages">View All Messages <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Latest news and updates for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <Skeleton className="h-20 w-full" /> : recentAnnouncements.length > 0 ? (
                  recentAnnouncements.map(ann => (
                    <div key={ann.id} className="flex items-start gap-4">
                        <div className="p-2 bg-muted rounded-full text-muted-foreground mt-1"><Megaphone className="h-4 w-4" /></div>
                        <div>
                            <p className="font-semibold text-sm">{ann.title}</p>
                            <p className="text-xs text-muted-foreground">{ann.content}</p>
                        </div>
                    </div>
                  ))
                ) : <p className="text-sm text-center text-muted-foreground py-4">No new announcements.</p>}
              </CardContent>
               <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/announcements">View All Announcements <ArrowRight className="ml-2 h-4 w-4"/></Link>
                </Button>
              </CardFooter>
            </Card>

        </div>
      </div>
    </div>
  );
}
