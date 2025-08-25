
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn, generateStudentId } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"

type Student = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Graduated" | "Continuing"
  dateOfBirth?: string
  placeOfBirth?: string
  nationality?: string
  hometown?: string
  gender?: "Male" | "Female" | "Other"
  address?: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  avatarUrl?: string;
  createdAt: number;
}

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
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    email: false,
    dateOfBirth: false,
    placeOfBirth: false,
    hometown: false,
    address: false,
    parentEmail: false,
    nationality: false
  })
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    data: students,
    loading: dataLoading,
    addDataWithId,
    updateData,
    deleteData,
    uploadFile
  } = useDatabase<Student>("students")
  const { addData: addNotification } = useDatabase("notifications")
  const { toast } = useToast()

  const [newStudent, setNewStudent] = React.useState<Partial<Omit<Student, 'id' | 'status'>>>({});
  const [editStudent, setEditStudent] = React.useState<Partial<Student>>({});
  const [dob, setDob] = React.useState<Date | undefined>();

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
    try {
      const studentId = generateStudentId()
      const studentData = {
        ...newStudent,
        status: 'Active',
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
      } as Omit<Student, 'id'>;

      await addDataWithId(studentId, studentData);

      await addNotification({
        type: 'student_enrolled',
        message: `New student "${newStudent.name}" was enrolled.`,
        read: false,
      })
      toast({ title: "Success", description: "Student added. Account needs to be created separately." })
      setNewStudent({})
      setDob(undefined)
      setIsCreateDialogOpen(false)
    } catch (error: any) {
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
      await updateData(selectedStudent.id, {
        ...editStudent,
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
      })
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

  const handleDeleteStudent = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteData(id)
      toast({ title: "Success", description: "Student deleted." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" })
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
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("id")}</div>
      ),
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
  
  const age = calculateAge(dob);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>Manage student profiles and information.</CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by student name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
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
