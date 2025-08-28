
"use client"

import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Users, BookCopy, ArrowRight, ClipboardCheck, Edit, MailCheck, Clock, XCircle, User as UserIcon, Calendar, Contact, Briefcase, CalendarClock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "../ui/image-upload";
import { Loader2 } from "lucide-react";

// Data Types
type Teacher = { id: string; name: string; email: string; status: "Active" | "On Leave" | "Retired"; dateOfBirth?: string; academicQualification?: string; dateOfEmployment?: string; contact?: string; department?: string; employmentType?: "Full Time" | "Part Time" | "Contract"; gender?: "Male" | "Female" | "Other"; address?: string; avatarUrl?: string; teacherId?: string; };
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
type TimetableEntry = { subjectId: string; teacherId: string; };
type ClassTimetable = { id: string, [day: string]: { [timeSlot: string]: TimetableEntry | null } };


export function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: allTeachers, loading: teachersLoading, updateData: updateTeacher, uploadFile } = useDatabase<Teacher>("teachers");
  const { data: classes, loading: classesLoading } = useDatabase<Class>('classes');
  const { data: subjects, loading: subjectsLoading } = useDatabase<Subject>('subjects');
  const { data: students, loading: studentsLoading } = useDatabase<Student>('students');
  const { data: announcements, loading: announcementsLoading } = useDatabase<Announcement>('announcements');
  const { data: events, loading: eventsLoading } = useDatabase<Event>('events');
  const { data: permissionSlips, loading: permissionsLoading } = useDatabase<PermissionSlip>("permissionSlips");
  const { data: exams, loading: examsLoading } = useDatabase<Exam>("exams");
  const { data: grades, loading: gradesLoading } = useDatabase<StudentGrade>("studentGrades");
  const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");
  const { data: timetables, loading: timetablesLoading } = useDatabase<ClassTimetable>("timetables");
  
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loading = classesLoading || subjectsLoading || studentsLoading || announcementsLoading || eventsLoading || permissionsLoading || examsLoading || gradesLoading || attendanceLoading || teachersLoading || timetablesLoading;

  const [attendanceDateFilter, setAttendanceDateFilter] = useState('last7days');
  const [performanceExamFilter, setPerformanceExamFilter] = useState<string | undefined>();
  
  // Memoized data calculations
  const teacher = useMemo(() => user ? allTeachers.find(t => t.id === user.uid) : null, [allTeachers, user]);
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
  const subjectsMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const classesMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  const [editTeacherState, setEditTeacherState] = useState<Partial<Teacher>>({});

  React.useEffect(() => {
    if (teacher) {
        setEditTeacherState(teacher);
    }
  }, [teacher]);

  const handleProfileUpdate = async () => {
      if(!teacher) return;
      setIsUpdating(true);
      try {
        await updateTeacher(teacher.id, {
            name: editTeacherState.name,
            contact: editTeacherState.contact,
        });
        toast({ title: "Success", description: "Your profile has been updated."});
        setIsProfileDialogOpen(false);
      } catch(e) {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive"});
        console.error(e);
      } finally {
        setIsUpdating(false);
      }
  }

  const handleAvatarChange = async (file: File | null) => {
    if(!file || !teacher) return;
    setIsUpdating(true);
    try {
        const url = await uploadFile(file, `avatars/teachers/${teacher.id}_${file.name}`);
        await updateTeacher(teacher.id, { avatarUrl: url });
        setEditTeacherState(p => ({...p, avatarUrl: url }));
        toast({ title: "Avatar updated successfully" });
    } catch(e) {
        toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  }

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
  
  // Today's Schedule Data
  const todaysSchedule = useMemo(() => {
    if (!user || timetablesLoading) return [];
    const todayStr = format(new Date(), 'eeee'); // "Monday", "Tuesday", etc.
    const schedule: { time: string, subject: string, class: string }[] = [];
    
    timetables.forEach(tt => {
      const daySchedule = tt[todayStr];
      if (daySchedule) {
        Object.entries(daySchedule).forEach(([time, entry]) => {
          if (entry?.teacherId === user.uid) {
            schedule.push({
              time: time,
              subject: subjectsMap.get(entry.subjectId) || 'Unknown Subject',
              class: classesMap.get(tt.id) || 'Unknown Class'
            });
          }
        });
      }
    });

    return schedule.sort((a, b) => a.time.localeCompare(b.time));
  }, [timetables, user, subjectsMap, classesMap, timetablesLoading]);


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
    <>
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}! Here's your overview.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={teacher?.avatarUrl} />
                    <AvatarFallback className="text-2xl">{getInitials(teacher?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>{teacher?.name}</CardTitle>
                    <CardDescription>{teacher?.teacherId}</CardDescription>
                    <Badge variant="outline" className="mt-2">{teacher?.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4"/>
                    <span>Class Teacher for <b>{teacherClasses[0]?.name || 'N/A'}</b></span>
                 </div>
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <BookCopy className="h-4 w-4"/>
                    <span>Teaches <b>{teacherSubjects.length}</b> subjects</span>
                 </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" variant="outline" onClick={() => setIsProfileDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4"/> Edit Profile
                </Button>
            </CardFooter>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Your essential tools, just a click away.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/attendance">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <ClipboardCheck className="h-8 w-8 text-blue-600 mx-auto"/>
                        <p className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-200">Take Attendance</p>
                    </div>
                </Link>
                <Link href="/dashboard/exams/grading">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-center hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                        <Edit className="h-8 w-8 text-green-600 mx-auto"/>
                        <p className="mt-2 text-sm font-medium text-green-800 dark:text-green-200">Enter Grades</p>
                    </div>
                </Link>
                <Link href="/dashboard/permissions">
                     <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-center hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors">
                        <MailCheck className="h-8 w-8 text-yellow-600 mx-auto"/>
                        <p className="mt-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">Leave Requests</p>
                    </div>
                </Link>
                <Link href="/dashboard/timetable">
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                        <Calendar className="h-8 w-8 text-purple-600 mx-auto"/>
                        <p className="mt-2 text-sm font-medium text-purple-800 dark:text-purple-200">My Timetable</p>
                    </div>
                </Link>
            </CardContent>
          </Card>
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
                    <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{permissionSlips.filter(p => studentIdsInTeacherClasses.has(p.studentId) && p.status === 'Pending').length}</div></CardContent>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Schedule</CardTitle>
                        <CardDescription>{format(new Date(), "eeee, MMMM d")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loading ? <Skeleton className="h-24 w-full" /> :
                        todaysSchedule.length > 0 ? (
                            todaysSchedule.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center p-2 h-12 w-14 bg-muted text-muted-foreground rounded-md">
                                        <span className="text-xs font-bold">{item.time.split('-')[0]}</span>
                                        <span className="text-xs text-muted-foreground">{item.time.split('-')[1]}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{item.subject}</p>
                                        <p className="text-xs text-muted-foreground">{item.class}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4">
                                <CalendarClock className="h-8 w-8 mb-2"/>
                                <p>No classes scheduled for today.</p>
                            </div>
                        )}
                    </CardContent>
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
    </div>
    <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>Update your personal information below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Avatar</Label>
                    <div className="col-span-3">
                        <ImageUpload
                            currentImage={editTeacherState.avatarUrl}
                            onFileChange={handleAvatarChange}
                            disabled={isUpdating}
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input className="col-span-3" value={editTeacherState.name || ''} onChange={(e) => setEditTeacherState(p => ({...p, name: e.target.value}))} disabled={isUpdating}/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Contact</Label>
                    <Input className="col-span-3" value={editTeacherState.contact || ''} onChange={(e) => setEditTeacherState(p => ({...p, contact: e.target.value}))} disabled={isUpdating}/>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleProfileUpdate} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
