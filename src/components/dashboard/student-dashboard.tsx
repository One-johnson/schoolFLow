
"use client"

import * as React from "react";
import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, ClipboardCheck, DollarSign, GraduationCap, Megaphone, User, School, Clock } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { format, isFuture, parseISO } from 'date-fns';
import { Badge } from "../ui/badge";
import { cn, calculateGrade } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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

  const loading = studentsLoading || classesLoading || eventsLoading || feesLoading || announcementsLoading || examsLoading || gradesLoading || subjectsLoading || timetablesLoading;

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
  const outstandingFees = React.useMemo(() => myFees.reduce((acc, fee) => acc + (fee.amountDue - fee.amountPaid), 0), [myFees]);
  
  const recentAnnouncements = React.useMemo(() => 
    [...announcements]
      .filter(a => a.audience === 'school' || a.audience === studentClass?.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 2), 
  [announcements, studentClass]);

  const subjectsMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const teachersMap = React.useMemo(() => new Map(subjects.map(s => [s.id, s.teacherId])), [subjects]);

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
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-1/2" /> : <div className="text-2xl font-bold">GH₵{outstandingFees.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>My Grades Overview</CardTitle>
                <CardDescription>{loading ? <Skeleton className="h-5 w-1/3"/> : `Results from the latest exam: ${latestResults?.examName || 'N/A'}`}</CardDescription>
              </CardHeader>
              <CardContent>
                 {loading ? <Skeleton className="h-24 w-full" /> : !latestResults || latestResults.results.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-8">No results have been published for the latest exam yet.</p>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {latestResults.results.map(res => {
                            const { grade, remarks } = calculateGrade(res.totalScore);
                            return (
                                <div key={res.id} className="p-3 rounded-lg border text-center">
                                    <p className="font-semibold text-sm">{res.subjectName}</p>
                                    <p className="text-2xl font-bold">{res.totalScore}%</p>
                                    <Badge variant="secondary">{grade}</Badge>
                                </div>
                            )
                        })}
                    </div>
                 )}
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/exams/my-results">View All My Results <ArrowRight className="ml-2 h-4 w-4"/></Link>
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
        </div>
      </div>
    </div>
  );
}
