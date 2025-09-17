
"use client";

import * as React from "react";
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
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Pencil,
  Loader2,
  FileDown,
  UserPlus,
  BookOpen,
  Edit,
  X,
  LayoutGrid,
  List,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/hooks/use-database";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MultiSelectPopover } from "@/components/ui/multi-select-popover";

type ClassDepartment = "Nursery" | "Kindergarten" | "Primary" | "Junior High";

type Class = {
  id: string;
  name: string;
  teacherId?: string;
  studentIds?: Record<string, boolean>;
  status: "Active" | "Inactive";
  department?: ClassDepartment;
};

type Student = { id: string; name: string; };
type Teacher = { id: string; name: string; };

const departmentColors: Record<ClassDepartment, string> = {
    Nursery: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    Kindergarten: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    Primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Junior High": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
};


export default function ClassesPage() {
  const { data: classes, addData: addClass, updateData: updateClass, deleteData: deleteClass } = useDatabase<Class>('classes');
  const { data: students } = useDatabase<Student>('students');
  const { data: teachers } = useDatabase<Teacher>('teachers');
  const { addData: addNotification } = useDatabase('notifications');
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [viewType, setViewType] = React.useState<"table" | "card">("table");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editClassState, setEditClassState] = useState<Partial<Class>>({});

  const [newClasses, setNewClasses] = useState<Partial<Omit<Class, 'id' | 'status'>>[]>([{ name: "" }]);
  const [sharedDepartment, setSharedDepartment] = React.useState<ClassDepartment | undefined>();
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkUpdateState, setBulkUpdateState] = React.useState<{ status?: Class["status"] }>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const teachersMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

  const handleAddClassRow = () => setNewClasses(prev => [...prev, { name: "" }]);
  const handleRemoveClassRow = (index: number) => setNewClasses(prev => prev.filter((_, i) => i !== index));
  const handleClassNameChange = (index: number, name: string) => {
    const updated = [...newClasses];
    updated[index].name = name;
    setNewClasses(updated);
  };

  const handleCreateMultipleClasses = async () => {
    const validClasses = newClasses.filter(c => c.name && c.name.trim() !== "");
    if (validClasses.length === 0) {
      toast({ title: "Error", description: "At least one class name is required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
        const classPromises = validClasses.map(c => 
            addClass({ 
                name: c.name!, 
                status: "Active",
                department: sharedDepartment,
            } as Omit<Class, 'id'>)
        );

        await Promise.all(classPromises);
        
        await addNotification({
            type: 'class_created',
            message: `${validClasses.length} new class(es) were created.`,
            read: false,
        });

      toast({ title: "Success", description: `${validClasses.length} classes created.` });
      setNewClasses([{ name: "" }]);
      setSharedDepartment(undefined);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create classes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignDialog = (cls: Class) => {
    setSelectedClass(cls);
    setSelectedTeacherId(cls.teacherId);
    setSelectedStudentIds(cls.studentIds ? Object.keys(cls.studentIds) : []);
    setIsAssignDialogOpen(true);
  };
  
  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls);
    setEditClassState(cls);
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    if (!selectedClass || !editClassState) return;
    setIsLoading(true);
    try {
        await updateClass(selectedClass.id, {
            name: editClassState.name,
            status: editClassState.status,
            department: editClassState.department
        });
        toast({ title: "Success", description: "Class updated." });
        setIsEditDialogOpen(false);
        setSelectedClass(null);
    } catch (error) {
        toast({ title: "Error", description: "Failed to update class.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClass) return;

    const studentIdsObject = selectedStudentIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setIsLoading(true);
    try {
      await updateClass(selectedClass.id, {
        teacherId: selectedTeacherId,
        studentIds: studentIdsObject
      });
      toast({ title: "Success", description: "Assignments updated." });
      setIsAssignDialogOpen(false);
      setSelectedClass(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update assignments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteClass = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteClass(id);
      toast({ title: "Success", description: "Class deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete class.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMultipleClasses = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    setIsLoading(true);
    const deletionPromises = selectedRows.map(row => deleteClass(row.original.id));
    try {
      await Promise.all(deletionPromises);
      toast({ title: "Success", description: `${selectedRows.length} classes deleted.` });
      table.toggleAllPageRowsSelected(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete selected classes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBulkUpdate = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    if (Object.keys(bulkUpdateState).length === 0) {
        toast({ title: "No changes specified", variant: "destructive"});
        return;
    }

    setIsLoading(true);
    try {
        const updatePromises = selectedRows.map(row => updateClass(row.original.id, bulkUpdateState));
        await Promise.all(updatePromises);
        toast({ title: "Success", description: `${selectedRows.length} classes updated.`});
        setIsBulkUpdateDialogOpen(false);
        setBulkUpdateState({});
        table.toggleAllPageRowsSelected(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to bulk update.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };


  const columns: ColumnDef<Class>[] = [
    { id: "select", header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />, enableSorting: false, enableHiding: false },
    { accessorKey: "name", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Class Name <ArrowUpDown className="ml-2 h-4 w-4" /></Button> },
    { accessorKey: "department", header: "Department", cell: ({ row }) => {
        const dept = row.original.department;
        if (!dept) return "N/A";
        return <Badge className={cn("border-transparent", departmentColors[dept])}>{dept}</Badge>
    }},
    { accessorKey: "teacherId", header: "Teacher", cell: ({ row }) => teachersMap.get(row.original.teacherId || '')?.name || 'Unassigned' },
    { accessorKey: "studentIds", header: "Students", cell: ({ row }) => Object.keys(row.original.studentIds || {}).length },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "Active" ? "default" : "secondary"} className={row.original.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{row.original.status}</Badge> },
    { id: "actions", enableHiding: false, cell: ({ row }) => (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditDialog(row.original)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAssignDialog(row.original)}><UserPlus className="mr-2 h-4 w-4" /> Assign</DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the class.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClass(row.original.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      ),
    },
  ];

  const table = useReactTable({
    data: classes,
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
  });
  
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  
  const filteredClasses = table.getRowModel().rows.map(row => row.original);

  const ClassCard = ({ cls }: { cls: Class }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <BookOpen className="h-6 w-6"/>
                    </div>
                    <div>
                        <CardTitle>{cls.name}</CardTitle>
                        {cls.department && <Badge className={cn("mt-2 border-transparent", departmentColors[cls.department])}>{cls.department}</Badge>}
                    </div>
                 </div>
                 <AlertDialog>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(cls)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAssignDialog(cls)}><UserPlus className="mr-2 h-4 w-4" /> Assign</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></AlertDialogTrigger>
                    </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the class.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClass(cls.id)} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <div>
                <p className="text-sm font-medium text-muted-foreground">Class Teacher</p>
                <p>{teachersMap.get(cls.teacherId || '')?.name || 'Unassigned'}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="flex items-center gap-2"><Users className="h-4 w-4"/> {Object.keys(cls.studentIds || {}).length}</p>
            </div>
        </CardContent>
        <CardFooter>
             <Badge variant={cls.status === "Active" ? "default" : "secondary"} className={cls.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{cls.status}</Badge>
        </CardFooter>
    </Card>
  );


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and assign students and teachers to classes.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setNewClasses([{name: ""}]); setSharedDepartment(undefined); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Create New Classes</DialogTitle><DialogDescription>Add one or more classes and assign a department.</DialogDescription></DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1"><div className="space-y-4 p-4">
              {newClasses.map((c, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input placeholder={`Class Name ${index + 1}`} value={c.name || ''} onChange={e => handleClassNameChange(index, e.target.value)} />
                    {newClasses.length > 1 && <Button variant="ghost" size="icon" onClick={() => handleRemoveClassRow(index)}><X className="h-4 w-4 text-destructive"/></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddClassRow}><PlusCircle className="mr-2 h-4 w-4"/>Add another class</Button>
              <div className="space-y-2 pt-4">
                <Label>Department (for all new classes)</Label>
                <Select onValueChange={(v: ClassDepartment) => setSharedDepartment(v)} value={sharedDepartment}>
                    <SelectTrigger><SelectValue placeholder="Select a department"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="Junior High">Junior High</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div></ScrollArea>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateMultipleClasses} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Classes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center gap-4">
                <Input placeholder="Filter by class name..." value={(table.getColumn("name")?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)} className="max-w-sm"/>
                <Select value={(table.getColumn("department")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("department")?.setFilterValue(value === "all" ? undefined : value)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Department"/></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Departments</SelectItem><SelectItem value="Nursery">Nursery</SelectItem><SelectItem value="Kindergarten">Kindergarten</SelectItem><SelectItem value="Primary">Primary</SelectItem><SelectItem value="Junior High">Junior High</SelectItem></SelectContent>
                </Select>
                <Select value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"} onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Status"/></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                        <Button variant={viewType === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('table')}><List className="h-4 w-4"/></Button>
                        <Button variant={viewType === 'card' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewType('card')}><LayoutGrid className="h-4 w-4"/></Button>
                    </div>
                    {viewType === 'table' && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Columns <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{table.getAllColumns().filter(c => c.getCanHide()).map(c => (<DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>{c.id}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu>}
                </div>
            </div>
             {viewType === 'table' && selectedRowCount > 0 && (
                <div className="mt-4 flex gap-2">
                    <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Update ({selectedRowCount})</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Bulk Update Status</DialogTitle><DialogDescription>Apply a new status to all {selectedRowCount} selected classes.</DialogDescription></DialogHeader>
                            <div className="py-4"><Label>New Status</Label><Select onValueChange={(v: Class["status"]) => setBulkUpdateState({status: v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
                            <DialogFooter><Button onClick={handleBulkUpdate} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Apply Update</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete ({selectedRowCount})</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {selectedRowCount} selected classes.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMultipleClasses} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </CardHeader>
        <CardContent>
            {viewType === 'table' ? (
              <>
                <div className="rounded-md border">
                    <Table>
                    <TableHeader>{table.getHeaderGroups().map(hg => (<TableRow key={hg.id}>{hg.headers.map(h => (<TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map(cell => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>
                        ))
                        ) : (
                        <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.</div>
                    <div className="space-x-2"><Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button><Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button></div>
                </div>
              </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClasses.length > 0 ? (
                        filteredClasses.map(cls => <ClassCard key={cls.id} cls={cls} />)
                    ) : <p className="col-span-full text-center text-muted-foreground">No classes found.</p>}
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Edit Class Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Class</DialogTitle><DialogDescription>Update the class details.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="name" className="text-right">Class Name</Label><Input id="name" className="col-span-3" value={editClassState?.name || ''} onChange={(e) => setEditClassState({...editClassState, name: e.target.value})} disabled={isLoading} /></div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Department</Label>
                <Select value={editClassState.department} onValueChange={(v: ClassDepartment) => setEditClassState(p => ({...p, department: v}))} disabled={isLoading}>
                    <SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="Nursery">Nursery</SelectItem><SelectItem value="Kindergarten">Kindergarten</SelectItem><SelectItem value="Primary">Primary</SelectItem><SelectItem value="Junior High">Junior High</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Status</Label><Select value={editClassState?.status} onValueChange={(value: "Active" | "Inactive") => setEditClassState(prev => ({...prev, status: value}))} disabled={isLoading}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button type="submit" onClick={handleUpdateClass} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>


      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Assign to {selectedClass?.name}</DialogTitle><DialogDescription>Assign a teacher and select students for this class.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={isLoading}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                <SelectContent>{teachers.map(teacher => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Students</Label>
              <div className="col-span-3">
                <MultiSelectPopover 
                  options={students.map(s => ({ value: s.id, label: s.name }))}
                  selected={selectedStudentIds}
                  onChange={setSelectedStudentIds}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <DialogFooter><Button type="submit" onClick={handleAssign} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Assignments</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

