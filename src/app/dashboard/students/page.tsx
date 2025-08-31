
"use client";

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Loader2,
  FileDown,
  Book,
  Users,
  UserCheck,
  UserX,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { auth, database } from '@/lib/firebase';
import { set, ref, getDatabase, update } from 'firebase/database';


import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useDatabase } from "@/hooks/use-database"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, generateStudentId, generateAdmissionNo } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"
import { serverTimestamp } from "firebase/database"
import { createUserWithEmailAndPassword } from "firebase/auth"

type Student = {
  id: string
  studentId: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Graduated" | "Continuing"
  admissionNo: string;
  rollNo: string;
  dateOfBirth?: string
  placeOfBirth?: string
  nationality?: string
  hometown?: string
  gender: "Male" | "Female" | "Other"
  address?: string
  parentName: string
  parentPhone: string
  parentEmail?: string
  avatarUrl?: string;
  house: "Ambassadors" | "Royals" | "Dependable" | "Jubilee";
  createdAt: number;
  updatedAt?: number;
 
}
type Class = { id: string; name: string; studentIds?: Record<string, boolean>, teacherId?: string };

const houseColors: Record<NonNullable<Student["house"]>, string> = {
  Ambassadors: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Royals: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Dependable: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  Jubilee: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const calculateAge = (dob: Date | undefined): number | undefined => {
    if (!dob) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    return (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
}


export default function StudentsPage() {
  const { user, role } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    admissionNo: true,
    rollNo: false,
    email: false,
    dateOfBirth: false,
    placeOfBirth: false,
    hometown: false,
    address: false,
    parentEmail: false,
    nationality: false,
    createdAt: false,
    updatedAt: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false)
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    data: allStudents,
    loading: dataLoading,
    deleteData,
    uploadFile,
    addDataWithId
  } = useDatabase<Student>("students")
  const { data: classes, updateData: updateClass, updatePath: updateClassPath } = useDatabase<Class>("classes");
  const { addData: addNotification } = useDatabase("notifications")
  const { toast } = useToast()

  const [newStudent, setNewStudent] = React.useState<Partial<Omit<Student, 'id' | 'status' | 'createdAt'>>>({});
  const [editStudent, setEditStudent] = React.useState<Partial<Student>>({});
  const [assignClassId, setAssignClassId] = React.useState<string | undefined>();
  const [dob, setDob] = React.useState<Date | undefined>();

  const students = React.useMemo(() => {
    if (role === 'admin') return allStudents;
    if (role === 'teacher') {
        const teacherClassIds = new Set(classes.filter(c => c.teacherId === user?.uid).map(c => c.id));
        const studentIdsInTeacherClasses = new Set<string>();
        classes.forEach(c => {
            if (teacherClassIds.has(c.id) && c.studentIds) {
                Object.keys(c.studentIds).forEach(id => studentIdsInTeacherClasses.add(id));
            }
        });
        return allStudents.filter(s => studentIdsInTeacherClasses.has(s.id));
    }
    return [];
  }, [role, allStudents, classes, user]);


  const studentClassMap = React.useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach(c => {
        if(c.studentIds) {
            Object.keys(c.studentIds).forEach(studentId => {
                map.set(studentId, c.name);
            });
        }
    });
    return map;
  }, [classes]);

  const studentStatusCounts = React.useMemo(() => {
    return allStudents.reduce((acc, student) => {
      acc.total = (acc.total || 0) + 1;
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, { total: 0, Active: 0, Inactive: 0, Graduated: 0, Continuing: 0 });
  }, [allStudents]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, form: 'new' | 'edit') => {
      const { id, value } = e.target;
      if (form === 'new') {
        setNewStudent(prev => ({...prev, [id]: value}));
      } else {
        setEditStudent(prev => ({...prev, [id]: value}));
      }
  }
  
  const handleFileChange = async (file: File | null, form: 'new' | 'edit') => {
      if (!file) return;
      setIsLoading(true);
      try {
          const downloadURL = await uploadFile(file, `avatars/${file.name}`);
           if (form === 'new') {
                setNewStudent(prev => ({ ...prev, avatarUrl: downloadURL }));
            } else {
                setEditStudent(prev => ({ ...prev, avatarUrl: downloadURL }));
            }
          toast({ title: "Image uploaded", description: "Avatar has been updated."});
      } catch (error) {
           toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }


  const handleAddStudent = async () => {
    if (!newStudent.name?.trim() || !newStudent.email?.trim()) {
      toast({ title: "Error", description: "Student name and email are required.", variant: "destructive" })
      return
    }
    setIsLoading(true);
    let createdUser;
    try {
      // Note: This creates a temporary second auth instance. In a real app, you'd want a more robust admin SDK-based solution.
      const tempApp = auth.app;
      createdUser = await createUserWithEmailAndPassword(auth, newStudent.email, newStudent.password || 'password123');
      const studentId = createdUser.user.uid;
      
      const studentData: any = {
        ...newStudent,
        id: studentId,
        studentId: generateStudentId(),
        admissionNo: generateAdmissionNo(),
        status: 'Active',
        createdAt: serverTimestamp(),
      };
      
      if (dob) {
        studentData.dateOfBirth = format(dob, "yyyy-MM-dd");
      }

      await addDataWithId(studentId, studentData);
      await set(ref(database, `users/${studentId}`), {
          role: 'student',
          email: newStudent.email,
          name: newStudent.name
      });
      
      await addNotification({
        type: 'student_enrolled',
        message: `New student "${newStudent.name}" was enrolled.`,
        read: false,
      })

      toast({ title: "Success", description: "Student created successfully." })
      setNewStudent({})
      setDob(undefined)
      setIsCreateDialogOpen(false)

    } catch (error: any) {
      console.error("Student creation error:", error);
      toast({ title: "Error", description: `Failed to add student: ${error.message}`, variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }
  
  const openEditDialog = (student: Student) => {
    setSelectedStudent(student)
    setEditStudent(student)
    if (student.dateOfBirth) {
        setDob(new Date(student.dateOfBirth))
    } else {
        setDob(undefined)
    }
    setIsEditDialogOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!selectedStudent || !editStudent) return
    if (!editStudent.name?.trim() || !editStudent.email?.trim()) {
      toast({ title: "Error", description: "Student name and email are required.", variant: "destructive" })
      return
    }
    setIsLoading(true);
    try {
      const db = getDatabase();
      const updates: any = {
        ...editStudent,
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
        updatedAt: serverTimestamp(),
      };
      
      const studentRef = ref(db, `students/${selectedStudent.id}`);
      await update(studentRef, updates);
      
      const userRef = ref(db, `users/${selectedStudent.id}`);
      await update(userRef, { name: editStudent.name, email: editStudent.email });

      toast({ title: "Success", description: "Student updated." })
      setIsEditDialogOpen(false)
      setSelectedStudent(null)
      setEditStudent({})
      setDob(undefined)
    } catch (error) {
      toast({ title: "Error", description: "Failed to update student.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    setIsLoading(true);
    try {
      // Find which class the student is in
      const classToRemoveFrom = classes.find(c => c.studentIds && c.studentIds[studentId]);

      if (classToRemoveFrom) {
        const classRefPath = `classes/${classToRemoveFrom.id}/studentIds/${studentId}`;
        await updateClassPath(classRefPath, null); 
      }
      
      await deleteData(studentId);

      toast({ title: "Success", description: "Student deleted successfully." });
    } catch (error) {
      console.error("Deletion error:", error);
      toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!assignClassId) {
        toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
        return;
    }
    const selectedStudentIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    if(selectedStudentIds.length === 0) {
        toast({ title: "Error", description: "No students selected.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
        const targetClass = classes.find(c => c.id === assignClassId);
        if(!targetClass) throw new Error("Class not found");

        const updatedStudentIds = { ...(targetClass.studentIds || {}) };
        selectedStudentIds.forEach(id => {
            updatedStudentIds[id] = true;
        });
        
        await updateClass(assignClassId, { studentIds: updatedStudentIds });

        toast({ title: "Success", description: `${selectedStudentIds.length} student(s) assigned to ${targetClass.name}.` });
        setIsAssignDialogOpen(false);
        setAssignClassId(undefined);
        table.toggleAllPageRowsSelected(false);

    } catch (error) {
        toast({ title: "Error", description: "Failed to assign students.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "studentId",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("studentId")}</div>
      ),
    },
     {
      accessorKey: "admissionNo",
      header: "Admission No.",
      cell: ({ row }) => <div>{row.getValue("admissionNo")}</div>,
    },
     {
      accessorKey: "rollNo",
      header: "Roll No.",
      cell: ({ row }) => <div>{row.getValue("rollNo")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src={student.avatarUrl} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <Link href={`/dashboard/students/${row.original.id}`} className="capitalize font-medium text-primary hover:underline">
              {row.getValue("name")}
            </Link>
          </div>
      )},
    },
     {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => studentClassMap.get(row.original.id) || <span className="text-muted-foreground">N/A</span>,
    },
    {
      accessorKey: "house",
      header: "House",
      cell: ({ row }) => {
        const house = row.getValue("house") as Student["house"];
        if (!house) return <span className="text-muted-foreground">N/A</span>;
        const colorClass = houseColors[house];
        return <Badge className={cn("border-transparent", colorClass)}>{house}</Badge>
      }
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => <div>{row.getValue("gender")}</div>
    },
    {
        accessorKey: "parentName",
        header: "Parent's Name",
        cell: ({ row }) => <div>{row.getValue("parentName")}</div>
    },
    {
        accessorKey: "parentPhone",
        header: "Parent's Phone",
        cell: ({ row }) => <div>{row.getValue("parentPhone")}</div>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Student["status"]
        const variant = {
          "Active": "default",
          "Inactive": "destructive",
          "Graduated": "secondary",
          "Continuing": "outline",
        }[status] as "default" | "destructive" | "secondary" | "outline" | undefined;

        const className = {
            "Active": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
            "Inactive": "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
            "Graduated": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
            "Continuing": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
        }[status];
        
        return (
          <Badge
            variant={variant}
            className={cn("border-transparent", className)}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => <div>{row.getValue("createdAt") ? format(new Date(row.getValue("createdAt") as number), 'PPP') : 'N/A'}</div>,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => <div>{row.getValue("updatedAt") ? format(new Date(row.getValue("updatedAt") as number), 'PPP') : 'N/A'}</div>,
    },
     // Hidden by default columns
    { accessorKey: "dateOfBirth", header: "Date of Birth", cell: ({ row }) => <div>{row.getValue("dateOfBirth") ? format(new Date(row.getValue("dateOfBirth") as string), 'PPP') : 'N/A'}</div> },
    { accessorKey: "placeOfBirth", header: "Place of Birth", cell: ({ row }) => <div>{row.getValue("placeOfBirth")}</div> },
    { accessorKey: "nationality", header: "Nationality", cell: ({ row }) => <div>{row.getValue("nationality")}</div> },
    { accessorKey: "hometown", header: "Hometown", cell: ({ row }) => <div>{row.getValue("hometown")}</div> },
    { accessorKey: "address", header: "Address", cell: ({ row }) => <div>{row.getValue("address")}</div> },
    { accessorKey: "parentEmail", header: "Parent's Email", cell: ({ row }) => <div>{row.getValue("parentEmail")}</div> },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original

        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditDialog(student)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Student
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                   <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Student
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the student account and remove their data from our servers.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteStudent(student.id)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })
  
  const handleExportCSV = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const rowsToExport = selectedRows.length > 0 ? selectedRows : table.getCoreRowModel().rows;

    if (rowsToExport.length === 0) {
        toast({ title: "No Data", description: "There is no data to export.", variant: "destructive" });
        return;
    }

    const headers = ["ID", "Admission No.", "Roll No.", "Name", "Email", "Status", "Class", "Gender", "Parent's Name", "Parent's Phone", "House"];
    const csvContent = [
        headers.join(','),
        ...rowsToExport.map(row => {
            const student = row.original;
            return [
                student.studentId,
                student.admissionNo,
                student.rollNo,
                `"${student.name}"`,
                student.email,
                student.status,
                `"${studentClassMap.get(student.id) || 'N/A'}"`,
                student.gender || 'N/A',
                `"${student.parentName || 'N/A'}"`,
                `"${student.parentPhone || 'N/A'}"`,
                student.house || 'N/A'
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: `${rowsToExport.length} students exported.` });
  };
  
  const age = calculateAge(dob);
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            {role === 'admin' ? "Manage student profiles and information." : "View student profiles."}
          </CardDescription>
        </div>
        {role === 'admin' && (
        <div className="flex items-center gap-2">
             <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="mr-2 h-4 w-4"/>
                Export CSV {selectedRowsCount > 0 && `(${selectedRowsCount})`}
             </Button>
             <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={selectedRowsCount === 0}>
                        <Book className="mr-2 h-4 w-4"/>
                        Assign to Class {selectedRowsCount > 0 && `(${selectedRowsCount})`}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Students to Class</DialogTitle>
                        <DialogDescription>Select a class to assign the {selectedRowsCount} selected student(s) to.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Class</Label>
                        <Select value={assignClassId} onValueChange={setAssignClassId}>
                            <SelectTrigger><SelectValue placeholder="Select a class..."/></SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAssignToClass} disabled={isLoading || !assignClassId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setNewStudent({}); setDob(undefined) }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Fill in the details to add a new student to the system.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] overflow-y-auto px-2">
                    <Tabs defaultValue="student-details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="student-details">Student Details</TabsTrigger>
                            <TabsTrigger value="parent-details">Parent Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="student-details" className="mt-4">
                        <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Avatar</Label>
                                    <div className="col-span-3">
                                        <ImageUpload
                                            currentImage={newStudent.avatarUrl}
                                            onFileChange={(file) => handleFileChange(file, 'new')}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" className="col-span-3" value={newStudent.name || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">Email</Label>
                                    <Input id="email" type="email" placeholder="student@school.edu" className="col-span-3" value={newStudent.email || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "col-span-3 justify-start text-left font-normal",
                                            !dob && "text-muted-foreground"
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dob}
                                            onSelect={setDob}
                                            initialFocus
                                        />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="age" className="text-right">Age</Label>
                                    <Input id="age" className="col-span-3" value={age !== undefined ? age : "Select DOB"} disabled />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="placeOfBirth" className="text-right">Place of Birth</Label>
                                    <Input id="placeOfBirth" placeholder="City, Country" className="col-span-3" value={newStudent.placeOfBirth || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="gender" className="text-right">Gender</Label>
                                    <Select onValueChange={(value) => setNewStudent(prev => ({ ...prev, gender: value as any}))} value={newStudent.gender} disabled={isLoading}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="house" className="text-right">House</Label>
                                    <Select onValueChange={(value: Student["house"]) => setNewStudent(prev => ({ ...prev, house: value as any}))} value={newStudent.house} disabled={isLoading}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select house" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ambassadors">Ambassadors</SelectItem>
                                            <SelectItem value="Royals">Royals</SelectItem>
                                            <SelectItem value="Dependable">Dependable</SelectItem>
                                            <SelectItem value="Jubilee">Jubilee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="nationality" className="text-right">Nationality</Label>
                                    <Input id="nationality" placeholder="e.g., American" className="col-span-3" value={newStudent.nationality || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="hometown" className="text-right">Hometown</Label>
                                    <Input id="hometown" placeholder="City, State" className="col-span-3" value={newStudent.hometown || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="address" className="text-right">Address</Label>
                                    <Input id="address" placeholder="123 Main St, Anytown" className="col-span-3" value={newStudent.address || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="parent-details" className="mt-4">
                        <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="parentName" className="text-right">Parent's Name</Label>
                                    <Input id="parentName" placeholder="Jane Doe" className="col-span-3" value={newStudent.parentName || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="parentPhone" className="text-right">Parent's Phone</Label>
                                    <Input id="parentPhone" placeholder="+1 123 456 7890" className="col-span-3" value={newStudent.parentPhone || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="parentEmail" className="text-right">Parent's Email</Label>
                                    <Input id="parentEmail" type="email" placeholder="parent@example.com" className="col-span-3" value={newStudent.parentEmail || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>
                <DialogFooter>
                <Button type="submit" onClick={handleAddStudent} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Student
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full">
           {role === 'admin' && (
             <div className="mb-4 flex flex-wrap items-center gap-6 rounded-md bg-muted p-1 sm:w-fit">
                <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" data-active={true}>
                    <Users className="h-4 w-4" /> All Students <Badge className="ml-2">{studentStatusCounts.total}</Badge>
                </Button>
                <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <UserCheck className="h-4 w-4" /> Active <Badge variant="secondary" className="ml-2 bg-green-200 text-green-900">{studentStatusCounts.Active}</Badge>
                </Button>
                 <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <UserX className="h-4 w-4" /> Inactive <Badge variant="secondary" className="ml-2 bg-red-200 text-red-900">{studentStatusCounts.Inactive}</Badge>
                </Button>
                 <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <GraduationCap className="h-4 w-4" /> Graduated <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-900">{studentStatusCounts.Graduated}</Badge>
                </Button>
                 <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <ArrowUpDown className="h-4 w-4" /> Continuing <Badge variant="secondary" className="ml-2 bg-orange-200 text-orange-900">{studentStatusCounts.Continuing}</Badge>
                </Button>
            </div>
            )}
          <div className="flex flex-wrap items-center py-4 gap-2">
            <Input
              placeholder="Filter by student name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-xs"
            />
             <Select
              value={(table.getColumn("gender")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("gender")?.setFilterValue(value === "all" ? undefined : value)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by Gender" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
            </Select>
            <Select
              value={(table.getColumn("house")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("house")?.setFilterValue(value === "all" ? undefined : value)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by House" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Houses</SelectItem>
                    <SelectItem value="Ambassadors">Ambassadors</SelectItem>
                    <SelectItem value="Royals">Royals</SelectItem>
                    <SelectItem value="Dependable">Dependable</SelectItem>
                    <SelectItem value="Jubilee">Jubilee</SelectItem>
                </SelectContent>
            </Select>
            <Select
              value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                    <SelectItem value="Continuing">Continuing</SelectItem>
                </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update the student's information below.</DialogDescription>
          </DialogHeader>
           <ScrollArea className="h-[60vh] pr-6">
              <Tabs defaultValue="student-details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="student-details">Student Details</TabsTrigger>
                        <TabsTrigger value="parent-details">Parent Details</TabsTrigger>
                    </TabsList>
                    <TabsContent value="student-details" className="mt-4">
                         <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Avatar</Label>
                                <div className="col-span-3">
                                    <ImageUpload
                                        currentImage={editStudent.avatarUrl}
                                        onFileChange={(file) => handleFileChange(file, 'edit')}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="admissionNo" className="text-right">Admission No.</Label>
                                <Input id="admissionNo" className="col-span-3" value={editStudent.admissionNo || ""} disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rollNo" className="text-right">Roll No.</Label>
                                <Input id="rollNo" className="col-span-3" value={editStudent.rollNo || ""} disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Full Name</Label>
                                <Input id="name" placeholder="John Doe" className="col-span-3" value={editStudent.name || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" type="email" placeholder="student@school.edu" className="col-span-3" value={editStudent.email || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Date of Birth</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !dob && "text-muted-foreground"
                                        )}
                                        disabled={isLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dob}
                                        onSelect={setDob}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="age" className="text-right">Age</Label>
                                <Input id="age" className="col-span-3" value={age !== undefined ? age : "Select DOB"} disabled />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="placeOfBirth" className="text-right">Place of Birth</Label>
                                <Input id="placeOfBirth" placeholder="City, Country" className="col-span-3" value={editStudent.placeOfBirth || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="gender" className="text-right">Gender</Label>
                                <Select onValueChange={(value) => setEditStudent(prev => ({ ...prev, gender: value as any}))} value={editStudent.gender} disabled={isLoading}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="house" className="text-right">House</Label>
                                <Select onValueChange={(value: Student["house"]) => setEditStudent(prev => ({...prev, house: value}))} value={editStudent.house} disabled={isLoading}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select house" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ambassadors">Ambassadors</SelectItem>
                                        <SelectItem value="Royals">Royals</SelectItem>
                                        <SelectItem value="Dependable">Dependable</SelectItem>
                                        <SelectItem value="Jubilee">Jubilee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nationality" className="text-right">Nationality</Label>
                                <Input id="nationality" placeholder="e.g., American" className="col-span-3" value={editStudent.nationality || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="hometown" className="text-right">Hometown</Label>
                                <Input id="hometown" placeholder="City, State" className="col-span-3" value={editStudent.hometown || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right">Address</Label>
                                <Input id="address" placeholder="123 Main St, Anytown" className="col-span-3" value={editStudent.address || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                <Select value={editStudent.status} onValueChange={(value: Student["status"]) => setEditStudent(prev => ({...prev, status: value}))} disabled={isLoading}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Graduated">Graduated</SelectItem>
                                        <SelectItem value="Continuing">Continuing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="parent-details" className="mt-4">
                       <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="parentName" className="text-right">Parent's Name</Label>
                                <Input id="parentName" placeholder="Jane Doe" className="col-span-3" value={editStudent.parentName || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="parentPhone" className="text-right">Parent's Phone</Label>
                                <Input id="parentPhone" placeholder="+1 123 456 7890" className="col-span-3" value={editStudent.parentPhone || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="parentEmail" className="text-right">Parent's Email</Label>
                                <Input id="parentEmail" type="email" placeholder="parent@example.com" className="col-span-3" value={editStudent.parentEmail || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
          </ScrollArea>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateStudent} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
