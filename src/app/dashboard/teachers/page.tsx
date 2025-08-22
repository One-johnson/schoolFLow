
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
} from "lucide-react"

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
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
}

// Function to generate a teacher ID
const generateTeacherId = (department: string): string => {
  const year = new Date().getFullYear().toString().slice(-2)
  const classType = 'T' // for Teacher
  const deptChar = department.length > 0 ? department.charAt(0).toUpperCase() : 'X'
  const randomPart = Math.random().toString().slice(2, 8)
  return `${year}${classType}${deptChar}${randomPart}`
}


export default function TeachersPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null)

  const {
    data: teachers,
    loading,
    addDataWithId,
    updateData,
    deleteData,
  } = useDatabase<Teacher>("teachers")
  const { addData: addNotification } = useDatabase("notifications")
  const { toast } = useToast()

  const [newTeacher, setNewTeacher] = React.useState<Partial<Omit<Teacher, 'id' | 'status'>>>({});
  const [editTeacher, setEditTeacher] = React.useState<Partial<Teacher>>({});

  const [dob, setDob] = React.useState<Date | undefined>();
  const [doe, setDoe] = React.useState<Date | undefined>();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, form: 'new' | 'edit') => {
      const { id, value } = e.target;
      if (form === 'new') {
        setNewTeacher(prev => ({...prev, [id]: value}));
      } else {
        setEditTeacher(prev => ({...prev, [id]: value}));
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
    try {
      const teacherId = generateTeacherId(newTeacher.department)
      await addDataWithId(teacherId, {
        ...newTeacher,
        status: 'Active',
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
        dateOfEmployment: doe ? format(doe, "yyyy-MM-dd") : undefined,
      })
      await addNotification({
        type: 'teacher_added',
        message: `New teacher "${newTeacher.name}" was added.`,
        read: false,
      })
      toast({ title: "Success", description: "Teacher added." })
      resetFormStates();
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to add teacher.", variant: "destructive" })
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
    try {
      await updateData(selectedTeacher.id, {
        ...editTeacher,
        dateOfBirth: dob ? format(dob, "yyyy-MM-dd") : undefined,
        dateOfEmployment: doe ? format(doe, "yyyy-MM-dd") : undefined,
      })
      toast({ title: "Success", description: "Teacher updated." })
      setIsEditDialogOpen(false)
      resetFormStates()
      setSelectedTeacher(null)
    } catch (error) {
      toast({ title: "Error", description: "Failed to update teacher.", variant: "destructive" })
    }
  }

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteData(id)
      toast({ title: "Success", description: "Teacher deleted." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" })
    }
  }

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
                <span className="capitalize">{teacher.name}</span>
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
      accessorKey: "employmentType",
      header: "Employment Type",
      cell: ({ row }) => <div className="capitalize">{row.getValue("employmentType") || "N/A"}</div>,
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
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTeacher(teacher.id)}>Delete</AlertDialogAction>
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Teacher Directory</CardTitle>
          <CardDescription>Manage teacher profiles and information.</CardDescription>
        </div>
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
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" placeholder="Full Name" className="col-span-3" value={newTeacher.name || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" placeholder="teacher@school.edu" className="col-span-3" value={newTeacher.email || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right">Department</Label>
                    <Input id="department" placeholder="e.g., Science" className="col-span-3" value={newTeacher.department || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <Input id="contact" placeholder="Phone number" className="col-span-3" value={newTeacher.contact || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date of Birth</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("col-span-3 justify-start text-left font-normal", !dob && "text-muted-foreground")}
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
                    <Select onValueChange={(value) => setNewTeacher(prev => ({ ...prev, employmentType: value as any}))} value={newTeacher.employmentType}>
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
                    <Input id="academicQualification" placeholder="e.g., M.Sc. Physics" className="col-span-3" value={newTeacher.academicQualification || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="avatarUrl" className="text-right">Avatar URL</Label>
                    <Input id="avatarUrl" placeholder="https://example.com/avatar.png" className="col-span-3" value={newTeacher.avatarUrl || ""} onChange={(e) => handleInputChange(e, 'new')} />
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="submit" onClick={handleAddTeacher}>Save Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter by email..."
              value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("email")?.setFilterValue(event.target.value)
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
                {loading ? (
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
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" className="col-span-3" value={editTeacher.name || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" value={editTeacher.email || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">Department</Label>
                        <Input id="department" className="col-span-3" value={editTeacher.department || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact" className="text-right">Contact</Label>
                        <Input id="contact" placeholder="Phone number" className="col-span-3" value={editTeacher.contact || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date of Birth</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn("col-span-3 justify-start text-left font-normal", !dob && "text-muted-foreground")}
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
                        <Select onValueChange={(value) => setEditTeacher(prev => ({ ...prev, employmentType: value as any}))} value={editTeacher.employmentType}>
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
                        <Input id="academicQualification" placeholder="e.g., M.Sc. Physics" className="col-span-3" value={editTeacher.academicQualification || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="avatarUrl" className="text-right">Avatar URL</Label>
                        <Input id="avatarUrl" placeholder="https://example.com/avatar.png" className="col-span-3" value={editTeacher.avatarUrl || ""} onChange={(e) => handleInputChange(e, 'edit')} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={editTeacher.status} onValueChange={(value: Teacher["status"]) => setEditTeacher(prev => ({...prev, status: value}))}>
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
            <Button type="submit" onClick={handleUpdateTeacher}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

    