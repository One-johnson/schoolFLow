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
import { GraduationCap, MoreHorizontal, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export-utils";

interface StudentFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  medicalInfo: string;
}

interface StudentData {
  id: Id<"students">;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  status: string;
  classId?: string;
  sectionId?: string;
  phone?: string;
  dateOfBirth: number;
  bloodGroup?: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [classFilter, setClassFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState<boolean>(false);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<Id<"students"> | null>(null);
  const [bulkAssignClassId, setBulkAssignClassId] = useState<string>("");
  const [bulkAssignSectionId, setBulkAssignSectionId] = useState<string>("");
  const [formData, setFormData] = useState<StudentFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    admissionNumber: "",
    classId: "",
    sectionId: "",
    rollNumber: "",
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    medicalInfo: "",
  });

  const students = useQuery(
    api.students.getSchoolStudents,
    user?.schoolId
      ? { 
          schoolId: user.schoolId,
          classId: classFilter === "all" ? undefined : (classFilter as Id<"classes">),
        }
      : "skip"
  );

  const classes = useQuery(
    api.classes.getSchoolClasses,
    user?.schoolId ? { schoolId: user.schoolId } : "skip"
  );

  const sections = useQuery(
    api.sections.getSections,
    formData.classId ? { classId: formData.classId as Id<"classes"> } : "skip"
  );

  const bulkSections = useQuery(
    api.sections.getSections,
    bulkAssignClassId ? { classId: bulkAssignClassId as Id<"classes"> } : "skip"
  );

  const nextAdmissionNumber = useQuery(
    api.students.generateAdmissionNumber,
    user?.schoolId ? { schoolId: user.schoolId } : "skip"
  );

  const createStudentMutation = useMutation(api.students.createStudent);
  const updateStudentMutation = useMutation(api.students.updateStudent);
  const deleteStudentMutation = useMutation(api.students.deleteStudent);

  const openEditDialog = (studentId: Id<"students">) => {
    const studentToEdit = students?.find((s) => s.id === studentId);
    if (!studentToEdit) return;

    setFormData({
      email: studentToEdit.email,
      password: "",
      firstName: studentToEdit.firstName,
      lastName: studentToEdit.lastName,
      phone: studentToEdit.phone || "",
      admissionNumber: studentToEdit.admissionNumber,
      classId: (studentToEdit as any).classId ? (studentToEdit as any).classId : "",
      sectionId: (studentToEdit as any).sectionId ? (studentToEdit as any).sectionId : "",
      rollNumber: studentToEdit.rollNumber || "",
      dateOfBirth: new Date(studentToEdit.dateOfBirth).toISOString().split("T")[0],
      bloodGroup: studentToEdit.bloodGroup || "",
      address: studentToEdit.address,
      emergencyContactName: studentToEdit.emergencyContact.name,
      emergencyContactRelationship: studentToEdit.emergencyContact.relationship,
      emergencyContactPhone: studentToEdit.emergencyContact.phone,
      medicalInfo: studentToEdit.medicalInfo || "",
    });

    setSelectedStudentId(studentId);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (studentId: Id<"students">) => {
    setSelectedStudentId(studentId);
    setIsDeleteDialogOpen(true);
  };

  const columns: ColumnDef<StudentData>[] = useMemo(
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
        accessorKey: "admissionNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Admission No." />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("admissionNumber")}</div>,
      },
      {
        accessorKey: "firstName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("firstName")}</div>,
      },
      {
        accessorKey: "lastName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue("lastName")}</div>,
      },
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("className") || "-"}</div>,
      },
      {
        accessorKey: "sectionName",
        header: "Section",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("sectionName") || "-"}</div>,
      },
      {
        accessorKey: "rollNumber",
        header: "Roll No.",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("rollNumber") || "-"}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const variants: Record<string, "default" | "secondary" | "outline"> = {
            active: "default",
            graduated: "secondary",
            transferred: "outline",
            withdrawn: "outline",
          };
          return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const student = row.original;
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
                <DropdownMenuItem onClick={() => openEditDialog(student.id)}>
                  Edit Student
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(student.id)}
                  className="text-destructive"
                >
                  Delete Student
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [students, openEditDialog, openDeleteDialog]
  );

  const data = useMemo(() => students || [], [students]);

  const table = useReactTable({
    data,
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
  });

  const handleAddStudent = async () => {
    if (!user?.schoolId) return;

    try {
      await createStudentMutation({
        schoolId: user.schoolId,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        admissionNumber: formData.admissionNumber,
        classId: formData.classId ? (formData.classId as Id<"classes">) : undefined,
        sectionId: formData.sectionId ? (formData.sectionId as Id<"sections">) : undefined,
        rollNumber: formData.rollNumber || undefined,
        dateOfBirth: new Date(formData.dateOfBirth).getTime(),
        bloodGroup: formData.bloodGroup || undefined,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
        medicalInfo: formData.medicalInfo || undefined,
        enrollmentDate: Date.now(),
      });

      toast.success("Student created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create student");
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudentId) return;

    try {
      await updateStudentMutation({
        studentId: selectedStudentId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        classId: formData.classId ? (formData.classId as Id<"classes">) : undefined,
        sectionId: formData.sectionId ? (formData.sectionId as Id<"sections">) : undefined,
        rollNumber: formData.rollNumber || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
        },
        medicalInfo: formData.medicalInfo || undefined,
      });

      toast.success("Student updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedStudentId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update student");
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudentId) return;

    try {
      await deleteStudentMutation({ studentId: selectedStudentId });
      toast.success("Student deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedStudentId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
    }
  };

  const handleBulkDelete = async () => {
    const selectedStudentIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

    try {
      await Promise.all(selectedStudentIds.map((id) => deleteStudentMutation({ studentId: id })));
      toast.success(`${selectedStudentIds.length} students deleted successfully`);
      setIsBulkDeleteDialogOpen(false);
      setRowSelection({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete students");
    }
  };

  const handleBulkAssignClass = async () => {
    const selectedStudentIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id);

    try {
      await Promise.all(
        selectedStudentIds.map((id) =>
          updateStudentMutation({
            studentId: id,
            classId: bulkAssignClassId ? (bulkAssignClassId as Id<"classes">) : undefined,
            sectionId: bulkAssignSectionId ? (bulkAssignSectionId as Id<"sections">) : undefined,
          })
        )
      );
      toast.success(`${selectedStudentIds.length} students assigned successfully`);
      setIsBulkAssignDialogOpen(false);
      setBulkAssignClassId("");
      setBulkAssignSectionId("");
      setRowSelection({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign students");
    }
  };

  const handleExportCSV = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Admission Number", key: "admissionNumber" },
      { header: "First Name", key: "firstName" },
      { header: "Last Name", key: "lastName" },
      { header: "Email", key: "email" },
      { header: "Class", key: "className" },
      { header: "Section", key: "sectionName" },
      { header: "Roll Number", key: "rollNumber" },
      { header: "Status", key: "status" },
    ];

   const selectedRows = table.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : table.getFilteredRowModel().rows.map((row) => row.original);
    
    exportToCSV(exportData as unknown as Record<string, unknown>[], exportColumns, "students");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected student(s) exported to CSV`
      : "All students exported to CSV";
    toast.success(message);
  };


  const handleExportPDF = () => {
    const exportColumns: ExportColumn[] = [
      { header: "Admission No.", key: "admissionNumber" },
      { header: "Name", key: "firstName" },
      { header: "Class", key: "className" },
      { header: "Section", key: "sectionName" },
      { header: "Roll No.", key: "rollNumber" },
      { header: "Status", key: "status" },
    ];

   const selectedRows = table.getFilteredSelectedRowModel().rows;
    const exportData = selectedRows.length > 0
      ? selectedRows.map((row) => row.original)
      : table.getFilteredRowModel().rows.map((row) => row.original);
    
    exportToPDF(exportData  as unknown as Record<string, unknown>[],exportColumns, "students", "Students Report");
    const message = selectedRows.length > 0
      ? `${selectedRows.length} selected student(s) exported to PDF`
      : "All students exported to PDF";
    toast.success(message);
  };
  const openAddDialog = () => {
    resetForm();
    if (nextAdmissionNumber) {
      setFormData((prev) => ({ ...prev, admissionNumber: nextAdmissionNumber }));
    }
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      admissionNumber: "",
      classId: "",
      sectionId: "",
      rollNumber: "",
      dateOfBirth: "",
      bloodGroup: "",
      address: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      medicalInfo: "",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">Manage student enrollment and records</p>
        </div>
        <Button onClick={openAddDialog}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>View and manage all enrolled students</CardDescription>
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {students === undefined ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <DataTableToolbar
                table={table}
                searchKey="firstName"
                searchPlaceholder="Search students..."
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
                onBulkDelete={() => setIsBulkDeleteDialogOpen(true)}
                customActions={
                  <>
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setIsBulkAssignDialogOpen(true)}
                      >
                        Assign to Class
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
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
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              >
                                {column.id}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
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
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
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
                  <div className="text-sm">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </div>
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
          setSelectedStudentId(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddDialogOpen ? "Add New Student" : "Edit Student"}</DialogTitle>
            <DialogDescription>
              {isAddDialogOpen ? "Enroll a new student in your school" : "Update student information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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

            {isAddDialogOpen && (
              <>
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
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">Admission Number *</Label>
                  <Input
                    id="admissionNumber"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value, sectionId: "" })}>
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
                <Label htmlFor="sectionId">Section</Label>
                <Select value={formData.sectionId} onValueChange={(value) => setFormData({ ...formData, sectionId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections?.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Emergency Contact *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalInfo">Medical Information</Label>
              <Textarea
                id="medicalInfo"
                value={formData.medicalInfo}
                placeholder="Any medical conditions, allergies, or special requirements..."
                onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
                setSelectedStudentId(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={isAddDialogOpen ? handleAddStudent : handleEditStudent}>
              {isAddDialogOpen ? "Create Student" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this student and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStudentId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Students?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {table.getFilteredSelectedRowModel().rows.length} selected students. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Class Assignment Dialog */}
      <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Students to Class</DialogTitle>
            <DialogDescription>
              Assign {table.getFilteredSelectedRowModel().rows.length} selected students to a class and section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkClassId">Class *</Label>
              <Select value={bulkAssignClassId} onValueChange={(value) => {
                setBulkAssignClassId(value);
                setBulkAssignSectionId("");
              }}>
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
              <Label htmlFor="bulkSectionId">Section *</Label>
              <Select value={bulkAssignSectionId} onValueChange={setBulkAssignSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {bulkSections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkAssignDialogOpen(false);
                setBulkAssignClassId("");
                setBulkAssignSectionId("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAssignClass}>Assign Students</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
