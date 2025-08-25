
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
import { Megaphone, BookOpen, Users, UserCheck, DollarSign, CalendarCheck, Activity, Landmark, Users2, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useDatabase } from "@/hooks/use-database";
import { useMemo, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type Student = { id: string; name: string; createdAt: number, gender?: 'Male' | 'Female' | 'Other' };
type Teacher = { id: string; name: string; createdAt: number };
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

  const [attendanceClassFilter, setAttendanceClassFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('last7days');

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  
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
    }, { totalPaid: 0, totalDue: 0, totalOwed: 0 });
  }, [studentFees]);
  
  const totalFeesOwed = feeStats.totalDue - feeStats.totalPaid;

  const recentActivity = useMemo(() => {
    return [...notifications].sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [notifications]);
  
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

  const attendanceData = useMemo(() => {
    const today = new Date();
    let startDate;

    if (attendanceDateFilter === 'thisWeek') {
        startDate = startOfWeek(today, { weekStartsOn: 1});
    } else { // last7days
        startDate = subDays(today, 6);
    }
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: today });
    
    return dateInterval.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const todaysLog = rawAttendance.find(log => log.id === dateStr);
        let presentCount = 0;
        let totalCount = 0;

        if (attendanceClassFilter === 'all') {
            totalCount = studentIdsInClasses.size;
        } else {
            const specificClass = classes.find(c => c.id === attendanceClassFilter);
            totalCount = specificClass?.studentIds ? Object.keys(specificClass.studentIds).length : 0;
        }

        if (todaysLog && totalCount > 0) {
            Object.entries(todaysLog).forEach(([classId, classRecords]) => {
                if(classId === 'id' || (attendanceClassFilter !== 'all' && classId !== attendanceClassFilter)) return;

                if (typeof classRecords === 'object' && classRecords !== null) {
                    Object.values(classRecords).forEach(status => {
                        if (status === 'Present' || status === 'Late' || status === 'Excused') {
                           presentCount++;
                        }
                    })
                }
            })
            return {
                date: format(date, 'EEE'),
                attendance: Math.round((presentCount / totalCount) * 100),
            };
        }
        return { date: format(date, 'EEE'), attendance: 0 };
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a live overview of your school.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardCard i={0} title="Total Students" icon={<Users className="h-4 w-4 text-muted-foreground" />} value={totalStudents} description="Currently enrolled" />
        <DashboardCard i={1} title="Total Teachers" icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} value={totalTeachers} description="On staff" />
        <DashboardCard i={2} title="Total Classes" icon={<Landmark className="h-4 w-4 text-muted-foreground" />} value={totalClasses} description="Across all grades" />
        <DashboardCard i={3} title="Fees Collected" icon={<TrendingUp className="h-4 w-4 text-green-500" />} value={`GH₵${feeStats.totalPaid.toLocaleString()}`} description="Total payments received" />
        <DashboardCard i={4} title="Fees Owed" icon={<TrendingDown className="h-4 w-4 text-red-500" />} value={`GH₵${totalFeesOwed.toLocaleString()}`} description="Outstanding balance" />
        <DashboardCard i={5} title="Total Revenue" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} value={`GH₵${feeStats.totalDue.toLocaleString()}`} description="Total fees generated" />
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4} className="col-span-full lg:col-span-4">
           <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Weekly Attendance</CardTitle>
                        <CardDescription>Average attendance percentage.</CardDescription>
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
                <ChartContainer config={{ attendance: { label: "Attendance", color: "hsl(var(--chart-1))" }}} className="h-[250px] w-full">
                    <BarChart data={attendanceData} accessibilityLayer>
                        <CartesianGrid vertical={false}/>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}/>
                        <YAxis unit="%"/>
                        <Tooltip content={<ChartTooltipContent indicator="dot"/>}/>
                        <Bar dataKey="attendance" radius={4} fill="var(--color-attendance)"/>
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
    </div>
  );
}
