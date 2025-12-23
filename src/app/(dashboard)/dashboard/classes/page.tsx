"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, MoreHorizontal, ChevronDown, LayoutGrid, LayoutList, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";

interface ClassFormData {
  name: string;
  level: string;
  academicYear: string;
  description: string;
}

interface SectionFormData {
  classId: string;
  name: string;
  capacity: string;
  classTeacherId: string;
  room: string;
}

interface ClassData {
  id: Id<"classes">;
  name: string;
  level: number;
  academicYear: string;
  sectionCount: number;
  description?: string;
}

interface SectionData {
  id: Id<"sections">;
  classId: string;
  className: string;
  name: string;
  capacity: number;
  room?: string;
  studentCount: number;
  classTeacher?: {
    id: Id<"users">;
    firstName: string;
    lastName: string;
  };
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("classes");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Classes state
  const [classSorting, setClassSorting] = useState<SortingState>([]);
  const [classColumnFilters, setClassColumnFilters] = useState<ColumnFiltersState>([]);
  const [classColumnVisibility, setClassColumnVisibility] = useState<VisibilityState>({});
  const [classRowSelection, setClassRowSelection] = useState({});
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState<boolean>(false);
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState<boolean>(false);
  const [isDeleteClassDialogOpen, setIsDeleteClassDialogOpen] = useState<boolean>(false);
  const [isBulkDeleteClassDialogOpen, setIsBulkDeleteClassDialogOpen] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | null>(null);
  const [classFormData, setClassFormData] = useState<ClassFormData>({
    name: "",
    level: "",
    academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    description: "",
  });

