
"use client"

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
  Calendar as CalendarIcon,
  Loader2,
  FileDown,
  BookCopy,
  Book,
  Users,
  UserX,
  UserCheck,
} from "lucide-react"
import Link from "next/link"

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
import { cn, generateTeacherId } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"
import { serverTimestamp } from "firebase/database"

type Teacher = {
  id: string
  name: string
  department: string
  email: string
  status: "Active" | "On Leave" | "Retired"
  dateOfBirth?: string
  academicQualification?: string
  dateOfEmployment?: string
  avatarUrl?: string
  contact?: string
  employmentType?: "Full Time" | "Part Time" | "Contract"
  gender?: "Male" | "Female" | "Other"
  nationality?: string
  address?: string
  religion?: string
  createdAt: number;
  updatedAt?: number;
}

type Class = { id: string; name: string, teacherId?: string };

export default function TeachersPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    email: false,
    dateOfBirth: false,
    dateOfEmployment: false,
    gender: false,
    nationality: false,
    address: false,
    religion: false,
    createdAt: false,
    updatedAt: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    data: teachers,
    loading: dataLoading,
    addDataWithId,
    updateData,
    deleteData,
    uploadFile
  } = useDatabase<Teacher>("teachers")
  const { data: classes, updateData: updateClass } = useDatabase<Class>("classes");
  const { addData: addNotification } = useDatabase("notifications")
  const { toast } = useToast()

  const [newTeacher, setNewTeacher] = React.useState<Partial<Omit<Teacher, 'id' | 'status' | 'createdAt'>>>({});
  const [editTeacher, setEditTeacher] = React.useState<Partial<Teacher>>({});
  const [assignClassId, setAssignClassId] = React.useState<string | undefined>();

  const [dob, setDob] = React.useState<Date | undefined>();
  const [doe, setDoe] = React.useState<Date | undefined>();

  const teacherClassMap = React.useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach(c => {
        if(c.teacherId) {
            map.set(c.teacherId, c.name);
        }
    });
    return map;
  }, [classes]);

  const teacherStatusCounts = React.useMemo(() => {
    return teachers.reduce((acc, teacher) => {
      acc.total = (acc.total || 0) + 1;
      acc[teacher.status] = (acc[teacher.status] || 0) + 1;
      return acc;
    }, { total: 0, Active: 0, "On Leave": 0, Retired: 0 });
  }, [teachers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, form: 'new' | 'edit') => {
      const { id, value } = e.target;
      if (form === 'new') {
        setNewTeacher(prev => ({...prev, [id]: value}));
      } else {
        setEditTeacher(prev => ({...prev, [id]: value}));
      }
  }

   const handleFileChange = async (file: File | null, form: 'new' | 'edit') => {
      if (!file) return;
      setIsLoading(true);
      try {
          const downloadURL = await uploadFile(file, `avatars/teachers/${file.name}`);
           if (form === 'new') {
                setNewTeacher(prev => ({ ...prev, avatarUrl: downloadURL }));
            } else {
                setEditTeacher(prev => ({ ...prev, avatarUrl: downloadURL }));
            }
          toast({ title: "Image uploaded", description: "Avatar has been updated."});
      } catch (error) {
           toast({ title: "Upload failed", description: "Could not upload image.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }
  
  const resetFormStates = () => {
    setNewTeacher({});
    setEditTeacher({});
    setDob(undefined);
    setDoe(undefined);
  }

  const handleAddTeacher = async () => {
    if (!newTeacher.name?.trim() || !newTeacher.email?.trim() || !newTeacher.department?.trim()) {
      toast({ title: "Error", description: "Name, email, and department are required.", variant: "destructive" })
      return
    }
    setIsLoading(true);
    try {
      const teacherId = generateTeacherId(newTeacher.department || 'GENERAL')
      const teacherData = {
        ...newTeacher,
        status: 'Active',
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
        dateOfEmployment: doe ? format(doe, "yyyy-MM-dd") : undefined,
      } as Omit<Teacher, 'id' | 'createdAt'>

      await addDataWithId(teacherId, teacherData)

      await addNotification({
        type: 'teacher_added',
        message: `New teacher "${newTeacher.name}" was added.`,
        read: false,
      })
      toast({ title: "Success", description: "Teacher added. Account needs to be created separately." })
      resetFormStates();
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to add teacher: ${error.message}`, variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }
  
  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setEditTeacher(teacher)
    setDob(teacher.dateOfBirth ? new Date(teacher.dateOfBirth) : undefined)
    setDoe(teacher.dateOfEmployment ? new Date(teacher.dateOfEmployment) : undefined)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !editTeacher) return
    setIsLoading(true);
    try {
      await updateData(selectedTeacher.id, {
        ...editTeacher,
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
        dateOfEmployment: doe ? format(doe, "yyyy-MM-dd") : undefined,
        updatedAt: serverTimestamp(),
      })
      toast({ title: "Success", description: "Teacher updated." })
      setIsEditDialogOpen(false)
      resetFormStates()
      setSelectedTeacher(null)
    } catch (error) {
      toast({ title: "Error", description: "Failed to update teacher.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteData(id)
      toast({ title: "Success", description: "Teacher deleted." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleAssignToClass = async () => {
    const selectedTeacherIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    if(selectedTeacherIds.length > 1) {
        toast({ title: "Error", description: "Please select only one teacher to assign to a class.", variant: "destructive" });
        return;
    }
    if (selectedTeacherIds.length === 0) {
        toast({ title: "Error", description: "No teacher selected.", variant: "destructive" });
        return;
    }
     if (!assignClassId) {
        toast({ title: "Error", description: "Please select a class.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    try {
        const targetClass = classes.find(c => c.id === assignClassId);
        if(!targetClass) throw new Error("Class not found");

        await updateClass(assignClassId, { teacherId: selectedTeacherIds[0] });

        toast({ title: "Success", description: `Teacher assigned to ${targetClass.name}.` });
        setIsAssignDialogOpen(false);
        setAssignClassId(undefined);
        table.toggleAllPageRowsSelected(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to assign teacher.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const columns: ColumnDef<Teacher>[] = [
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
          const teacher = row.original;
          const initials = teacher.name.split(' ').map(n => n[0]).join('');
          return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <Link href={`/dashboard/teachers/${teacher.id}`} className="capitalize font-medium text-primary hover:underline">
                    {teacher.name}
                </Link>
            </div>
          )
      }
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => teacherClassMap.get(row.original.id) || <span className="text-muted-foreground">N/A</span>,
    },
     {
      accessorKey: "department",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Department
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("department")}</div>,
    },
    {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => <div className="lowercase">{row.getValue("contact")}</div>,
    },
    {
        accessorKey: "academicQualification",
        header: "Qualification",
        cell: ({ row }) => <div className="capitalize">{row.getValue("academicQualification")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Teacher["status"]
        const variant = {
          "Active": "default",
          "On Leave": "secondary",
          "Retired": "outline",
        }[status] as "default" | "secondary" | "outline" | undefined;
        
        const className = {
            "Active": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
            "On Leave": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
            "Retired": "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
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
     {
      accessorKey: "employmentType",
      header: "Employment Type",
      cell: ({ row }) => <div className="capitalize">{row.getValue("employmentType") || "N/A"}</div>,
    },
     // Hidden by default
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => <div>{row.getValue("dateOfBirth") ? format(new Date(row.getValue("dateOfBirth") as string), 'PPP') : 'N/A'}</div>,
    },
    {
      accessorKey: "dateOfEmployment",
      header: "Date of Employment",
      cell: ({ row }) => <div>{row.getValue("dateOfEmployment") ? format(new Date(row.getValue("dateOfEmployment") as string), 'PPP') : 'N/A'}</div>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <div className="capitalize">{row.getValue("gender")}</div>,
    },
    {
      accessorKey: "nationality",
      header: "Nationality",
      cell: ({ row }) => <div className="capitalize">{row.getValue("nationality")}</div>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <div className="capitalize">{row.getValue("address")}</div>,
    },
    {
      accessorKey: "religion",
      header: "Religion",
      cell: ({ row }) => <div className="capitalize">{row.getValue("religion")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const teacher = row.original

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
                <DropdownMenuItem onClick={() => openEditDialog(teacher)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Teacher
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                   <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Teacher
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
             <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the teacher account and remove their data from our servers.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTeacher(teacher.id)} disabled={isLoading}>
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
    data: teachers,
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

    const headers = ["ID", "Name", "Email", "Department", "Contact", "Status", "Qualification", "Gender"];
    const csvContent = [
        headers.join(','),
        ...rowsToExport.map(row => {
            const teacher = row.original;
            return [
                teacher.id,
                `"${teacher.name}"`,
                teacher.email,
                teacher.department,
                teacher.contact || 'N/A',
                teacher.status,
                `"${teacher.academicQualification || 'N/A'}"`,
                teacher.gender || 'N/A',
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teachers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: `${rowsToExport.length} teachers exported.` });
  };
  
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Teacher Directory</CardTitle>
          <CardDescription>Manage teacher profiles and information.</CardDescription>
        </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="mr-2 h-4 w-4"/>
                Export CSV {selectedRowsCount > 0 && `(${selectedRowsCount})`}
            </Button>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={selectedRowsCount !== 1}>
                        <Book className="mr-2 h-4 w-4"/>
                        Assign to Class
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Teacher to Class</DialogTitle>
                        <DialogDescription>
                            Select a class to assign the selected teacher to.
                        </DialogDescription>
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
                <Button onClick={resetFormStates}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Teacher
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>Fill in the details to add a new teacher to the system.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-6">
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Avatar</Label>
                        <div className="col-span-3">
                        <ImageUpload
                                currentImage={newTeacher.avatarUrl}
                                onFileChange={(file) => handleFileChange(file, 'new')}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" placeholder="Full Name" className="col-span-3" value={newTeacher.name || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" placeholder="teacher@school.edu" className="col-span-3" value={newTeacher.email || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">Department</Label>
                        <Input id="department" placeholder="e.g., Science" className="col-span-3" value={newTeacher.department || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input id="contact" placeholder="Phone number" className="col-span-3" value={newTeacher.contact || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date of Birth</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("col-span-3 justify-start text-left font-normal", !dob && "text-muted-foreground")}
                                disabled={isLoading}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={dob} onSelect={setDob} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date of Employment</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("col-span-3 justify-start text-left font-normal", !doe && "text-muted-foreground")}
                                disabled={isLoading}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {doe ? format(doe, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={doe} onSelect={setDoe} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employmentType" className="text-right">Employment Type</Label>
                        <Select onValueChange={(value) => setNewTeacher(prev => ({ ...prev, employmentType: value as any}))} value={newTeacher.employmentType} disabled={isLoading}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="academicQualification" className="text-right">Academic Qualification</Label>
                        <Input id="academicQualification" placeholder="e.g., M.Sc. Physics" className="col-span-3" value={newTeacher.academicQualification || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">Gender</Label>
                        <Select onValueChange={(value) => setNewTeacher(prev => ({ ...prev, gender: value as any}))} value={newTeacher.gender} disabled={isLoading}>
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
                        <Label htmlFor="nationality" className="text-right">Nationality</Label>
                        <Input id="nationality" placeholder="e.g., Nigerian" className="col-span-3" value={newTeacher.nationality || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Address</Label>
                        <Input id="address" placeholder="123 Main St, Anytown" className="col-span-3" value={newTeacher.address || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="religion" className="text-right">Religion</Label>
                        <Input id="religion" placeholder="e.g., Christianity" className="col-span-3" value={newTeacher.religion || ""} onChange={(e) => handleInputChange(e, 'new')} disabled={isLoading} />
                    </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                <Button type="submit" onClick={handleAddTeacher} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Teacher
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
         </div>
      </CardHeader>
      <CardContent>
        <div className="w-full">
            <div className="mb-4 flex flex-wrap items-center gap-6 rounded-md bg-muted p-1 sm:w-fit">
                <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" data-active={true}>
                    <Users className="h-4 w-4" /> All Teachers <Badge className="ml-2">{teacherStatusCounts.total}</Badge>
                </Button>
                <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <UserCheck className="h-4 w-4" /> Active <Badge variant="secondary" className="ml-2 bg-green-200 text-green-900">{teacherStatusCounts.Active}</Badge>
                </Button>
                 <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <UserX className="h-4 w-4" /> On Leave <Badge variant="secondary" className="ml-2 bg-yellow-200 text-yellow-900">{teacherStatusCounts["On Leave"]}</Badge>
                </Button>
                 <Button variant="ghost" className="h-8 justify-start gap-2 px-3 text-muted-foreground hover:bg-background hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm">
                    <UserX className="h-4 w-4" /> Retired <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-900">{teacherStatusCounts.Retired}</Badge>
                </Button>
            </div>
          <div className="flex flex-wrap items-center py-4 gap-2">
            <Input
              placeholder="Filter by teacher name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
             <Select
              value={(table.getColumn("gender")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("gender")?.setFilterValue(value === "all" ? undefined : value)}
            >
                <SelectTrigger className="w-[180px]">
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
              value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
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
                  [...Array(10)].map((_, i) => (
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

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update the teacher's information below.</DialogDescription>
          </DialogHeader>
           <ScrollArea className="h-[60vh] pr-6">
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Avatar</Label>
                        <div className="col-span-3">
                        <ImageUpload
                                currentImage={editTeacher.avatarUrl}
                                onFileChange={(file) => handleFileChange(file, 'edit')}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" className="col-span-3" value={editTeacher.name || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" value={editTeacher.email || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">Department</Label>
                        <Input id="department" className="col-span-3" value={editTeacher.department || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input id="contact" placeholder="Phone number" className="col-span-3" value={editTeacher.contact || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date of Birth</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("col-span-3 justify-start text-left font-normal", !dob && "text-muted-foreground")}
                                disabled={isLoading}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={dob} onSelect={setDob} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date of Employment</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("col-span-3 justify-start text-left font-normal", !doe && "text-muted-foreground")}
                                disabled={isLoading}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {doe ? format(doe, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={doe} onSelect={setDoe} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employmentType" className="text-right">Employment Type</Label>
                        <Select onValueChange={(value) => setEditTeacher(prev => ({ ...prev, employmentType: value as any}))} value={editTeacher.employmentType} disabled={isLoading}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="academicQualification" className="text-right">Academic Qualification</Label>
                        <Input id="academicQualification" placeholder="e.g., M.Sc. Physics" className="col-span-3" value={editTeacher.academicQualification || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">Gender</Label>
                        <Select onValueChange={(value) => setEditTeacher(prev => ({ ...prev, gender: value as any}))} value={editTeacher.gender} disabled={isLoading}>
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
                        <Label htmlFor="nationality" className="text-right">Nationality</Label>
                        <Input id="nationality" placeholder="e.g., Nigerian" className="col-span-3" value={editTeacher.nationality || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Address</Label>
                        <Input id="address" placeholder="123 Main St, Anytown" className="col-span-3" value={editTeacher.address || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="religion" className="text-right">Religion</Label>
                        <Input id="religion" placeholder="e.g., Christianity" className="col-span-3" value={editTeacher.religion || ""} onChange={(e) => handleInputChange(e, 'edit')} disabled={isLoading} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={editTeacher.status} onValueChange={(value: Teacher["status"]) => setEditTeacher(prev => ({...prev, status: value}))} disabled={isLoading}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="On Leave">On Leave</SelectItem>
                                <SelectItem value="Retired">Retired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </ScrollArea>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateTeacher} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
