
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
  X,
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MultiSelectPopover } from "@/components/ui/multi-select-popover"
import { ScrollArea } from "@/components/ui/scroll-area"

type SubjectLevel = "Nursery" | "Kindergarten" | "Primary" | "Junior High";

type Subject = {
  id: string;
  name: string;
  code: string;
  classIds?: Record<string, boolean>;
  teacherIds?: Record<string, boolean>;
  level?: SubjectLevel;
}

type Teacher = { id: string; name: string };
type Class = { id: string; name: string };

const generateSubjectCode = (subjectName: string): string => {
    if (!subjectName) return Math.random().toString().slice(2, 8);
    const namePart = subjectName.slice(0, 3).toUpperCase();
    const randomPart = Math.random().toString().slice(2, 6);
    return `${namePart}${randomPart}`;
};

const levelColors: Record<SubjectLevel, string> = {
    Nursery: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    Kindergarten: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    Primary: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Junior High": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
}

const filterClassesByLevel = (classes: Class[], level?: SubjectLevel): Class[] => {
    if (!level) return classes;
    switch (level) {
        case "Nursery":
            return classes.filter(c => c.name.toLowerCase().includes("nursery"));
        case "Kindergarten":
            return classes.filter(c => c.name.toLowerCase().includes("kindergarten"));
        case "Primary":
            return classes.filter(c => c.name.toLowerCase().includes("primary") || c.name.toLowerCase().includes("basic 1") || c.name.toLowerCase().includes("basic 2") || c.name.toLowerCase().includes("basic 3") || c.name.toLowerCase().includes("basic 4") || c.name.toLowerCase().includes("basic 5") || c.name.toLowerCase().includes("basic 6"));
        case "Junior High":
            return classes.filter(c => c.name.toLowerCase().includes("basic 7") || c.name.toLowerCase().includes("basic 8") || c.name.toLowerCase().includes("basic 9") || c.name.toLowerCase().includes("jhs"));
        default:
            return classes;
    }
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
  
  const [newSubjects, setNewSubjects] = React.useState<Partial<Omit<Subject, 'id' | 'code'>>[]>([{ name: "" }]);
  const [sharedLevel, setSharedLevel] = React.useState<SubjectLevel | undefined>();
  const [sharedClassIds, setSharedClassIds] = React.useState<string[]>([]);
  const [sharedTeacherIds, setSharedTeacherIds] = React.useState<string[]>([]);

  const [editSubject, setEditSubject] = React.useState<Partial<Subject>>({});

  const { data: subjects, loading: dataLoading, addData, updateData, deleteData } = useDatabase<Subject>("subjects")
  const { data: teachers } = useDatabase<Teacher>("teachers")
  const { data: classes } = useDatabase<Class>("classes")
  const { toast } = useToast()

  const teachersMap = React.useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
  const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  const availableClassesForNew = React.useMemo(() => filterClassesByLevel(classes, sharedLevel), [classes, sharedLevel]);
  const availableClassesForEdit = React.useMemo(() => filterClassesByLevel(classes, editSubject.level), [classes, editSubject.level]);

  React.useEffect(() => {
    if (sharedLevel) {
        const availableClassIds = new Set(availableClassesForNew.map(c => c.id));
        const filteredSelected = sharedClassIds.filter(id => availableClassIds.has(id));
        if(filteredSelected.length !== sharedClassIds.length) {
            setSharedClassIds(filteredSelected);
        }
    }
  }, [sharedLevel, availableClassesForNew, sharedClassIds]);

  React.useEffect(() => {
    if (editSubject.level) {
        const availableClassIds = new Set(availableClassesForEdit.map(c => c.id));
        const currentSelected = editSubject.classIds ? Object.keys(editSubject.classIds) : [];
        const filteredSelected = currentSelected.filter(id => availableClassIds.has(id));
        if(filteredSelected.length !== currentSelected.length) {
            setEditSubject(p => ({...p, classIds: filteredSelected.reduce((acc, id) => ({...acc, [id]: true}), {}) }));
        }
    }
  }, [editSubject.level, availableClassesForEdit, editSubject.classIds]);

  const handleAddSubjectRow = () => {
    setNewSubjects(prev => [...prev, { name: "" }]);
  };
  
  const handleRemoveSubjectRow = (index: number) => {
    setNewSubjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubjectNameChange = (index: number, name: string) => {
    const updatedSubjects = [...newSubjects];
    updatedSubjects[index].name = name;
    setNewSubjects(updatedSubjects);
  };
  
  const handleAddMultipleSubjects = async () => {
    const validSubjects = newSubjects.filter(s => s.name && s.name.trim() !== "");
    if(validSubjects.length === 0) {
        toast({ title: "Error", description: "At least one subject name is required.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
        const classIdsObject = sharedClassIds.reduce((acc, id) => ({...acc, [id]: true}), {});
        const teacherIdsObject = sharedTeacherIds.reduce((acc, id) => ({...acc, [id]: true}), {});
        
        const subjectPromises = validSubjects.map(subject => {
            const subjectCode = generateSubjectCode(subject.name!);
            const dataToSave: Omit<Subject, 'id'> = {
                name: subject.name!,
                code: subjectCode,
                level: sharedLevel,
                classIds: classIdsObject,
                teacherIds: teacherIdsObject,
            };
            return addData(dataToSave);
        });

        await Promise.all(subjectPromises);
        toast({ title: "Success", description: `${validSubjects.length} subjects added.` });
        
        // Reset form
        setNewSubjects([{ name: "" }]);
        setSharedLevel(undefined);
        setSharedClassIds([]);
        setSharedTeacherIds([]);
        setIsCreateDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to add subjects.", variant: "destructive" });
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

    const dataToUpdate = {
        ...editSubject,
        classIds: editSubject.classIds ? Object.keys(editSubject.classIds).reduce((acc, id) => ({...acc, [id]: true}), {}) : {},
        teacherIds: editSubject.teacherIds ? Object.keys(editSubject.teacherIds).reduce((acc, id) => ({...acc, [id]: true}), {}) : {},
    };

    try {
      await updateData(selectedSubject.id, dataToUpdate);
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
    { 
        accessorKey: "level", 
        header: "Level", 
        cell: ({ row }) => {
            const level = row.getValue("level") as SubjectLevel | undefined;
            if (!level) return 'N/A';
            return <Badge className={cn("border-transparent", levelColors[level])}>{level}</Badge>
        }
    },
    { 
        accessorKey: "classIds", 
        header: "Classes", 
        cell: ({ row }) => {
            const classIds = row.getValue("classIds") as Record<string, boolean> | undefined;
            if (!classIds || Object.keys(classIds).length === 0) return 'N/A';
            return <div className="flex flex-wrap gap-1">{Object.keys(classIds).map(id => <Badge key={id} variant="secondary">{classesMap.get(id)}</Badge>)}</div>
        } 
    },
    { 
        accessorKey: "teacherIds", 
        header: "Teachers", 
        cell: ({ row }) => {
            const teacherIds = row.getValue("teacherIds") as Record<string, boolean> | undefined;
            if (!teacherIds || Object.keys(teacherIds).length === 0) return 'N/A';
            return <div className="flex flex-wrap gap-1">{Object.keys(teacherIds).map(id => <Badge key={id} variant="outline">{teachersMap.get(id)}</Badge>)}</div>
        } 
    },
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
          <DialogTrigger asChild><Button onClick={() => setNewSubjects([{name: ''}])}><PlusCircle className="mr-2 h-4 w-4" /> Add Subject</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Add New Subjects</DialogTitle><DialogDescription>Fill in the details for the new subjects.</DialogDescription></DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-4">
                {newSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input 
                            placeholder={`Subject Name ${index + 1}`} 
                            value={subject.name || ""} 
                            onChange={(e) => handleSubjectNameChange(index, e.target.value)} 
                            disabled={isLoading}
                        />
                        {newSubjects.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSubjectRow(index)} disabled={isLoading}>
                                <X className="h-4 w-4 text-destructive"/>
                            </Button>
                        )}
                    </div>
                ))}
                 <Button variant="outline" size="sm" onClick={handleAddSubjectRow} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add another subject
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                     <div className="space-y-2">
                        <Label>Level (for all new subjects)</Label>
                         <Select onValueChange={(value: SubjectLevel) => setSharedLevel(value)} value={sharedLevel} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Nursery">Nursery</SelectItem>
                                <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                <SelectItem value="Primary">Primary</SelectItem>
                                <SelectItem value="Junior High">Junior High</SelectItem>
                            </SelectContent>
                            </Select>
                     </div>
                     <div className="space-y-2">
                        <Label>Classes (for all new subjects)</Label>
                        <MultiSelectPopover 
                            options={availableClassesForNew.map(c => ({value: c.id, label: c.name}))}
                            selected={sharedClassIds}
                            onChange={setSharedClassIds}
                            disabled={isLoading || !sharedLevel}
                            placeholder={!sharedLevel ? "Select a level first" : "Assign to classes..."}
                        />
                     </div>
                </div>
                 <div className="space-y-2">
                    <Label>Teachers (for all new subjects)</Label>
                     <MultiSelectPopover 
                        options={teachers.map(t => ({value: t.id, label: t.name}))}
                        selected={sharedTeacherIds}
                        onChange={setSharedTeacherIds}
                        disabled={isLoading}
                        placeholder="Assign to teachers..."
                    />
                 </div>
              </div>
            </ScrollArea>
            <DialogFooter>
                <Button type="submit" onClick={handleAddMultipleSubjects} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Subjects
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="flex items-center py-4 gap-2">
            <Input placeholder="Filter by subject name..." value={(table.getColumn("name")?.getFilterValue() as string) ?? ""} onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)} className="max-w-sm" />
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Edit Subject</DialogTitle><DialogDescription>Update the subject details below.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" className="col-span-3" value={editSubject.name || ""} onChange={(e) => setEditSubject(p => ({ ...p, name: e.target.value }))} disabled={isLoading} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Code</Label>
                <Input id="code" className="col-span-3" value={editSubject.code || ""} disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">Level</Label>
                 <Select onValueChange={(value: SubjectLevel) => setEditSubject(p => ({ ...p, level: value }))} value={editSubject.level} disabled={isLoading}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a level" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Junior High">Junior High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Classes</Label>
                 <div className="col-span-3">
                    <MultiSelectPopover 
                        options={availableClassesForEdit.map(c => ({value: c.id, label: c.name}))}
                        selected={editSubject.classIds ? Object.keys(editSubject.classIds) : []}
                        onChange={(selected) => setEditSubject(p => ({ ...p, classIds: selected.reduce((acc, id) => ({...acc, [id]: true}), {})}))}
                        disabled={isLoading || !editSubject.level}
                        placeholder={!editSubject.level ? "Select a level first" : "Assign to classes..."}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Teachers</Label>
                 <div className="col-span-3">
                    <MultiSelectPopover 
                        options={teachers.map(t => ({value: t.id, label: t.name}))}
                        selected={editSubject.teacherIds ? Object.keys(editSubject.teacherIds) : []}
                        onChange={(selected) => setEditSubject(p => ({ ...p, teacherIds: selected.reduce((acc, id) => ({...acc, [id]: true}), {})}))}
                        disabled={isLoading}
                    />
                 </div>
              </div>
            </div>
          <DialogFooter><Button type="submit" onClick={handleUpdateSubject} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
