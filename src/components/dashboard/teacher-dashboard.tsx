
"use client"

import { useAuth } from "@/hooks/use-auth"
import { useDatabase } from "@/hooks/use-database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Users, BookCopy, Calendar, Megaphone, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { format, parseISO, isFuture } from 'date-fns';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Class = { id: string; name: string; teacherId?: string; studentIds?: Record<string, boolean>; };
type Subject = { id: string; name: string; teacherIds?: Record<string, boolean>; };
type Announcement = { id: string; title: string; content: string; createdAt: number; };
type Event = { id: string; title: string; startDate: string; };


export function TeacherDashboard() {
  const { user } = useAuth();
  const { data: classes } = useDatabase<Class>('classes');
  const { data: subjects } = useDatabase<Subject>('subjects');
  const { data: announcements } = useDatabase<Announcement>('announcements');
  const { data: events } = useDatabase<Event>('events');

  const teacherClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter(c => c.teacherId === user.uid);
  }, [classes, user]);

  const teacherSubjects = useMemo(() => {
    if (!user) return [];
    return subjects.filter(s => s.teacherIds && s.teacherIds[user.uid]);
  }, [subjects, user]);

  const totalStudents = useMemo(() => {
    return teacherClasses.reduce((acc, c) => acc + (c.studentIds ? Object.keys(c.studentIds).length : 0), 0);
  }, [teacherClasses]);
  
  const recentAnnouncements = useMemo(() => {
      return [...announcements].sort((a,b) => b.createdAt - a.createdAt).slice(0, 3);
  }, [announcements]);
  
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(e => isFuture(parseISO(e.startDate)))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}! Here's what's happening today.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{teacherClasses.length}</div>
                    <p className="text-xs text-muted-foreground">classes assigned as form master</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalStudents}</div>
                     <p className="text-xs text-muted-foreground">students in your classes</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subjects Taught</CardTitle>
                    <BookCopy className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{teacherSubjects.length}</div>
                     <p className="text-xs text-muted-foreground">subjects assigned to teach</p>
                </CardContent>
            </Card>
       </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Card className="col-span-full lg:col-span-4">
                <CardHeader>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>A list of classes you are the form master for.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                        {teacherClasses.length > 0 ? teacherClasses.map(c => (
                            <Link key={c.id} href={`/dashboard/students?class=${c.id}`}>
                                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent hover:text-accent-foreground">
                                    <span className="font-medium">{c.name}</span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span>{c.studentIds ? Object.keys(c.studentIds).length : 0} Students</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground text-center py-4">You are not assigned as a form master to any class.</p>}
                   </div>
                </CardContent>
            </Card>
             <Card className="col-span-full lg:col-span-3">
                <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>Key dates from the school calendar.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center p-2 h-12 w-12 bg-muted text-muted-foreground rounded-md">
                                    <span className="text-xs font-bold uppercase">{format(parseISO(event.startDate), 'MMM')}</span>
                                    <span className="text-lg font-bold">{format(parseISO(event.startDate), 'dd')}</span>
                                </div>
                                <p className="text-sm font-medium">{event.title}</p>
                            </div>
                        ))}
                         {upcomingEvents.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No upcoming events scheduled.</p>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone/> Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {recentAnnouncements.length > 0 ? recentAnnouncements.map(ann => (
                    <div key={ann.id} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">{ann.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{ann.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(ann.createdAt), 'PPP')}</p>
                    </div>
                )) : <p className="text-sm text-center text-muted-foreground py-4">No recent announcements.</p>}
                <div className="flex justify-end">
                    <Button variant="link" asChild>
                        <Link href="/dashboard/announcements">View All Announcements <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
