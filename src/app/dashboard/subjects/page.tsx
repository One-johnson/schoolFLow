
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
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDatabase } from "@/hooks/use-database"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

type Subject = {
  id: string;
  name: string;
  code: string;
  classId?: string;
  teacherId?: string;
  level?: string;
}

type Teacher = { id: string; name: string };
type Class = { id: string; name: string };

const generateSubjectCode = (subjectName: string): string => {
    if (!subjectName) return Math.random().toString().slice(2, 8);
    const namePart = subjectName.slice(0, 3).toUpperCase();
    const randomPart = Math.random().toString().slice(2, 6);
    return `${namePart}${randomPart}`;
};

export default function SubjectsPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null)
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [newSubject, setNewSubject] = React.useState<Partial<Omit<Subject, 'id'>>>({});
  const [editSubject, setEditSubject] = React.useState<Partial<Subject>>({});

  const { data: subjects, loading: dataLoading, addData, updateData, deleteData } = useDatabase<Subject>("subjects")
  const { data: teachers } = useDatabase<Teacher>("teachers")
  const { data: classes } = useDatabase<Class>("classes")
  const { toast } = useToast()

  const teachersMap = React.useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  const handleAddSubject = async () => {
    if (!newSubject.name?.trim()) {
      toast({ title: "Error", description: "Subject name is required.", variant: "destructive" })
      return
    }
    setIsLoading(true);
    try {
      const subjectCode = generateSubjectCode(newSubject.name)
      await addData({ code: subjectCode, ...newSubject } as Omit<Subject, "id">)
      toast({ title: "Success", description: "Subject added." })
      setNewSubject({})
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({ title: "Error", description: "Failed to add subject.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setEditSubject(subject)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSubject = async () => {
    if (!selectedSubject || !editSubject) return
    setIsLoading(true);
    try {
      await updateData(selectedSubject.id, editSubject)
      toast({ title: "Success", description: "Subject updated." })
      setIsEditDialogOpen(false)
      setSelectedSubject(null)
      setEditSubject({})
    } catch (error) {
      toast({ title: "Error", description: "Failed to update subject.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteSubject = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteData(id)
      toast({ title: "Success", description: "Subject deleted." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subject.", variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }


  const columns: ColumnDef<Subject>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: "name", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => <div>{row.getValue("name")}</div> },
    { accessorKey: "code", header: "Code", cell: ({ row }) => <div>{row.getValue("code")}</div> },
    { accessorKey: "level", header: "Level/Grade", cell: ({ row }) => <div>{row.getValue("level") || 'N/A'}</div> },
    { accessorKey: "classId", header: "Class", cell: ({ row }) => <div>{classesMap.get(row.getValue("classId")) || 'N/A'}</div> },
    { accessorKey: "teacherId", header: "Teacher", cell: ({ row }) => <div>{teachersMap.get(row.getValue("teacherId")) || 'N/A'}</div> },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const subject = row.original
        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditDialog(subject)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the subject.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const table = useReactTable({
    data: subjects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subject Management</CardTitle>
          <CardDescription>Add, edit, and manage course subjects.</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button onClick={() => setNewSubject({})}><PlusCircle className="mr-2 h-4 w-4" /> Add Subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Subject</DialogTitle><DialogDescription>Fill in the details for the new subject.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" placeholder="e.g., Algebra II" className="col-span-3" value={newSubject.name || ""} onChange={(e) => setNewSubject(p => ({ ...p, name: e.target.value }))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">Level/Grade</Label>
                <Input id="level" placeholder="e.g., 11" className="col-span-3" value={newSubject.level || ""} onChange={(e) => setNewSubject(p => ({ ...p, level: e.target.value }))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classId" className="text-right">Class</Label>
                <Select onValueChange={(value) => setNewSubject(p => ({ ...p, classId: value }))} value={newSubject.classId} disabled={isLoading}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Assign a class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacherId" className="text-right">Teacher</Label>
                <Select onValueChange={(value) => setNewSubject(p => ({ ...p, teacherId: value }))} value={newSubject.teacherId} disabled={isLoading}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Assign a teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" onClick={handleAddSubject} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Subject</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center py-4 gap-2">
            <Input placeholder="Filter by subject name..." value={(table.getColumn("name")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)} className="max-w-sm" />
            <Select onValueChange={(value) => table.getColumn("classId")?.setFilterValue(value === "all" ? "" : value)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Class" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={(value) => table.getColumn("teacherId")?.setFilterValue(value === "all" ? "" : value)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Teacher" /></SelectTrigger><SelectContent><SelectItem value="all">All Teachers</SelectItem>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={(value) => table.getColumn("level")?.setFilterValue(value === "all" ? "" : value)}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Level" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem>{[...new Set(subjects.map(s => s.level).filter(Boolean))].map(level => <SelectItem key={level} value={level!}>{level}</SelectItem>)}</SelectContent></Select>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto">Columns <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (<DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>{column.id}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
              <TableBody>
                {dataLoading ? ([...Array(5)].map((_, i) => (<TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-8 w-full" /></TableCell></TableRow>))) : 
                table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))) : 
                (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.</div>
            <div className="space-x-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subject</DialogTitle><DialogDescription>Update the subject details below.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" className="col-span-3" value={editSubject.name || ""} onChange={(e) => setEditSubject(p => ({ ...p, name: e.target.value }))} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Code</Label>
                <Input id="code" className="col-span-3" value={editSubject.code || ""} onChange={(e) => setEditSubject(p => ({ ...p, code: e.target.value }))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">Level/Grade</Label>
                <Input id="level" className="col-span-3" value={editSubject.level || ""} onChange={(e) => setEditSubject(p => ({ ...p, level: e.target.value }))} disabled={isLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classId" className="text-right">Class</Label>
                <Select onValueChange={(value) => setEditSubject(p => ({ ...p, classId: value }))} value={editSubject.classId} disabled={isLoading}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Assign a class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacherId" className="text-right">Teacher</Label>
                <Select onValueChange={(value) => setEditSubject(p => ({ ...p, teacherId: value }))} value={editSubject.teacherId} disabled={isLoading}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Assign a teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          <DialogFooter><Button type="submit" onClick={handleUpdateSubject} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