  // Sections state
  const [sectionSorting, setSectionSorting] = useState<SortingState>([]);
  const [sectionColumnFilters, setSectionColumnFilters] = useState<ColumnFiltersState>([]);
  const [sectionColumnVisibility, setSectionColumnVisibility] = useState<VisibilityState>({});
  const [sectionRowSelection, setSectionRowSelection] = useState({});
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState<boolean>(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState<boolean>(false);
  const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState<boolean>(false);
  const [isBulkDeleteSectionDialogOpen, setIsBulkDeleteSectionDialogOpen] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<Id<"sections"> | null>(null);
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>({
    classId: "",
    name: "",
    capacity: "40",
    classTeacherId: "",
    room: "",
  });

  const classes = useQuery(
    api.classes.getSchoolClasses,
    user?.schoolId ? { schoolId: user.schoolId } : "skip"
  );

  const sections = useQuery(
    api.sections.getSections,
    user?.schoolId ? { schoolId: user.schoolId } : "skip"
  );

  const teachers = useQuery(
    api.users.getSchoolUsers,
    user?.schoolId ? { schoolId: user.schoolId, role: "teacher" } : "skip"
  );

  const createClassMutation = useMutation(api.classes.createClass);
  const updateClassMutation = useMutation(api.classes.updateClass);
  const deleteClassMutation = useMutation(api.classes.deleteClass);

  const createSectionMutation = useMutation(api.sections.createSection);
  const updateSectionMutation = useMutation(api.sections.updateSection);
  const deleteSectionMutation = useMutation(api.sections.deleteSection);

  // Class columns
  const classColumns: ColumnDef<ClassData>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Class Name" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "level",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
        cell: ({ row }) => <Badge variant="outline">Level {row.getValue("level")}</Badge>,
      },
      {
        accessorKey: "academicYear",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Academic Year" />,
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("academicYear")}</div>,
      },
      {
        accessorKey: "sectionCount",
        header: "Sections",
        cell: ({ row }) => <Badge>{row.getValue("sectionCount")} sections</Badge>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const classRow = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditClassDialog(classRow.id)}>
                  Edit Class
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeleteClassDialog(classRow.id)}
                  className="text-destructive"
                >
                  Delete Class
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Section columns
  const sectionColumns: ColumnDef<SectionData>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
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
        accessorKey: "className",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("className")}</div>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Section" />,
        cell: ({ row }) => <Badge variant="outline">{row.getValue("name")}</Badge>,
      },
      {
        id: "classTeacher",
        header: "Class Teacher",
        cell: ({ row }) => {
          const teacher = row.original.classTeacher;
          return (
            <div className="text-muted-foreground">
              {teacher ? `${teacher.firstName} ${teacher.lastName}` : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "room",
        header: "Room",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("room") || "-"}</div>,
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("capacity")}</div>,
      },
      {
        accessorKey: "studentCount",
        header: "Students",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {row.getValue("studentCount")}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const section = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditSectionDialog(section.id)}>
                  Edit Section
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeleteSectionDialog(section.id)}
                  className="text-destructive"
                >
                  Delete Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const classData = useMemo(() => classes || [], [classes]);
  const sectionData = useMemo(() => sections || [], [sections]);

  const classTable = useReactTable({
    data: classData,
    columns: classColumns,
    onSortingChange: setClassSorting,
    onColumnFiltersChange: setClassColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setClassColumnVisibility,
    onRowSelectionChange: setClassRowSelection,
    state: {
      sorting: classSorting,
      columnFilters: classColumnFilters,
      columnVisibility: classColumnVisibility,
      rowSelection: classRowSelection,
    },
  });

  const sectionTable = useReactTable({
    data: sectionData,
    columns: sectionColumns as ColumnDef<{
      id: Id<"sections">;
      schoolId: Id<"schools">;
      classId: Id<"classes">;
      className: string;
      classLevel: number;
      name: string;
      capacity: number;
      classTeacher: {
        id: Id<"users">;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
      room: string | undefined;
      studentCount: number;
      createdAt: number;
      updatedAt: number;
    }>[],

    onSortingChange: setSectionSorting,
    onColumnFiltersChange: setSectionColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setSectionColumnVisibility,
    onRowSelectionChange: setSectionRowSelection,
    state: {
      sorting: sectionSorting,
      columnFilters: sectionColumnFilters,
      columnVisibility: sectionColumnVisibility,
      rowSelection: sectionRowSelection,
    },
  });

  // Class handlers
  const handleAddClass = async () => {
    if (!user?.schoolId) return;

    try {
      await createClassMutation({
        schoolId: user.schoolId,
        name: classFormData.name,
        level: parseInt(classFormData.level),
        academicYear: classFormData.academicYear,
        description: classFormData.description || undefined,
      });

      toast.success("Class created successfully");
      setIsAddClassDialogOpen(false);
      resetClassForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create class");
    }
  };

  const handleEditClass = async () => {
    if (!selectedClassId) return;

    try {
      await updateClassMutation({
        classId: selectedClassId,
        name: classFormData.name,
        level: parseInt(classFormData.level),
        academicYear: classFormData.academicYear,
        description: classFormData.description || undefined,
      });

      toast.success("Class updated successfully");
      setIsEditClassDialogOpen(false);
      resetClassForm();
      setSelectedClassId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update class");
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClassId) return;

    try {
      await deleteClassMutation({ classId: selectedClassId });
      toast.success("Class deleted successfully");
      setIsDeleteClassDialogOpen(false);
      setSelectedClassId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete class");
    }
  };

  const handleBulkDeleteClasses = async () => {
    const selectedClassIds = classTable.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

    try {
      await Promise.all(selectedClassIds.map((id) => deleteClassMutation({ classId: id })));
      toast.success(`${selectedClassIds.length} classes deleted successfully`);
      setIsBulkDeleteClassDialogOpen(false);
      setClassRowSelection({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete classes");
    }
  };

  const openEditClassDialog = (classId: Id<"classes">) => {
    const classToEdit = classes?.find((c) => c.id === classId);
    if (!classToEdit) return;

    setClassFormData({
      name: classToEdit.name,
      level: classToEdit.level.toString(),
      academicYear: classToEdit.academicYear,
      description: classToEdit.description || "",
    });

    setSelectedClassId(classId);
    setIsEditClassDialogOpen(true);
  };

  const openDeleteClassDialog = (classId: Id<"classes">) => {
    setSelectedClassId(classId);
    setIsDeleteClassDialogOpen(true);
  };

  const resetClassForm = () => {
    setClassFormData({
      name: "",
      level: "",
      academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      description: "",
    });
  };

  // Section handlers
  const handleAddSection = async () => {
    if (!user?.schoolId) return;

    try {
      await createSectionMutation({
        schoolId: user.schoolId,
        classId: sectionFormData.classId as Id<"classes">,
        name: sectionFormData.name,
        capacity: parseInt(sectionFormData.capacity),
        classTeacherId: sectionFormData.classTeacherId ? (sectionFormData.classTeacherId as Id<"users">) : undefined,
        room: sectionFormData.room || undefined,
      });

      toast.success("Section created successfully");
      setIsAddSectionDialogOpen(false);
      resetSectionForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create section");
    }
  };

  const handleEditSection = async () => {
    if (!selectedSectionId) return;

    try {
      await updateSectionMutation({
        sectionId: selectedSectionId,
        name: sectionFormData.name,
        capacity: parseInt(sectionFormData.capacity),
        classTeacherId: sectionFormData.classTeacherId ? (sectionFormData.classTeacherId as Id<"users">) : undefined,
        room: sectionFormData.room || undefined,
      });

      toast.success("Section updated successfully");
      setIsEditSectionDialogOpen(false);
      resetSectionForm();
      setSelectedSectionId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update section");
    }
  };

  const handleDeleteSection = async () => {
    if (!selectedSectionId) return;

    try {
      await deleteSectionMutation({ sectionId: selectedSectionId });
      toast.success("Section deleted successfully");
      setIsDeleteSectionDialogOpen(false);
      setSelectedSectionId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete section");
    }
  };

  const handleBulkDeleteSections = async () => {
    const selectedSectionIds = sectionTable.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

    try {
      await Promise.all(selectedSectionIds.map((id) => deleteSectionMutation({ sectionId: id })));
      toast.success(`${selectedSectionIds.length} sections deleted successfully`);
      setIsBulkDeleteSectionDialogOpen(false);
      setSectionRowSelection({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sections");
    }
  };

  const openEditSectionDialog = (sectionId: Id<"sections">) => {
    const sectionToEdit = sections?.find((s) => s.id === sectionId);
    if (!sectionToEdit) return;

    setSectionFormData({
      classId: sectionToEdit.classId,
      name: sectionToEdit.name,
      capacity: sectionToEdit.capacity.toString(),
      classTeacherId: sectionToEdit.classTeacher?.id || "",
      room: sectionToEdit.room || "",
    });

    setSelectedSectionId(sectionId);
    setIsEditSectionDialogOpen(true);
  };

  const openDeleteSectionDialog = (sectionId: Id<"sections">) => {
    setSelectedSectionId(sectionId);
    setIsDeleteSectionDialogOpen(true);
  };

  const resetSectionForm = () => {
    setSectionFormData({
      classId: "",
      name: "",
      capacity: "40",
      classTeacherId: "",
      room: "",
    });
  };

  // Export handlers
  const handleExportClassesCSV = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Class Name", key: "name" },
      { header: "Level", key: "level" },
      { header: "Academic Year", key: "academicYear" },
      { header: "Section Count", key: "sectionCount" },
    ];

    const selectedRows = classTable.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : classTable.getFilteredRowModel().rows.map((row) => ({ ...row.original }));
    
    exportToCSV(exportData as unknown as Record<string, unknown>[], exportColumns, "classes");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected class(es) exported to CSV`
      : "All classes exported to CSV";
    toast.success(message);
  };
  const handleExportClassesPDF = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Class Name", key: "name" },
      { header: "Level", key: "level" },
      { header: "Academic Year", key: "academicYear" },
      { header: "Sections", key: "sectionCount" },
    ];

    const selectedRows = classTable.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : classTable.getFilteredRowModel().rows.map((row) => ({ ...row.original }));
    
    exportToPDF(exportData as unknown as Record<string, unknown>[], exportColumns, "classes", "Classes Report");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected class(es) exported to PDF`
      : "All classes exported to PDF";
    toast.success(message);
  };

  const handleExportSectionsCSV = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Class", key: "className" },
      { header: "Section", key: "name" },
      { header: "Room", key: "room" },
      { header: "Capacity", key: "capacity" },
      { header: "Student Count", key: "studentCount" },
    ];

  const selectedRows = sectionTable.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : sectionTable.getFilteredRowModel().rows.map((row) => row.original);
    
    exportToCSV(exportData, exportColumns, "sections");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected section(s) exported to CSV`
      : "All sections exported to CSV";
    toast.success(message);
  };

  const handleExportSectionsPDF = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Class", key: "className" },
      { header: "Section", key: "name" },
      { header: "Room", key: "room" },
      { header: "Capacity", key: "capacity" },
      { header: "Students", key: "studentCount" },
    ];

const selectedRows = sectionTable.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : sectionTable.getFilteredRowModel().rows.map((row) => row.original);
    
    exportToPDF(exportData, exportColumns, "sections", "Sections Report");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected section(s) exported to PDF`
      : "All sections exported to PDF";
    toast.success(message);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes & Sections</h1>
          <p className="text-muted-foreground">Manage academic structure and organization</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Classes</CardTitle>
                  <CardDescription>Manage grades and academic levels</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="view-mode" className="text-sm">View:</Label>
                    <div className="flex items-center gap-2">
                      <LayoutList className={`h-4 w-4 ${viewMode === "table" ? "" : "text-muted-foreground"}`} />
                      <Switch
                        id="view-mode"
                        checked={viewMode === "card"}
                        onCheckedChange={(checked) => setViewMode(checked ? "card" : "table")}
                      />
                      <LayoutGrid className={`h-4 w-4 ${viewMode === "card" ? "" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <Button onClick={() => setIsAddClassDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classes === undefined ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : viewMode === "table" ? (
                <div className="space-y-4">
                  <DataTableToolbar
                    table={classTable}
                    searchKey="name"
                    searchPlaceholder="Search classes..."
                    onExportCSV={handleExportClassesCSV}
                    onExportPDF={handleExportClassesPDF}
                    onBulkDelete={() => setIsBulkDeleteClassDialogOpen(true)}
                    customActions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {classTable
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={column.id}
                                  className="capitalize"
                                  checked={column.getIsVisible()}
                                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                  {column.id}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {classTable.getHeaderGroups().map((headerGroup) => (
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
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {classTable.getRowModel().rows?.length ? (
                          classTable.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={classColumns.length} className="h-24 text-center">
                              No classes found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {classTable.getFilteredSelectedRowModel().rows.length} of{" "}
                      {classTable.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => classTable.previousPage()}
                        disabled={!classTable.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {classTable.getState().pagination.pageIndex + 1} of {classTable.getPageCount()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => classTable.nextPage()}
                        disabled={!classTable.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {classTable.getRowModel().rows.map((row) => {
                    const classItem = row.original;
                    return (
                      <Card key={classItem.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{classItem.name}</CardTitle>
                              <CardDescription>Academic Year: {classItem.academicYear}</CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditClassDialog(classItem.id)}>
                                  Edit Class
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteClassDialog(classItem.id)}
                                  className="text-destructive"
                                >
                                  Delete Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Level</span>
                            <Badge variant="outline">Level {classItem.level}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sections</span>
                            <Badge>{classItem.sectionCount} sections</Badge>
                          </div>
                          {classItem.description && (
                            <p className="text-sm text-muted-foreground pt-2">{classItem.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sections</CardTitle>
                  <CardDescription>Manage class divisions and teachers</CardDescription>
                </div>
                <Button onClick={() => setIsAddSectionDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections === undefined ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <DataTableToolbar
                    table={sectionTable}
                    searchKey="name"
                    searchPlaceholder="Search sections..."
                    onExportCSV={handleExportSectionsCSV}
                    onExportPDF={handleExportSectionsPDF}
                    onBulkDelete={() => setIsBulkDeleteSectionDialogOpen(true)}
                    customActions={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {sectionTable
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={column.id}
                                  className="capitalize"
                                  checked={column.getIsVisible()}
                                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                  {column.id}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {sectionTable.getHeaderGroups().map((headerGroup) => (
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
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {sectionTable.getRowModel().rows?.length ? (
                          sectionTable.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={sectionColumns.length} className="h-24 text-center">
                              No sections found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                      {sectionTable.getFilteredSelectedRowModel().rows.length} of{" "}
                      {sectionTable.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sectionTable.previousPage()}
                        disabled={!sectionTable.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {sectionTable.getState().pagination.pageIndex + 1} of {sectionTable.getPageCount()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sectionTable.nextPage()}
                        disabled={!sectionTable.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Dialogs */}
      <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>Create a new academic class or grade</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name *</Label>
              <Input
                id="className"
                placeholder="e.g., Grade 10"
                value={classFormData.name}
                onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="12"
                placeholder="e.g., 10"
                value={classFormData.level}
                onChange={(e) => setClassFormData({ ...classFormData, level: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year *</Label>
              <Input
                id="academicYear"
                placeholder="e.g., 2024-2025"
                value={classFormData.academicYear}
                onChange={(e) => setClassFormData({ ...classFormData, academicYear: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={classFormData.description}
                onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddClassDialogOpen(false); resetClassForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddClass}>Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-className">Class Name *</Label>
              <Input
                id="edit-className"
                value={classFormData.name}
                onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-level">Level *</Label>
              <Input
                id="edit-level"
                type="number"
                min="1"
                max="12"
                value={classFormData.level}
                onChange={(e) => setClassFormData({ ...classFormData, level: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-academicYear">Academic Year *</Label>
              <Input
                id="edit-academicYear"
                value={classFormData.academicYear}
                onChange={(e) => setClassFormData({ ...classFormData, academicYear: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={classFormData.description}
                onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditClassDialogOpen(false); resetClassForm(); setSelectedClassId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEditClass}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteClassDialogOpen} onOpenChange={setIsDeleteClassDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this class. You can only delete classes that have no sections and no enrolled students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClassId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteClassDialogOpen} onOpenChange={setIsBulkDeleteClassDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Classes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {classTable.getFilteredSelectedRowModel().rows.length} selected classes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteClasses} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section Dialogs */}
      <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>Create a new section for a class</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionClassId">Class *</Label>
              <Select value={sectionFormData.classId} onValueChange={(value) => setSectionFormData({ ...sectionFormData, classId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                placeholder="e.g., A, B, C"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={sectionFormData.capacity}
                onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classTeacherId">Class Teacher</Label>
              <Select value={sectionFormData.classTeacherId} onValueChange={(value) => setSectionFormData({ ...sectionFormData, classTeacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                placeholder="e.g., 101, Lab 1"
                value={sectionFormData.room}
                onChange={(e) => setSectionFormData({ ...sectionFormData, room: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddSectionDialogOpen(false); resetSectionForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSection}>Create Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditSectionDialogOpen} onOpenChange={setIsEditSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update section information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sectionName">Section Name *</Label>
              <Input
                id="edit-sectionName"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity *</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={sectionFormData.capacity}
                onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-classTeacherId">Class Teacher</Label>
              <Select value={sectionFormData.classTeacherId} onValueChange={(value) => setSectionFormData({ ...sectionFormData, classTeacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-room">Room</Label>
              <Input
                id="edit-room"
                value={sectionFormData.room}
                onChange={(e) => setSectionFormData({ ...sectionFormData, room: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditSectionDialogOpen(false); resetSectionForm(); setSelectedSectionId(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEditSection}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteSectionDialogOpen} onOpenChange={setIsDeleteSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section. You can only delete sections that have no enrolled students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSectionId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteSectionDialogOpen} onOpenChange={setIsBulkDeleteSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Sections?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {sectionTable.getFilteredSelectedRowModel().rows.length} selected sections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteSections} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}