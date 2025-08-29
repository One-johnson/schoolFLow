
"use client"

import * as React from "react"
import { format, isBefore, startOfDay } from "date-fns"
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Loader2, BarChart3, UserCheck, ShieldCheck, Save, AlertCircle, MessageSquare } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { useDatabase } from "@/hooks/use-database"
import { useToast } from "@/hooks/use-toast"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import _ from 'lodash'
import { database } from "@/lib/firebase"
import { ref, set } from "firebase/database"


type Student = {
  id: string;
  name: string;
};

type Class = {
  id: string;
  name: string;
  studentIds?: Record<string, boolean>;
  teacherId?: string;
};

type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";
type AttendanceEntry = {
  status: AttendanceStatus;
  comment?: string;
}
type AttendanceRecord = Record<string, AttendanceEntry>; // { [studentId]: { status, comment } }
type FullAttendanceRecord = { id: string } & AttendanceRecord;

export default function AttendancePage() {
  const { user, role } = useAuth();
  const [date, setDate] = React.useState<Date>(new Date())
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>()
  const [attendance, setAttendance] = React.useState<AttendanceRecord>({})
  const [originalAttendance, setOriginalAttendance] = React.useState<AttendanceRecord>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)

  const { data: all_classes, loading: classesLoading } = useDatabase<Class>('classes')
  const { data: allStudents, loading: studentsLoading } = useDatabase<Student>('students')
  const { toast } = useToast()

  const formattedDate = format(date, 'yyyy-MM-dd');
  const { data: savedAttendance, loading: attendanceLoading } = useDatabase<FullAttendanceRecord>(`attendance/${formattedDate}`);
  
  const hasUnsavedChanges = React.useMemo(() => !_.isEqual(attendance, originalAttendance), [attendance, originalAttendance]);
  
  const isPastDate = React.useMemo(() => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  }, [date]);


  // Teacher-specific classes
  const teacherClasses = React.useMemo(() => {
    if (role === 'teacher') {
      return all_classes.filter(c => c.teacherId === user?.uid)
    }
    return all_classes
  }, [all_classes, role, user]);

  // Student-specific classes
  const studentClasses = React.useMemo(() => {
    if (role === 'student') {
        return all_classes.filter(c => c.studentIds && user?.uid && c.studentIds[user.uid])
    }
    return [];
  }, [all_classes, role, user]);


  React.useEffect(() => {
    if(classesLoading || studentsLoading) return;

    // Auto-select first class for teacher
    if (role === 'teacher' && teacherClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(teacherClasses[0].id)
    }
    // Auto-select first class for admin if none is selected
    if (role === 'admin' && all_classes.length > 0 && !selectedClassId) {
        setSelectedClassId(all_classes[0].id)
    }
    // Auto-select the student's class
    if (role === 'student' && studentClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(studentClasses[0].id)
    }
  }, [role, teacherClasses, all_classes, studentClasses, selectedClassId, classesLoading, studentsLoading]);

  React.useEffect(() => {
    setIsFetching(true);
    if (selectedClassId && !attendanceLoading) {
      const classAttendance = savedAttendance.find(a => a.id === selectedClassId)
      if (classAttendance) {
        const { id, ...rest } = classAttendance
        setAttendance(rest as AttendanceRecord);
        setOriginalAttendance(rest as AttendanceRecord);
      } else {
        setAttendance({});
        setOriginalAttendance({});
      }
    } else {
      setAttendance({});
      setOriginalAttendance({});
    }
    setIsFetching(false)
  }, [selectedClassId, savedAttendance, attendanceLoading, date])

  const studentsMap = React.useMemo(() => new Map(allStudents.map(s => [s.id, s])), [allStudents]);
  
  const selectedClass = React.useMemo(() => {
    return all_classes.find(c => c.id === selectedClassId)
  }, [all_classes, selectedClassId])

  const classStudents = React.useMemo(() => {
    if (!selectedClass || !selectedClass.studentIds) return []
    return Object.keys(selectedClass.studentIds)
      .map(studentId => studentsMap.get(studentId))
      .filter((s): s is Student => !!s)
  }, [selectedClass, studentsMap])
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if(role !== 'teacher' || isPastDate) return;
    setAttendance(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], status }
    }))
  }
  
  const handleCommentChange = (studentId: string, comment: string) => {
     if(role !== 'teacher' || isPastDate) return;
     setAttendance(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], comment }
    }))
  }
  
  const handleSaveAndMarkAllPresent = async () => {
    if (!selectedClassId) {
      toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const completedAttendance = { ...attendance };
    classStudents.forEach(student => {
        if (!completedAttendance[student.id]?.status) {
            if(!completedAttendance[student.id]) completedAttendance[student.id] = {} as AttendanceEntry;
            completedAttendance[student.id].status = "Present";
        }
    });

    try {
        const attendanceRef = ref(database, `attendance/${formattedDate}/${selectedClassId}`);
        await set(attendanceRef, completedAttendance);
        setAttendance(completedAttendance);
        setOriginalAttendance(completedAttendance);
        toast({ title: "Success", description: "Attendance saved successfully." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" });
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  }


  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
        toast({ title: "Error", description: "Please select a class.", variant: "destructive" })
        return
    }
    
    if (classStudents.some(s => !attendance[s.id]?.status)) {
        toast({ title: "Error", description: "Please mark attendance for all students.", variant: "destructive" })
        return
    }

    setIsLoading(true);
    try {
      const attendanceRef = ref(database, `attendance/${formattedDate}/${selectedClassId}`);
      await set(attendanceRef, attendance);
      setOriginalAttendance(attendance);
      toast({ title: "Success", description: "Attendance saved successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" })
      console.error(error)
    } finally {
      setIsLoading(false);
    }
  }

  const attendanceStats = React.useMemo(() => {
    const stats = { Present: 0, Absent: 0, Late: 0, Excused: 0, Unmarked: 0 };
    const total = classStudents.length;
    classStudents.forEach(student => {
      const status = attendance[student.id]?.status;
      if (status) {
        stats[status]++;
      } else {
        stats.Unmarked++;
      }
    });
    return { ...stats, total };
  }, [attendance, classStudents]);
  
  const chartData = [
    { name: 'Present', value: attendanceStats.Present, fill: 'var(--color-present)' },
    { name: 'Absent', value: attendanceStats.Absent, fill: 'var(--color-absent)' },
    { name: 'Late', value: attendanceStats.Late, fill: 'var(--color-late)' },
    { name: 'Excused', value: attendanceStats.Excused, fill: 'var(--color-excused)' },
  ];

  const chartConfig = {
    value: { label: "Students" },
    present: { label: "Present", color: "hsl(var(--chart-2))" },
    absent: { label: "Absent", color: "hsl(var(--chart-5))" },
    late: { label: "Late", color: "hsl(var(--chart-4))" },
    excused: { label: "Excused", color: "hsl(var(--chart-3))" },
  } 

  const studentAttendanceForDay = React.useMemo(() => {
      if(role !== 'student' || !user || !selectedClass) return null;
      return {
          status: attendance[user.uid]?.status,
          comment: attendance[user.uid]?.comment,
          className: selectedClass.name
      };
  }, [role, user, selectedClass, attendance]);

  const atLeastOneMarked = Object.keys(attendance).length > 0;
  const isAllMarked = attendanceStats.Unmarked === 0;


  if (classesLoading || studentsLoading) {
      return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="ml-4">Loading attendance data...</p>
            </div>
        );
  }

  return (
    <div className="flex flex-col gap-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            {role === 'teacher' && "Mark and monitor student attendance."}
            {role === 'admin' && "Review attendance records for the school."}
            {role === 'student' && "View your attendance history."}
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {role === 'teacher' && "Take Attendance"}
            {role === 'admin' && "Review Attendance"}
            {role === 'student' && "Your Attendance"}
          </CardTitle>
          <CardDescription>
            {role !== 'student' && "Select a date and a class to view records."}
            {role === 'student' && "Select a date to see your attendance status."}
            {role === 'teacher' && isPastDate && <span className="text-destructive font-semibold ml-2">You can only view attendance for past dates.</span>}
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                        disabled={(date) => date > new Date()}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            {role !== 'student' && (
            <div className="grid gap-2">
                <div className="flex items-center gap-2">
                    <Label>Class</Label>
                    {hasUnsavedChanges && <Badge variant="destructive" className="animate-pulse"><AlertCircle className="mr-1 h-3 w-3"/>Unsaved changes</Badge>}
                </div>
                 <Select onValueChange={setSelectedClassId} value={selectedClassId} disabled={hasUnsavedChanges}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : 
            role === 'student' ? (
                 <div className="flex flex-col items-center justify-center gap-4 py-8">
                     {studentAttendanceForDay?.status ? (
                         <>
                            <p className="text-muted-foreground">On {format(date, "PPP")}, your status was:</p>
                             <div className="flex items-center gap-2 text-2xl font-bold">
                                {studentAttendanceForDay.status === 'Present' && <CheckCircle className="h-8 w-8 text-green-500" />}
                                {studentAttendanceForDay.status === 'Absent' && <XCircle className="h-8 w-8 text-red-500" />}
                                {studentAttendanceForDay.status === 'Late' && <Clock className="h-8 w-8 text-orange-500" />}
                                {studentAttendanceForDay.status === 'Excused' && <ShieldCheck className="h-8 w-8 text-blue-500" />}
                                {studentAttendanceForDay.status}
                             </div>
                              <p className="text-sm text-muted-foreground">in {studentAttendanceForDay.className}</p>
                              {studentAttendanceForDay.comment && <p className="mt-2 text-sm italic">Note: "{studentAttendanceForDay.comment}"</p>}
                         </>
                     ) : (
                         <p className="text-center text-muted-foreground">No attendance record found for this day.</p>
                     )}
                 </div>
            ) :
            selectedClassId ? (
                classStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="w-full sm:w-[400px]">Status</TableHead>
                                <TableHead className="w-[200px]">Comment</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {classStudents.map((student) => (
                                <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>
                                    <RadioGroup
                                    value={attendance[student.id]?.status}
                                    onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                                    className="flex flex-wrap gap-x-4 gap-y-2"
                                    disabled={role !== 'teacher' || isPastDate}
                                    >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Present" id={`present-${student.id}`} />
                                        <Label htmlFor={`present-${student.id}`} className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Present</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Absent" id={`absent-${student.id}`} />
                                        <Label htmlFor={`absent-${student.id}`} className="text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4" /> Absent</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Late" id={`late-${student.id}`} />
                                        <Label htmlFor={`late-${student.id}`} className="text-orange-500 flex items-center gap-1"><Clock className="h-4 w-4" /> Late</Label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Excused" id={`excused-${student.id}`} />
                                        <Label htmlFor={`excused-${student.id}`} className="text-blue-500 flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Excused</Label>
                                    </div>
                                    </RadioGroup>
                                </TableCell>
                                <TableCell>
                                    {attendance[student.id]?.status && attendance[student.id]?.status !== 'Present' && (
                                        <Input 
                                            type="text"
                                            placeholder="Add a comment..."
                                            className="h-8"
                                            value={attendance[student.id]?.comment || ''}
                                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                                            disabled={role !== 'teacher' || isPastDate}
                                        />
                                    )}
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Statistics</CardTitle>
                                <CardDescription>For {selectedClass?.name} on {format(date, "PPP")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mb-4">
                                    <p>Present: <span className="font-bold text-green-600">{attendanceStats.Present}</span></p>
                                    <p>Absent: <span className="font-bold text-red-600">{attendanceStats.Absent}</span></p>
                                    <p>Late: <span className="font-bold text-orange-500">{attendanceStats.Late}</span></p>
                                    <p>Excused: <span className="font-bold text-blue-500">{attendanceStats.Excused}</span></p>
                                    <p>Unmarked: <span className="font-bold">{attendanceStats.Unmarked}</span></p>
                                    <p className="mt-2 pt-2 border-t">Total Students: <span className="font-bold text-primary">{attendanceStats.total}</span></p>
                                </div>
                                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                    <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                         <YAxis
                                            dataKey="name"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            className="text-xs"
                                        />
                                        <XAxis dataKey="value" type="number" hide />
                                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="value" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                ) : (
                <p className="text-center text-muted-foreground py-8">No students found in this class.</p>
                )
            ) : (
                <p className="text-center text-muted-foreground py-8">
                    {role === 'teacher' && "Select a class to get started."}
                    {role === 'admin' && "Select a class to view attendance."}
                </p>
            )
          }
        </CardContent>
        {role === 'teacher' && selectedClassId && classStudents.length > 0 && !isPastDate && (
           <CardFooter className="border-t px-6 py-4 flex justify-between">
              <div className="flex gap-2">
                <Button onClick={handleSaveAttendance} disabled={isLoading || !isAllMarked || !hasUnsavedChanges}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Attendance
                </Button>
                 <Button onClick={handleSaveAndMarkAllPresent} variant="secondary" disabled={isLoading || isAllMarked}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Save and Mark all as Present
                </Button>
              </div>
           </CardFooter>
        )}
      </Card>
    </div>
  )
}
