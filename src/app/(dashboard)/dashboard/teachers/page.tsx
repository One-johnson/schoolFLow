"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  X,
  Columns3,
  FileDown,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";
import { Textarea } from "@/components/ui/textarea";

type Teacher = {
  id: Id<"teachers">;
  userId: Id<"users">;
  schoolId: Id<"schools">;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photo?: string;
  qualifications: Array<{
    degree: string;
    subject: string;
    university: string;
    yearObtained: number;
  }>;
  subjectSpecializations: string[];
  yearsOfExperience: number;
  employmentType: string;
  department: string;
  dateOfJoining: number;
  salary?: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: number;
  }>;
  bio?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

type FormData = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  qualifications: Array<{
    degree: string;
    subject: string;
    university: string;
    yearObtained: number;
  }>;
  subjectSpecializations: string[];
  yearsOfExperience: number;
  employmentType: string;
  department: string;
  dateOfJoining: string;
  salary: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bio: string;
};

export default function TeachersPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [isBulkDepartmentDialogOpen, setIsBulkDepartmentDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkDepartment, setBulkDepartment] = useState("");

  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    qualifications: [{ degree: "", subject: "", university: "", yearObtained: new Date().getFullYear() }],
    subjectSpecializations: [],
    yearsOfExperience: 0,
    employmentType: "full_time",
    department: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    salary: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    bio: "",
  });

  const [subjectInput, setSubjectInput] = useState("");

  // Queries
  const teachers = useQuery(
    api.teachers.getSchoolTeachers,
    user?.schoolId ? { schoolId: user.schoolId as Id<"schools"> } : "skip"
  );

  // Mutations
  const createTeacher = useMutation(api.teachers.createTeacher);
  const updateTeacher = useMutation(api.teachers.updateTeacher);
  const deleteTeacher = useMutation(api.teachers.deleteTeacher);
  const bulkUpdateStatus = useMutation(api.teachers.bulkUpdateStatus);
  const bulkUpdateDepartment = useMutation(api.teachers.bulkUpdateDepartment);

  const handleAddTeacher = async () => {
    if (!user?.schoolId) return;

    try {
      const result = await createTeacher({
        schoolId: user.schoolId as Id<"schools">,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).getTime() : undefined,
        qualifications: formData.qualifications.filter(q => q.degree && q.subject),
        subjectSpecializations: formData.subjectSpecializations,
        yearsOfExperience: formData.yearsOfExperience,
        employmentType: formData.employmentType,
        department: formData.department,
        dateOfJoining: new Date(formData.dateOfJoining).getTime(),
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        emergencyContact: formData.emergencyContact,
        bio: formData.bio || undefined,
      });

      toast.success(`Teacher created successfully! Employee ID: ${result.employeeId} (This is also the default password)`);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create teacher");
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      await updateTeacher({
        teacherId: selectedTeacher.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        qualifications: formData.qualifications.filter(q => q.degree && q.subject),
        subjectSpecializations: formData.subjectSpecializations,
        yearsOfExperience: formData.yearsOfExperience,
        employmentType: formData.employmentType,
        department: formData.department,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        emergencyContact: formData.emergencyContact,
        bio: formData.bio || undefined,
      });

      toast.success("Teacher updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTeacher(null);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update teacher");
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      await deleteTeacher({ teacherId: selectedTeacher.id });
      toast.success("Teacher deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete teacher");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((index) => teachers?.[parseInt(index)]?.id)
      .filter(Boolean) as Id<"teachers">[];

    if (selectedIds.length === 0) {
      toast.error("No teachers selected");
      return;
    }

    try {
      await Promise.all(selectedIds.map((id) => deleteTeacher({ teacherId: id })));
      toast.success(`${selectedIds.length} teacher(s) deleted successfully`);
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to delete teachers");
    }
  };

  const handleBulkStatusUpdate = async () => {
    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((index) => teachers?.[parseInt(index)]?.id)
      .filter(Boolean) as Id<"teachers">[];

    if (selectedIds.length === 0) {
      toast.error("No teachers selected");
      return;
    }

    if (!bulkStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      await bulkUpdateStatus({
        teacherIds: selectedIds,
        status: bulkStatus,
      });
      toast.success(`${selectedIds.length} teacher(s) status updated successfully`);
      setIsBulkStatusDialogOpen(false);
      setBulkStatus("");
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to update teacher status");
    }
  };

  const handleBulkDepartmentUpdate = async () => {
    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key as keyof typeof rowSelection])
      .map((index) => teachers?.[parseInt(index)]?.id)
      .filter(Boolean) as Id<"teachers">[];

    if (selectedIds.length === 0) {
      toast.error("No teachers selected");
      return;
    }

    if (!bulkDepartment) {
      toast.error("Please select a department");
      return;
    }

    try {
      await bulkUpdateDepartment({
        teacherIds: selectedIds,
        department: bulkDepartment,
      });
      toast.success(`${selectedIds.length} teacher(s) department updated successfully`);
      setIsBulkDepartmentDialogOpen(false);
      setBulkDepartment("");
      setRowSelection({});
    } catch (error) {
      toast.error("Failed to update teacher department");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      qualifications: [{ degree: "", subject: "", university: "", yearObtained: new Date().getFullYear() }],
      subjectSpecializations: [],
      yearsOfExperience: 0,
      employmentType: "full_time",
      department: "",
      dateOfJoining: new Date().toISOString().split("T")[0],
      salary: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      bio: "",
    });
    setSubjectInput("");
  };

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || "",
      dateOfBirth: teacher.dateOfJoining ? new Date(teacher.dateOfJoining).toISOString().split("T")[0] : "",
      qualifications: teacher.qualifications.length > 0 ? teacher.qualifications : [{ degree: "", subject: "", university: "", yearObtained: new Date().getFullYear() }],
      subjectSpecializations: teacher.subjectSpecializations,
      yearsOfExperience: teacher.yearsOfExperience,
      employmentType: teacher.employmentType,
      department: teacher.department,
      dateOfJoining: new Date(teacher.dateOfJoining).toISOString().split("T")[0],
      salary: teacher.salary?.toString() || "",
      emergencyContact: teacher.emergencyContact,
      bio: teacher.bio || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const addQualification = () => {
    setFormData({
      ...formData,
      qualifications: [...formData.qualifications, { degree: "", subject: "", university: "", yearObtained: new Date().getFullYear() }],
    });
  };

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index),
    });
  };

  const updateQualification = (index: number, field: string, value: string | number) => {
    const newQualifications = [...formData.qualifications];
    newQualifications[index] = { ...newQualifications[index], [field]: value };
    setFormData({ ...formData, qualifications: newQualifications });
  };

  const addSubject = () => {
    if (subjectInput.trim() && !formData.subjectSpecializations.includes(subjectInput.trim())) {
      setFormData({
        ...formData,
        subjectSpecializations: [...formData.subjectSpecializations, subjectInput.trim()],
      });
      setSubjectInput("");
    }
  };

  const removeSubject = (subject: string) => {
    setFormData({
      ...formData,
      subjectSpecializations: formData.subjectSpecializations.filter((s) => s !== subject),
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "on_leave":
        return "secondary";
      case "resigned":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEmploymentTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "full_time":
        return "default";
      case "part_time":
        return "secondary";
      case "contract":
        return "outline";
      default:
        return "outline";
    }
  };

  const teacherColumns: ColumnDef<Teacher>[] = useMemo(() => [
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
      accessorKey: "employeeId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" />,
      cell: ({ row }) => <div className="font-mono">{row.getValue("employeeId")}</div>,
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.getValue("phone") || "N/A",
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("department")}
        </Badge>
      ),
    },
    {
      accessorKey: "subjectSpecializations",
      header: "Subjects",
      cell: ({ row }) => {
        const subjects = row.getValue("subjectSpecializations") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((subject) => (
              <Badge key={subject} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{subjects.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "yearsOfExperience",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Experience" />,
      cell: ({ row }) => `${row.getValue("yearsOfExperience")} years`,
    },
    {
      accessorKey: "employmentType",
      header: "Employment",
      cell: ({ row }) => (
        <Badge variant={getEmploymentTypeBadgeVariant(row.getValue("employmentType"))}>
          {(row.getValue("employmentType") as string).replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.getValue("status"))}>
          {(row.getValue("status") as string).replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "dateOfJoining",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => new Date(row.getValue("dateOfJoining")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const teacher = row.original;
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
              <DropdownMenuItem onClick={() => openEditDialog(teacher)}>
                Edit Teacher
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(teacher)}
                className="text-destructive"
              >
                Delete Teacher
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [openEditDialog, openDeleteDialog]);

  const teacherTable = useReactTable({
    data: teachers || [],
    columns: teacherColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  const handleExportCSV = () => {
    const selectedRows = teacherTable.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : teachers || [];

    const exportColumns: ExportColumn[] = [
      { header: "Employee ID", key: "employeeId" },
      { header: "First Name", key: "firstName" },
      { header: "Last Name", key: "lastName" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Department", key: "department" },
      { header: "Subjects", key: "subjects" },
      { header: "Experience", key: "experience" },
      { header: "Employment", key: "employment" },
      { header: "Status", key: "status" },
      { header: "Joined", key: "joined" },
    ];

    const csvData = dataToExport.map((teacher) => ({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || "N/A",
      department: teacher.department,
      subjects: teacher.subjectSpecializations.join(", "),
      experience: `${teacher.yearsOfExperience} years`,
      employment: teacher.employmentType.replace("_", " "),
      status: teacher.status.replace("_", " "),
      joined: new Date(teacher.dateOfJoining).toLocaleDateString(),
    }));

    exportToCSV(csvData, exportColumns, "teachers");
    toast.success(
      selectedRows.length > 0
        ? `${selectedRows.length} selected teacher(s) exported to CSV`
        : "All teachers exported to CSV"
    );
  };
const handleExportPDF = () => {
    const selectedRows = teacherTable.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : teachers || [];

    const exportColumns: ExportColumn[] = [
      { header: "Employee ID", key: "employeeId" },
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Department", key: "department" },
      { header: "Subjects", key: "subjects" },
      { header: "Exp.", key: "experience" },
      { header: "Status", key: "status" },
    ];

    const pdfData = dataToExport.map((teacher) => ({
      employeeId: teacher.employeeId,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      department: teacher.department,
      subjects: teacher.subjectSpecializations.slice(0, 2).join(", ") + (teacher.subjectSpecializations.length > 2 ? "..." : ""),
      experience: `${teacher.yearsOfExperience} yrs`,
      status: teacher.status.replace("_", " "),
    }));

    exportToPDF(pdfData, exportColumns, "teachers", "Teachers Report");

    toast.success(
      selectedRows.length > 0
        ? `${selectedRows.length} selected teacher(s) exported to PDF`
        : "All teachers exported to PDF"
    );
  };

  if (!user) {
    return <div>Please log in to view teachers</div>;
  }

  if (teachers === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">Manage your school teachers</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkStatusDialogOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Status ({Object.keys(rowSelection).length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDepartmentDialogOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Department ({Object.keys(rowSelection).length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({Object.keys(rowSelection).length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {teacherTable
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {teacherTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {teacherTable.getRowModel().rows?.length ? (
              teacherTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={teacherColumns.length} className="h-24 text-center">
                  No teachers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {teacherTable.getFilteredSelectedRowModel().rows.length} of{" "}
          {teacherTable.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => teacherTable.previousPage()}
            disabled={!teacherTable.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => teacherTable.nextPage()}
            disabled={!teacherTable.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a new teacher account. An Employee ID will be auto-generated and used as the default password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Experience (Years) *</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary (Optional)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="Monthly salary"
              />
            </div>

            {/* Subject Specializations */}
            <div className="space-y-2">
              <Label>Subject Specializations *</Label>
              <div className="flex gap-2">
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                  placeholder="Enter subject and press Enter"
                />
                <Button type="button" onClick={addSubject}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjectSpecializations.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                    <button
                      onClick={() => removeSubject(subject)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div className="space-y-2">
              <Label>Qualifications</Label>
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                  <Input
                    placeholder="Degree"
                    value={qual.degree}
                    onChange={(e) => updateQualification(index, "degree", e.target.value)}
                  />
                  <Input
                    placeholder="Subject"
                    value={qual.subject}
                    onChange={(e) => updateQualification(index, "subject", e.target.value)}
                  />
                  <Input
                    placeholder="University"
                    value={qual.university}
                    onChange={(e) => updateQualification(index, "university", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Year"
                    value={qual.yearObtained}
                    onChange={(e) => updateQualification(index, "yearObtained", parseInt(e.target.value) || new Date().getFullYear())}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeQualification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQualification}>
                <Plus className="mr-2 h-4 w-4" />
                Add Qualification
              </Button>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <Label>Emergency Contact *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief bio or additional information"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTeacher}>Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Similar form fields as Add Teacher, but without email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-yearsOfExperience">Experience (Years) *</Label>
                <Input
                  id="edit-yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-salary">Salary</Label>
              <Input
                id="edit-salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Subject Specializations *</Label>
              <div className="flex gap-2">
                <Input
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                  placeholder="Enter subject and press Enter"
                />
                <Button type="button" onClick={addSubject}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjectSpecializations.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                    <button
                      onClick={() => removeSubject(subject)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Qualifications</Label>
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-3 border rounded">
                  <Input
                    placeholder="Degree"
                    value={qual.degree}
                    onChange={(e) => updateQualification(index, "degree", e.target.value)}
                  />
                  <Input
                    placeholder="Subject"
                    value={qual.subject}
                    onChange={(e) => updateQualification(index, "subject", e.target.value)}
                  />
                  <Input
                    placeholder="University"
                    value={qual.university}
                    onChange={(e) => updateQualification(index, "university", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Year"
                    value={qual.yearObtained}
                    onChange={(e) => updateQualification(index, "yearObtained", parseInt(e.target.value) || new Date().getFullYear())}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeQualification(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addQualification}>
                <Plus className="mr-2 h-4 w-4" />
                Add Qualification
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Emergency Contact *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeacher}>Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTeacher?.firstName} {selectedTeacher?.lastName}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeacher}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Teacher Status</DialogTitle>
            <DialogDescription>
              Select a status to apply to {Object.keys(rowSelection).length} selected teacher(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <Badge variant="default">Active</Badge>
                  </SelectItem>
                  <SelectItem value="on_leave">
                    <Badge variant="secondary">On Leave</Badge>
                  </SelectItem>
                  <SelectItem value="resigned">
                    <Badge variant="destructive">Resigned</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Department Update Dialog */}
      <Dialog open={isBulkDepartmentDialogOpen} onOpenChange={setIsBulkDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Teacher Department</DialogTitle>
            <DialogDescription>
              Select a department to apply to {Object.keys(rowSelection).length} selected teacher(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={bulkDepartment}
                onChange={(e) => setBulkDepartment(e.target.value)}
                placeholder="Enter department name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDepartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkDepartmentUpdate}>Update Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
