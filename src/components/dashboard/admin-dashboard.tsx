
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Megaphone, BookOpen, Users, UserCheck, DollarSign, Activity, Landmark, UserPlus, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useDatabase } from "@/hooks/use-database";
import { useMemo, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isFuture } from "date-fns";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";


type Student = { id: string; name: string; createdAt: number, gender?: 'Male' | 'Female' | 'Other' };
type Teacher = { id: string; name: string; createdAt: number };
type Class = { id: string; name: string, studentIds?: Record<string, boolean> };
type Event = { id: string; title: string, startDate: string };
type StudentFee = { id: string; amountDue: number; amountPaid: number; status: "Paid" | "Unpaid" | "Partial"; };
type AttendanceRecord = Record<string, "Present" | "Absent" | "Late" | "Excused">;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type Notification = { id: string, message: string, createdAt: number, type: string };
type Subject = { id: string; name: string; teacherId?: string; };

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
  const { data: subjects } = useDatabase<Subject>('subjects');
  const { data: events } = useDatabase<Event>('events');
  const { data: studentFees } = useDatabase<StudentFee>('studentFees');
  const { data: rawAttendance } = useDatabase<DailyAttendance>(`attendance`);
  const { data: notifications } = useDatabase<Notification>("notifications");

  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('last7days');

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  
  const unassignedStudents = useMemo(() => {
      const assignedStudentIds = new Set<string>();
      classes.forEach(c => {
          if (c.studentIds) {
              Object.keys(c.studentIds).forEach(id => assignedStudentIds.add(id));
          }
      });
      return students.filter(s => !assignedStudentIds.has(s.id)).length;
  }, [students, classes]);
  
  const unassignedTeachers = useMemo(() => {
      const assignedTeacherIds = new Set<string>();
      subjects.forEach(s => {
        if(s.teacherId) {
            assignedTeacherIds.add(s.teacherId);
        }
      });
      return teachers.filter(t => !assignedTeacherIds.has(t.id)).length;
  }, [teachers, subjects]);


  const studentIdsInClasses = useMemo(() => {
    const ids = new Set<string>();
    classes.forEach(c => {
        if(c.studentIds) {
            Object.keys(c.studentIds).forEach(id => ids.add(id));
        }
    });
    return ids;
  }, [classes]);

  const feeStats = useMemo(() => {
    return studentFees.reduce((acc, fee) => {
        acc.totalPaid += fee.amountPaid;
        acc.totalDue += fee.amountDue;
        return acc;
    }, { totalPaid: 0, totalDue: 0 });
  }, [studentFees]);
  
  const totalFeesOwed = feeStats.totalDue - feeStats.totalPaid;

  const recentActivity = useMemo(() => {
    return [...notifications].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [notifications]);
  
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(e => isFuture(parseISO(e.startDate)))
      .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }, [events]);

  const genderDistribution = useMemo(() => {
    const distribution = students.reduce((acc, student) => {
      const gender = student.gender || 'Other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Male', value: distribution['Male'] || 0, fill: 'hsl(var(--chart-1))' },
      { name: 'Female', value: distribution['Female'] || 0, fill: 'hsl(var(--chart-2))' },
      { name: 'Other', value: distribution['Other'] || 0, fill: 'hsl(var(--chart-3))' },
    ]
  }, [students]);

  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  const classEnrollment = useMemo(() => {
    return classes.map(c => {
      let male = 0;
      let female = 0;
      let other = 0;
      if (c.studentIds) {
        Object.keys(c.studentIds).forEach(studentId => {
          const student = studentsMap.get(studentId);
          if (student) {
            if (student.gender === 'Male') male++;
            else if (student.gender === 'Female') female++;
            else other++;
          }
        });
      }
      return {
        name: c.name,
        male,
        female,
        other,
      };
    }).sort((a,b) => (b.male + b.female + b.other) - (a.male + a.female + a.other));
  }, [classes, studentsMap]);


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
      let presentCount = 0;
      let absentCount = 0;

      const relevantStudentIds = new Set<string>();
      if (attendanceClassFilter === 'all') {
        studentIdsInClasses.forEach(id => relevantStudentIds.add(id));
      } else {
        const specificClass = classes.find(c => c.id === attendanceClassFilter);
        if (specificClass?.studentIds) {
          Object.keys(specificClass.studentIds).forEach(id => relevantStudentIds.add(id));
        }
      }

      const dailyStatuses: { [studentId: string]: string } = {};

      if (todaysLog) {
        Object.entries(todaysLog).forEach(([classId, classRecords]) => {
          if (classId === 'id' || (attendanceClassFilter !== 'all' && classId !== attendanceClassFilter)) return;
          if (typeof classRecords === 'object' && classRecords !== null) {
            Object.entries(classRecords).forEach(([studentId, status]) => {
              if (relevantStudentIds.has(studentId)) {
                dailyStatuses[studentId] = status;
              }
            });
          }
        });
      }

      relevantStudentIds.forEach(studentId => {
        const status = dailyStatuses[studentId];
        if (status === 'Present' || status === 'Late' || status === 'Excused') {
          presentCount++;
        } else {
          absentCount++;
        }
      });
      
      return {
        date: format(date, 'EEE'),
        present: presentCount,
        absent: absentCount,
      };
    });
  }, [rawAttendance, attendanceClassFilter, attendanceDateFilter, classes, studentIdsInClasses]);


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  const MotionCard = motion(Card);

  const DashboardCard = ({ title, icon, value, description, i }: { title: string, icon: React.ReactNode, value: string | number, description: string, i: number }) => (
    <MotionCard
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={i}
        whileHover={{ y: -5, scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </MotionCard>
  );

  const chartConfig = {
    present: { label: "Present", color: "hsl(var(--chart-2))" },
    absent: { label: "Absent", color: "hsl(var(--chart-5))" },
    male: { label: "Male", color: "hsl(var(--chart-1))" },
    female: { label: "Female", color: "hsl(var(--chart-3))" },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a live overview of your school.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <DashboardCard i={0} title="Total Students" icon={<Users className="h-4 w-4 text-muted-foreground" />} value={totalStudents} description="Currently enrolled" />
        <DashboardCard i={1} title="Total Teachers" icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} value={totalTeachers} description="On staff" />
        <DashboardCard i={2} title="Total Classes" icon={<Landmark className="h-4 w-4 text-muted-foreground" />} value={totalClasses} description="Across all grades" />
        <DashboardCard i={4} title="Fees Collected" icon={<TrendingUp className="h-4 w-4 text-green-600" />} value={`GH₵${feeStats.totalPaid.toLocaleString()}`} description="Total payments received" />
        <DashboardCard i={5} title="Fees Owed" icon={<TrendingDown className="h-4 w-4 text-red-600" />} value={`GH₵${totalFeesOwed.toLocaleString()}`} description="Outstanding balance" />
        <DashboardCard i={3} title="Total Revenue" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} value={`GH₵${feeStats.totalDue.toLocaleString()}`} description="Total fees generated" />
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4} className="col-span-full lg:col-span-4">
           <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Weekly Attendance</CardTitle>
                        <CardDescription>Present vs. Absent students.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                         <Select value={attendanceDateFilter} onValueChange={setAttendanceDateFilter}>
                            <SelectTrigger className="w-[140px]"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last7days">Last 7 Days</SelectItem>
                                <SelectItem value="thisWeek">This Week</SelectItem>
                            </SelectContent>
                         </Select>
                         <Select value={attendanceClassFilter} onValueChange={setAttendanceClassFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by class..."/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All School</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                     </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={attendanceData} accessibilityLayer>
                        <CartesianGrid vertical={false}/>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}/>
                        <YAxis/>
                        <Tooltip content={<ChartTooltipContent indicator="dot"/>}/>
                        <Legend />
                        <Bar dataKey="present" fill="var(--color-present)" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="absent" fill="var(--color-absent)" radius={[4, 4, 0, 0]} stackId="a" />
                    </BarChart>
                </ChartContainer>
            </CardContent>
           </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5} className="col-span-full lg:col-span-3">
          <Card>
             <CardHeader>
                <CardTitle>Student Demographics</CardTitle>
                <CardDescription>Distribution of students by gender.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                   <ResponsiveContainer>
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel/>}/>
                            <Pie data={genderDistribution} dataKey="value" nameKey="name" innerRadius="50%">
                               {genderDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                             <Legend content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        </PieChart>
                   </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={6} className="xl:col-span-1">
                 <CardHeader>
                    <CardTitle>Administrative Actions</CardTitle>
                    <CardDescription>Quick links and data health checks.</CardDescription>
                 </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/students"><UserPlus className="mr-2"/> Add Student</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/teachers"><UserCheck className="mr-2"/> Add Teacher</Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/dashboard/classes"><BookOpen className="mr-2"/> Create Class</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/announcements"><Megaphone className="mr-2"/> New Announcement</Link>
                    </Button>
                    <Link href="/dashboard/students" className="block col-span-1">
                        <Card className="bg-amber-50 dark:bg-amber-900/30 hover:shadow-md transition-shadow">
                            <CardHeader className="p-4">
                                <CardTitle className="flex items-center text-base"><AlertCircle className="mr-2 text-amber-600"/>Unassigned Students</CardTitle>
                                <p className="text-2xl font-bold">{unassignedStudents}</p>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/dashboard/subjects" className="block col-span-1">
                        <Card className="bg-amber-50 dark:bg-amber-900/30 hover:shadow-md transition-shadow">
                             <CardHeader className="p-4">
                                <CardTitle className="flex items-center text-base"><AlertCircle className="mr-2 text-amber-600"/>Unassigned Teachers</CardTitle>
                                <p className="text-2xl font-bold">{unassignedTeachers}</p>
                            </CardHeader>
                        </Card>
                    </Link>
                </CardContent>
            </MotionCard>
             <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={7} className="xl:col-span-2">
                 <CardHeader>
                    <CardTitle>Class Enrollment Breakdown</CardTitle>
                     <CardDescription>Number of male and female students per class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart data={classEnrollment} layout="vertical" margin={{ left: 10, right: 20 }} stackOffset="sign">
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} className="text-xs w-20 truncate"/>
                            <XAxis type="number" hide />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                            <Legend />
                            <Bar dataKey="male" fill="var(--color-male)" radius={[0, 4, 4, 0]} stackId="a" />
                            <Bar dataKey="female" fill="var(--color-female)" radius={[0, 4, 4, 0]} stackId="a" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </MotionCard>
        </div>

       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={8}>
                 <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                     <CardDescription>A log of recent important system events.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {recentActivity.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full text-muted-foreground">{iconMap[item.type] || iconMap.default}</div>
                                <div>
                                    <p className="text-sm">{item.message}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "PPP p")}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </CardContent>
            </MotionCard>
             <MotionCard variants={cardVariants} initial="hidden" animate="visible" custom={9}>
                 <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                     <CardDescription>What's next on the school calendar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center p-2 h-12 w-12 bg-muted text-muted-foreground rounded-md">
                                    <span className="text-xs font-bold">{format(parseISO(event.startDate), 'MMM')}</span>
                                    <span className="text-lg font-bold">{format(parseISO(event.startDate), 'dd')}</span>
                                </div>
                                <p className="text-sm font-medium">{event.title}</p>
                            </div>
                        ))}
                         {upcomingEvents.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No upcoming events found.</p>
                         )}
                    </div>
                </CardContent>
            </MotionCard>
        </div>
    </div>
  );
}
