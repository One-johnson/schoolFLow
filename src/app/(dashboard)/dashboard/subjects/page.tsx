"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
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
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookMarked,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Download,
  Filter,
  ChevronDown,
  Loader2,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";

export const runtime = 'edge';

interface SubjectData {
  _id: Id<"subjects">;
  subjectCode: string;
  name: string;
  department: string;
  description?: string;
  colorCode: string;
  classIds?: Id<"classes">[];
  teacherIds?: Id<"users">[];
  credits?: number;
  isCore: boolean;
  status: string;
  classNames: string[];
  teacherNames: string[];
  createdAt: number;
  updatedAt: number;
}

const DEPARTMENTS = ["Creche", "Kindergarten", "Primary", "Junior High"];

export default function SubjectsPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    description: "",
    classIds: [] as Id<"classes">[],
    teacherIds: [] as Id<"users">[],
    credits: "",
    isCore: false,
  });

  // Bulk add form state
  const [bulkFormData, setBulkFormData] = useState({
    department: "",
    subjectNames: "",
    classIds: [] as Id<"classes">[],
    teacherIds: [] as Id<"users">[],
    credits: "",
    isCore: false,
  });

  // Queries
  const subjects = useQuery(
    api.subjects.getSubjectsBySchool,
    user?.schoolId ? { schoolId: user.schoolId as Id<"schools"> } : "skip"
  ) as SubjectData[] | undefined;

  const classes = useQuery(
    api.classes.getSchoolClasses,
    user?.schoolId ? { schoolId: user.schoolId as Id<"schools"> } : "skip"
  );

  const teachers = useQuery(
    api.teachers.getSchoolTeachers,
    user?.schoolId ? { schoolId: user.schoolId as Id<"schools"> } : "skip"
  );

  // Mutations
  const createSubject = useMutation(api.subjects.createSubject);
  const bulkCreateSubjects = useMutation(api.subjects.bulkCreateSubjects);
  const updateSubject = useMutation(api.subjects.updateSubject);
  const deleteSubject = useMutation(api.subjects.deleteSubject);
  const bulkDeleteSubjects = useMutation(api.subjects.bulkDeleteSubjects);
  const bulkUpdateSubjectStatus = useMutation(api.subjects.bulkUpdateSubjectStatus);
  const bulkAssignToClasses = useMutation(api.subjects.bulkAssignSubjectsToClasses);
  const bulkAssignToTeachers = useMutation(api.subjects.bulkAssignSubjectsToTeachers);

  // Table columns
  const columns: ColumnDef<SubjectData>[] = [
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
      accessorKey: "subjectCode",
      header: "Subject Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: row.original.colorCode }}
          />
          <span className="font-mono font-medium">{row.original.subjectCode}</span>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Subject Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <Badge
          style={{
            backgroundColor: row.original.colorCode + "20",
            color: row.original.colorCode,
            borderColor: row.original.colorCode,
          }}
          className="border"
        >
          {row.original.department}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "isCore",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.isCore ? "default" : "outline"}>
          {row.original.isCore ? "Core" : "Elective"}
        </Badge>
      ),
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => row.original.credits || "N/A",
    },
    {
      accessorKey: "classNames",
      header: "Classes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.classNames.length > 0 ? (
            row.original.classNames.slice(0, 2).map((className, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {className}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">Not assigned</span>
          )}
          {row.original.classNames.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{row.original.classNames.length - 2}
            </Badge>
          )}
        </div>
      ),
      filterFn: (row, id, value) => {
        const classNames = row.original.classNames;
        return classNames.some((name) => name.toLowerCase().includes(value.toLowerCase()));
      },
    },
    {
      accessorKey: "teacherNames",
      header: "Teachers",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.original.teacherNames.length > 0 ? (
            row.original.teacherNames.slice(0, 2).map((teacherName, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {teacherName}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">Not assigned</span>
          )}
          {row.original.teacherNames.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{row.original.teacherNames.length - 2}
            </Badge>
          )}
        </div>
      ),
      filterFn: (row, id, value) => {
        const teacherNames = row.original.teacherNames;
        return teacherNames.some((name) => name.toLowerCase().includes(value.toLowerCase()));
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
          className={
            row.original.status === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : ""
          }
        >
          {row.original.status === "active" ? (
            <CheckCircle2 className="w-3 h-3 mr-1" />
          ) : (
            <XCircle className="w-3 h-3 mr-1" />
          )}
          {row.original.status}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      filterFn: (row, id, value) => {
        const date = new Date(row.getValue(id) as number);
        const filterDate = new Date(value);
        return date >= filterDate;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subject = row.original;

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
              <DropdownMenuItem onClick={() => handleEditSubject(subject._id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteSubject(subject._id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: subjects || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedSubjectIds = selectedRows.map((row) => row.original._id);

  // Handlers
  const handleAddSubject = async () => {
    if (!user?.schoolId || !formData.name || !formData.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createSubject({
        schoolId: user.schoolId as Id<"schools">,
        name: formData.name,
        department: formData.department,
        description: formData.description || undefined,
        classIds: formData.classIds.length > 0 ? formData.classIds : undefined,
        teacherIds: formData.teacherIds.length > 0 ? formData.teacherIds : undefined,
        credits: formData.credits ? Number(formData.credits) : undefined,
        isCore: formData.isCore,
      });
      toast.success("Subject created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create subject");
      console.error(error);
    }
  };

  const handleEditSubject = (subjectId: Id<"subjects">) => {
    const subject = subjects?.find((s) => s._id === subjectId);
    if (subject) {
      setSelectedSubject(subject);
      setFormData({
        name: subject.name,
        department: subject.department,
        description: subject.description || "",
        classIds: subject.classIds || [],
        teacherIds: subject.teacherIds || [],
        credits: subject.credits?.toString() || "",
        isCore: subject.isCore,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateSubject = async () => {
    if (!selectedSubject || !selectedSubject._id) {
      toast.error("Subject not found. Please try again.");
      setIsEditDialogOpen(false);
      resetForm();
      return;
    }

    if (!formData.name || !formData.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateSubject({
        subjectId: selectedSubject._id,
        name: formData.name,
        department: formData.department,
        description: formData.description || undefined,
        classIds: formData.classIds.length > 0 ? formData.classIds : undefined,
        teacherIds: formData.teacherIds.length > 0 ? formData.teacherIds : undefined,
        credits: formData.credits ? Number(formData.credits) : undefined,
        isCore: formData.isCore,
      });
      toast.success("Subject updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to update subject");
      console.error(error);
    }
  };

  const handleDeleteSubject = async (subjectId: Id<"subjects">) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      await deleteSubject({ subjectId });
      toast.success("Subject deleted successfully");
    } catch (error) {
      toast.error("Failed to delete subject");
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubjectIds.length === 0) {
      toast.error("Please select subjects to delete");
      return;
    }

    if (!confirm(`Delete ${selectedSubjectIds.length} subject(s)?`)) return;

    try {
      await bulkDeleteSubjects({ subjectIds: selectedSubjectIds });
      toast.success(`${selectedSubjectIds.length} subject(s) deleted`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to delete subjects");
      console.error(error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedSubjectIds.length === 0) {
      toast.error("Please select subjects to update");
      return;
    }

    try {
      await bulkUpdateSubjectStatus({ subjectIds: selectedSubjectIds, status });
      toast.success(`${selectedSubjectIds.length} subject(s) updated`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to update subjects");
      console.error(error);
    }
  };

  const handleBulkAssignClasses = async (classIds: Id<"classes">[]) => {
    if (selectedSubjectIds.length === 0 || classIds.length === 0) {
      toast.error("Please select subjects and classes");
      return;
    }

    try {
      await bulkAssignToClasses({ subjectIds: selectedSubjectIds, classIds });
      toast.success(`Assigned to ${classIds.length} class(es)`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to assign classes");
      console.error(error);
    }
  };

  const handleBulkAssignTeachers = async (teacherIds: Id<"users">[]) => {
    if (selectedSubjectIds.length === 0 || teacherIds.length === 0) {
      toast.error("Please select subjects and teachers");
      return;
    }

    try {
      await bulkAssignToTeachers({ subjectIds: selectedSubjectIds, teacherIds });
      toast.success(`Assigned to ${teacherIds.length} teacher(s)`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to assign teachers");
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    if (!subjects || subjects.length === 0) {
      toast.error("No data to export");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Subject Code", key: "subjectCode" },
      { header: "Name", key: "name" },
      { header: "Department", key: "department" },
      { header: "Type", key: "type" },
      { header: "Credits", key: "credits" },
      { header: "Classes", key: "classes" },
      { header: "Teachers", key: "teachers" },
      { header: "Status", key: "status" },
      { header: "Created Date", key: "createdDate" },
    ];

    const data = subjects.map((subject) => ({
      subjectCode: subject.subjectCode,
      name: subject.name,
      department: subject.department,
      type: subject.isCore ? "Core" : "Elective",
      credits: subject.credits || "N/A",
      classes: subject.classNames.join(", ") || "Not assigned",
      teachers: subject.teacherNames.join(", ") || "Not assigned",
      status: subject.status,
      createdDate: new Date(subject.createdAt).toLocaleDateString(),
    }));

    exportToCSV(data, columns, `subjects-${Date.now()}`);
    toast.success("Subjects exported to CSV");
  };

  const handleExportPDF = () => {
    if (!subjects || subjects.length === 0) {
      toast.error("No data to export");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Code", key: "subjectCode" },
      { header: "Name", key: "name" },
      { header: "Department", key: "department" },
      { header: "Type", key: "type" },
      { header: "Status", key: "status" },
    ];

    const data = subjects.map((subject) => ({
      subjectCode: subject.subjectCode,
      name: subject.name,
      department: subject.department,
      type: subject.isCore ? "Core" : "Elective",
      status: subject.status,
    }));

    exportToPDF(data, columns, `subjects-${Date.now()}`, "Subjects Report");
    toast.success("Subjects exported to PDF");
  };

  const handleBulkAddSubjects = async () => {
    if (!user?.schoolId || !bulkFormData.department || !bulkFormData.subjectNames.trim()) {
      toast.error("Please select department and enter subject names");
      return;
    }

    // Parse subject names (one per line)
    const subjectNames = bulkFormData.subjectNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (subjectNames.length === 0) {
      toast.error("Please enter at least one subject name");
      return;
    }

    try {
      await bulkCreateSubjects({
        schoolId: user.schoolId as Id<"schools">,
        department: bulkFormData.department,
        subjectNames,
        classIds: bulkFormData.classIds.length > 0 ? bulkFormData.classIds : undefined,
        teacherIds: bulkFormData.teacherIds.length > 0 ? bulkFormData.teacherIds : undefined,
        credits: bulkFormData.credits ? Number(bulkFormData.credits) : undefined,
        isCore: bulkFormData.isCore,
      });
      toast.success(`${subjectNames.length} subject(s) created successfully`);
      setIsBulkAddDialogOpen(false);
      resetBulkForm();
    } catch (error) {
      toast.error("Failed to create subjects");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      department: "",
      description: "",
      classIds: [],
      teacherIds: [],
      credits: "",
      isCore: false,
    });
    setSelectedSubject(null);
  };

  const resetBulkForm = () => {
    setBulkFormData({
      department: "",
      subjectNames: "",
      classIds: [],
      teacherIds: [],
      credits: "",
      isCore: false,
    });
  };

  if (!subjects) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8 pt-16 sm:pt-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookMarked className="h-8 w-8 text-blue-600" />
            Subject Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subjects, departments, and assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsBulkAddDialogOpen(true)} variant="outline" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Bulk Add Subjects
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.filter((s) => s.isCore).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(subjects.map((s) => s.department)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                {selectedRows.length > 0
                  ? `${selectedRows.length} subject(s) selected`
                  : `${subjects.length} subject(s) found`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Global Search */}
              <Input
                placeholder="Search subjects..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-[200px]"
              />

              {/* Department Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Department
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {DEPARTMENTS.map((dept) => (
                    <DropdownMenuCheckboxItem
                      key={dept}
                      checked={
                        (table.getColumn("department")?.getFilterValue() as string[])?.includes(dept) ?? false
                      }
                      onCheckedChange={(checked) => {
                        const current = (table.getColumn("department")?.getFilterValue() as string[]) || [];
                        if (checked) {
                          table.getColumn("department")?.setFilterValue([...current, dept]);
                        } else {
                          table.getColumn("department")?.setFilterValue(current.filter((d) => d !== dept));
                        }
                      }}
                    >
                      {dept}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {["active", "inactive"].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={
                        (table.getColumn("status")?.getFilterValue() as string[])?.includes(status) ?? false
                      }
                      onCheckedChange={(checked) => {
                        const current = (table.getColumn("status")?.getFilterValue() as string[]) || [];
                        if (checked) {
                          table.getColumn("status")?.setFilterValue([...current, status]);
                        } else {
                          table.getColumn("status")?.setFilterValue(current.filter((s) => s !== status));
                        }
                      }}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns
                    <ChevronDown className="ml-2 h-4 w-4" />
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
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate("active")}
              >
                Mark Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate("inactive")}
              >
                Mark Inactive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
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
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
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
                      No subjects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
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
        </CardContent>
      </Card>

      {/* Bulk Add Subjects Dialog */}
      <Dialog
        open={isBulkAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsBulkAddDialogOpen(false);
            resetBulkForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Add Subjects</DialogTitle>
            <DialogDescription>
              Add multiple subjects for a department at once. Enter one subject name per line.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-department">Department *</Label>
              <Select
                value={bulkFormData.department}
                onValueChange={(value) =>
                  setBulkFormData({ ...bulkFormData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject-names">Subject Names * (one per line)</Label>
              <Textarea
                id="subject-names"
                value={bulkFormData.subjectNames}
                onChange={(e) =>
                  setBulkFormData({ ...bulkFormData, subjectNames: e.target.value })
                }
                placeholder="Mathematics\nEnglish\nScience\nSocial Studies\nPhysical Education"
                rows={8}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Enter each subject name on a new line. Subject codes will be auto-generated.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-credits">Credits (apply to all)</Label>
              <Input
                id="bulk-credits"
                type="number"
                value={bulkFormData.credits}
                onChange={(e) =>
                  setBulkFormData({ ...bulkFormData, credits: e.target.value })
                }
                placeholder="e.g., 3"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-isCore"
                checked={bulkFormData.isCore}
                onCheckedChange={(checked) =>
                  setBulkFormData({ ...bulkFormData, isCore: !!checked })
                }
              />
              <Label
                htmlFor="bulk-isCore"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                All are Core Subjects (uncheck for elective)
              </Label>
            </div>

            <div className="grid gap-2">
              <Label>Assign all to Classes (Optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {classes?.map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-class-${classItem.id}`}
                      checked={bulkFormData.classIds.includes(classItem.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkFormData({
                            ...bulkFormData,
                            classIds: [...bulkFormData.classIds, classItem.id],
                          });
                        } else {
                          setBulkFormData({
                            ...bulkFormData,
                            classIds: bulkFormData.classIds.filter((id) => id !== classItem.id),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`bulk-class-${classItem.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {classItem.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Assign all to Teachers (Optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {teachers?.map((teacher) => (
                  <div key={teacher.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bulk-teacher-${teacher.id}`}
                      checked={bulkFormData.teacherIds.includes(teacher.userId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkFormData({
                            ...bulkFormData,
                            teacherIds: [...bulkFormData.teacherIds, teacher.userId],
                          });
                        } else {
                          setBulkFormData({
                            ...bulkFormData,
                            teacherIds: bulkFormData.teacherIds.filter((id) => id !== teacher.userId),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`bulk-teacher-${teacher.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {teacher.firstName} {teacher.lastName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkAddDialogOpen(false);
                resetBulkForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAddSubjects}>
              Create All Subjects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Subject Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update subject information"
                : "Create a new subject with auto-generated code"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the subject"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: e.target.value })
                }
                placeholder="e.g., 3"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCore"
                checked={formData.isCore}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCore: !!checked })
                }
              />
              <Label
                htmlFor="isCore"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Core Subject (uncheck for elective)
              </Label>
            </div>

            <div className="grid gap-2">
              <Label>Assign to Classes (Optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {classes?.map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={formData.classIds.includes(classItem.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            classIds: [...formData.classIds, classItem.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            classIds: formData.classIds.filter((id) => id !== classItem.id),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`class-${classItem.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {classItem.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Assign to Teachers (Optional)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {teachers?.map((teacher) => (
                  <div key={teacher.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`teacher-${teacher.id}`}
                      checked={formData.teacherIds.includes(teacher.userId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            teacherIds: [...formData.teacherIds, teacher.userId],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            teacherIds: formData.teacherIds.filter((id) => id !== teacher.userId),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`teacher-${teacher.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {teacher.firstName} {teacher.lastName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdateSubject : handleAddSubject}
            >
              {isEditDialogOpen ? "Update Subject" : "Create Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
