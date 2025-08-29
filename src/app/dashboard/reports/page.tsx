
"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, FileDown, Printer, Loader2, BarChart2, DollarSign, Award } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { DateRange } from "react-day-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDatabase } from "@/hooks/use-database"
import FinancialReport from "@/components/dashboard/reports/financial-report"
import AcademicsReport from "@/components/dashboard/reports/academics-report"

type Student = { id: string; name: string };
type Class = { id:string, name: string, studentIds?: Record<string, boolean>, teacherId?: string };
type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceEntry = { status: AttendanceStatus, comment?: string };
type AttendanceRecord = Record<string, AttendanceEntry>;
type DailyAttendance = { [classId: string]: AttendanceRecord };
type FullAttendanceLog = { date: string; classId: string; studentId: string; studentName: string; status: AttendanceStatus; className: string };

const statusColors = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  Late: "bg-orange-100 text-orange-800",
  Excused: "bg-blue-100 text-blue-800",
};

function AttendanceReport() {
    const { role, user } = useAuth();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    })
    const [selectedClassId, setSelectedClassId] = React.useState<string>("all")
    const [selectedStudentId, setSelectedStudentId] = React.useState<string>("all")
    const [loading, setLoading] = React.useState(true);

    const { data: students, loading: studentsLoading } = useDatabase<Student>("students");
    const { data: all_classes, loading: classesLoading } = useDatabase<Class>("classes");
    const { data: rawAttendance, loading: attendanceLoading } = useDatabase<DailyAttendance>("attendance");

    const teacherClasses = React.useMemo(() => {
        if(role !== 'teacher' || !user) return all_classes;
        return all_classes.filter(c => c.teacherId === user.uid);
    }, [all_classes, role, user]);

    const studentIdsInTeacherClasses = React.useMemo(() => {
        const ids = new Set<string>();
        if (role !== 'teacher') return ids;
        teacherClasses.forEach(c => {
            if (c.studentIds) Object.keys(c.studentIds).forEach(id => ids.add(id));
        });
        return ids;
    }, [teacherClasses, role]);
    
    const studentsForRole = React.useMemo(() => {
        if(role !== 'teacher') return students;
        return students.filter(s => studentIdsInTeacherClasses.has(s.id));
    }, [students, studentIdsInTeacherClasses, role]);


    const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    const classesMap = React.useMemo(() => new Map(all_classes.map(c => [c.id, c.name])), [all_classes]);

    const allAttendanceData = React.useMemo<FullAttendanceLog[]>(() => {
        if (attendanceLoading || studentsLoading || classesLoading) return [];
        
        const flatData: FullAttendanceLog[] = [];
        rawAttendance.forEach(dailyRecord => {
        const date = dailyRecord.id; // date is the key, e.g., '2024-07-25'
        if (!dailyRecord || typeof dailyRecord !== 'object') return;

        Object.entries(dailyRecord).forEach(([classId, classData]) => {
            if (classId === 'id') return; // Skip the 'id' field from useDatabase
            if (typeof classData !== 'object' || classData === null) return;
            const attendanceRecords = classData as AttendanceRecord;
            
            // Teacher role check
            if (role === 'teacher' && !teacherClasses.some(c => c.id === classId)) return;

            Object.entries(attendanceRecords).forEach(([studentId, entry]) => {
            if (entry && typeof entry.status === 'string') {
                flatData.push({
                date,
                classId,
                studentId,
                status: entry.status,
                studentName: studentsMap.get(studentId) || 'Unknown Student',
                className: classesMap.get(classId) || 'Unknown Class'
                });
            }
            });
        });
        });
        setLoading(false);
        return flatData;
    }, [rawAttendance, studentsMap, classesMap, attendanceLoading, studentsLoading, classesLoading, role, teacherClasses]);

    const filteredData = React.useMemo(() => {
        return allAttendanceData
        .filter(log => {
            const logDate = new Date(log.date);
            const from = dateRange?.from ? new Date(dateRange.from.setHours(0, 0, 0, 0)) : null;
            const to = dateRange?.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : null;
            
            if (from && logDate < from) return false;
            if (to && logDate > to) return false;
            if (selectedClassId !== 'all' && log.classId !== selectedClassId) return false;
            if (selectedStudentId !== 'all' && log.studentId !== selectedStudentId) return false;
            
            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allAttendanceData, dateRange, selectedClassId, selectedStudentId]);

    const handlePrint = () => window.print();

    const handleExport = () => {
        const headers = ["Date", "Student Name", "Class Name", "Status"];
        const csvContent = [
        headers.join(","),
        ...filteredData.map(d => [d.date, d.studentName, d.className, d.status].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        }
    };

    const setDatePreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
        const now = new Date();
        switch(preset) {
            case 'today':
                setDateRange({ from: now, to: now });
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                setDateRange({ from: yesterday, to: yesterday });
                break;
            case 'this_week':
                setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
                break;
            case 'this_month':
                setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
        }
    }

    return (
        <Card>
            <div className="print-hidden">
                <CardHeader>
                <CardTitle>Report Filters</CardTitle>
                <CardDescription>Use the filters below to generate a report.</CardDescription>
                <div className="flex flex-wrap gap-4 pt-4">
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_week')}>This Week</Button>
                        <Button variant="outline" size="sm" onClick={() => setDatePreset('this_month')}>This Month</Button>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant="outline"
                            className="w-[300px] justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Student" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Students</SelectItem>
                            {studentsForRole.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                </CardHeader>
            </div>
            <CardContent>
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredData.length > 0 ? (
                        filteredData.map((log, index) => (
                        <TableRow key={index}>
                            <TableCell>{log.date}</TableCell>
                            <TableCell>{log.studentName}</TableCell>
                            <TableCell>{log.className}</TableCell>
                            <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[log.status] || ''}`}>
                                {log.status}
                            </span>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No results found for the selected filters.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 print-hidden">
                <Button variant="outline" onClick={handlePrint} disabled={filteredData.length === 0}>
                    <Printer className="mr-2 h-4 w-4"/> Print
                </Button>
                <Button onClick={handleExport} disabled={filteredData.length === 0}>
                    <FileDown className="mr-2 h-4 w-4"/> Export to CSV
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function ReportsPage() {
  const { role } = useAuth();
  
  if (!role) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="print-hidden">
        <h1 className="text-3xl font-bold tracking-tight">Reporting Hub</h1>
        <p className="text-muted-foreground">Generate and export detailed school reports.</p>
      </div>

      <Tabs defaultValue="attendance">
         <div className="print-hidden">
            <TabsList>
                <TabsTrigger value="attendance"><BarChart2 className="mr-2 h-4 w-4" /> Attendance</TabsTrigger>
                <TabsTrigger value="financial"><DollarSign className="mr-2 h-4 w-4" /> Financial</TabsTrigger>
                <TabsTrigger value="academics"><Award className="mr-2 h-4 w-4" /> Academics</TabsTrigger>
            </TabsList>
         </div>

        <TabsContent value="attendance" className="mt-4">
          <AttendanceReport />
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
            <FinancialReport />
        </TabsContent>
        <TabsContent value="academics" className="mt-4">
            <AcademicsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
