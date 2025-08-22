
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
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
import { useDatabase } from "@/hooks/use-database"
import { useToast } from "@/hooks/use-toast"

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

type AttendanceStatus = "Present" | "Absent" | "Late";
type AttendanceRecord = Record<string, AttendanceStatus>; // { [studentId]: status }

export default function AttendancePage() {
  const { user, role } = useAuth();
  const [date, setDate] = React.useState<Date>(new Date())
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>()
  const [attendance, setAttendance] = React.useState<AttendanceRecord>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(false)

  const { data: all_classes } = useDatabase<Class>('classes')
  const { data: allStudents } = useDatabase<Student>('students')
  const { toast } = useToast()

  const classes = React.useMemo(() => {
    if (role === 'teacher') {
      return all_classes.filter(c => c.teacherId === user?.uid)
    }
    return all_classes
  }, [all_classes, role, user]);

  const { data: savedAttendance, updateData: updateAttendance } = useDatabase<Record<string, AttendanceRecord>>(`attendance/${format(date, 'yyyy-MM-dd')}`);

  React.useEffect(() => {
    if (selectedClassId) {
      setIsFetching(true);
      const classAttendance = savedAttendance.find(a => a.id === selectedClassId)
      if (classAttendance) {
        const { id, ...rest } = classAttendance
        setAttendance(rest as AttendanceRecord)
      } else {
        setAttendance({})
      }
      setIsFetching(false)
    } else {
      setAttendance({});
    }
  }, [selectedClassId, savedAttendance])

  const studentsMap = React.useMemo(() => new Map(allStudents.map(s => [s.id, s])), [allStudents]);
  
  const selectedClass = React.useMemo(() => {
    return classes.find(c => c.id === selectedClassId)
  }, [classes, selectedClassId])

  const classStudents = React.useMemo(() => {
    if (!selectedClass || !selectedClass.studentIds) return []
    return Object.keys(selectedClass.studentIds)
      .map(studentId => studentsMap.get(studentId))
      .filter((s): s is Student => !!s)
  }, [selectedClass, studentsMap])
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
        toast({ title: "Error", description: "Please select a class.", variant: "destructive" })
        return
    }
    
    if (classStudents.some(s => !attendance[s.id])) {
        toast({ title: "Error", description: "Please mark attendance for all students.", variant: "destructive" })
        return
    }

    setIsLoading(true);
    try {
      await updateAttendance(selectedClassId, attendance);
      toast({ title: "Success", description: "Attendance saved successfully." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" })
      console.error(error)
    } finally {
      setIsLoading(false);
    }
  }

  const attendanceStats = React.useMemo(() => {
    const stats = { Present: 0, Absent: 0, Late: 0, Unmarked: 0 };
    const total = classStudents.length;
    classStudents.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        stats[status]++;
      } else {
        stats.Unmarked++;
      }
    });
    return { ...stats, total };
  }, [attendance, classStudents]);

  return (
    <div className="flex flex-col gap-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Mark and monitor student attendance.
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription>Select a date and a class to mark attendance.</CardDescription>
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
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid gap-2">
                <Label>Class</Label>
                 <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedClassId && (
            isFetching ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> :
            classStudents.length > 0 ? (
              <>
                 <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-[400px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <RadioGroup
                              value={attendance[student.id]}
                              onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                              className="flex gap-4"
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
                            </RadioGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                 <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                   <div>
                        <span>Present: <span className="font-bold text-green-600">{attendanceStats.Present}</span></span> | 
                        <span> Absent: <span className="font-bold text-red-600">{attendanceStats.Absent}</span></span> | 
                        <span> Late: <span className="font-bold text-orange-500">{attendanceStats.Late}</span></span> |
                        <span> Unmarked: <span className="font-bold">{attendanceStats.Unmarked}</span></span>
                   </div>
                   <span>Total Students: <span className="font-bold text-primary">{attendanceStats.total}</span></span>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No students found in this class or this is not a class assigned to you.</p>
            )
          )}
        </CardContent>
        {selectedClassId && classStudents.length > 0 && (
           <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveAttendance} disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Save Attendance
              </Button>
           </CardFooter>
        )}
      </Card>
    </div>
  )
}
