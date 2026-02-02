"use client";

import { useState, useMemo, useCallback, JSX } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileDown,
  GraduationCap,
  UserPlus,
  FileSpreadsheet,
  ArrowUpCircle,
  CheckCircle,
} from "lucide-react";
import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { BulkAddStudentsDialog } from "@/components/students/bulk-add-students-dialog";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { ViewStudentDialog } from "@/components/students/view-student-dialog";
import { DeleteStudentDialog } from "@/components/students/delete-student-dialog";
import { BulkDeleteStudentsDialog } from "@/components/students/bulk-delete-students-dialog";
import { PromoteStudentDialog } from "@/components/students/promote-student-dialog";
import { BulkPromoteStudentsDialog } from "@/components/students/bulk-promote-students-dialog";
import { BulkStatusChangeDialog } from "@/components/students/bulk-status-change-dialog";
import { PhotoCell } from "@/components/students/photo-cell";
import {
  DataTable,
  createSortableHeader,
  createSelectColumn,
} from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { exportToCSV, exportToPDF } from "@/lib/exports";
import { toast } from "sonner";

interface Student {
  createdAt: string;
  updatedAt: string;
  _id: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  email?: string;
  phone?: string;
  address: string;
  classId: string;
  className: string;
  department: "creche" | "kindergarten" | "primary" | "junior_high";
  rollNumber?: string;
  admissionDate: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationship: "father" | "mother" | "guardian";
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  photoStorageId?: string;
  status:
    | "active"
    | "inactive"
    | "fresher"
    | "continuing"
    | "transferred"
    | "graduated";
}

export default function StudentsPage(): React.JSX.Element {
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] =
    useState<boolean>(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState<boolean>(false);
  const [bulkPromoteDialogOpen, setBulkPromoteDialogOpen] =
    useState<boolean>(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] =
    useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Fetch school data
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : "skip",
  );

  // Fetch students data
  const students = useQuery(
    api.students.getStudentsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : "skip",
  ) as Student[] | undefined;

  const stats = useQuery(
    api.students.getStudentStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : "skip",
  );

  const updateStudentStatus = useMutation(api.students.updateStudentStatus);

  // Memoize callback and columns BEFORE any conditional returns
  const handleStatusChange = useCallback(
    async (
      studentId: Id<"students">,
      newStatus:
        | "active"
        | "inactive"
        | "fresher"
        | "continuing"
        | "transferred"
        | "graduated",
    ): Promise<void> => {
      try {
        await updateStudentStatus({
          studentId,
          status: newStatus,
          updatedBy: "",
        });
        toast.success(`Student status updated to ${newStatus}`);
      } catch (error) {
        toast.error("Failed to update student status");
        console.error(error);
      }
    },
    [updateStudentStatus],
  );

  const getStatusBadge = useCallback((status: string): React.JSX.Element => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "fresher":
        return <Badge className="bg-blue-500">Fresher</Badge>;
      case "continuing":
        return <Badge className="bg-purple-500">Continuing</Badge>;
      case "transferred":
        return <Badge className="bg-orange-500">Transferred</Badge>;
      case "graduated":
        return <Badge className="bg-yellow-500">Graduated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const getDepartmentBadge = useCallback((department: string): React.JSX.Element => {
    switch (department) {
      case "creche":
        return <Badge variant="outline">Creche</Badge>;
      case "kindergarten":
        return <Badge variant="outline">Kindergarten</Badge>;
      case "primary":
        return <Badge variant="outline">Primary</Badge>;
      case "junior_high":
        return <Badge variant="outline">Junior High</Badge>;
      default:
        return <Badge variant="outline">{department}</Badge>;
    }
  }, []);

  // Export handlers
  const handleExportSingle = useCallback(
    (student: Student, format: "csv" | "pdf"): void => {
      const exportData = [
        {
          studentId: student.studentId,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName || "",
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          email: student.email || "",
          phone: student.phone || "",
          address: student.address,
          className: student.className,
          department: student.department,
          rollNumber: student.rollNumber || "",
          admissionDate: student.admissionDate,
          parentName: student.parentName,
          parentEmail: student.parentEmail,
          parentPhone: student.parentPhone,
          relationship: student.relationship,
          emergencyContactName: student.emergencyContactName,
          emergencyContactPhone: student.emergencyContactPhone,
          emergencyContactRelationship: student.emergencyContactRelationship,
          status: student.status,
        },
      ];

      if (format === "csv") {
        exportToCSV(exportData, `student_${student.studentId}`);
        toast.success("Student exported as CSV");
      } else {
        exportToPDF(
          exportData,
          `student_${student.studentId}`,
          `Student: ${student.firstName} ${student.lastName}`,
        );
        toast.success("Student exported as PDF");
      }
    },
    [],
  );

  const handleExportBulk = useCallback(
    (studentsToExport: Student[], format: "csv" | "pdf"): void => {
      const exportData = studentsToExport.map((student) => ({
        studentId: student.studentId,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || "",
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        email: student.email || "",
        phone: student.phone || "",
        address: student.address,
        className: student.className,
        department: student.department,
        rollNumber: student.rollNumber || "",
        admissionDate: student.admissionDate,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
        relationship: student.relationship,
        emergencyContactName: student.emergencyContactName,
        emergencyContactPhone: student.emergencyContactPhone,
        emergencyContactRelationship: student.emergencyContactRelationship,
        status: student.status,
      }));

      if (format === "csv") {
        exportToCSV(exportData, "students");
        toast.success(`${studentsToExport.length} students exported as CSV`);
      } else {
        exportToPDF(exportData, "students", "Students Report");
        toast.success(`${studentsToExport.length} students exported as PDF`);
      }
    },
    [],
  );

  // Define columns for DataTable with useMemo to prevent recreation on every render
  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      createSelectColumn<Student>(),
      {
        accessorKey: "photoStorageId",
        header: "Photo",
        cell: ({ row }) => (
          <PhotoCell
            photoStorageId={
              row.original.photoStorageId as Id<"_storage"> | undefined
            }
            firstName={row.original.firstName}
            lastName={row.original.lastName}
          />
        ),
      },
      {
        accessorKey: "studentId",
        header: createSortableHeader("Student ID"),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("studentId")}</span>
        ),
      },
      {
        accessorKey: "admissionNumber",
        header: createSortableHeader("Admission No."),
      },
      {
        accessorKey: "firstName",
        header: createSortableHeader("First Name"),
      },
      {
        accessorKey: "lastName",
        header: createSortableHeader("Last Name"),
      },
      {
        accessorKey: "className",
        header: createSortableHeader("Class"),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => getDepartmentBadge(row.getValue("department")),
      },
      {
        accessorKey: "parentName",
        header: "Parent",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.getValue("parentName")}</div>
            <div className="text-muted-foreground">
              {row.original.parentPhone}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: createSortableHeader("Status"),
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const student = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStudent(student);
                  setViewDialogOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudent(student);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudent(student);
                      setPromoteDialogOpen(true);
                    }}
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Promote Student
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Export</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleExportSingle(student, "csv")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleExportSingle(student, "pdf")}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "active",
                      )
                    }
                    disabled={student.status === "active"}
                  >
                    <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                    Set Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "fresher",
                      )
                    }
                    disabled={student.status === "fresher"}
                  >
                    <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
                    Set Fresher
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "continuing",
                      )
                    }
                    disabled={student.status === "continuing"}
                  >
                    <UserCheck className="mr-2 h-4 w-4 text-purple-500" />
                    Set Continuing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "transferred",
                      )
                    }
                    disabled={student.status === "transferred"}
                  >
                    <UserX className="mr-2 h-4 w-4 text-orange-500" />
                    Set Transferred
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "graduated",
                      )
                    }
                    disabled={student.status === "graduated"}
                  >
                    <GraduationCap className="mr-2 h-4 w-4 text-yellow-500" />
                    Set Graduated
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusChange(
                        student._id as Id<"students">,
                        "inactive",
                      )
                    }
                    disabled={student.status === "inactive"}
                  >
                    <UserX className="mr-2 h-4 w-4 text-gray-500" />
                    Set Inactive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudent(student);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      handleStatusChange,
      getStatusBadge,
      getDepartmentBadge,
      handleExportSingle,
    ],
  );

  // Get unique class names for the filter dropdown
  const uniqueClasses = useMemo(() => {
    if (!students) return [];
    const classNames = students.map((s: Student) => s.className);
    return Array.from(new Set(classNames)).sort();
  }, [students]);

  // Filter students based on status, department, gender, and class
  const filteredStudents = useMemo(
    () =>
      students?.filter((student: Student) => {
        const statusMatch =
          statusFilter === "all" || student.status === statusFilter;
        const departmentMatch =
          departmentFilter === "all" || student.department === departmentFilter;
        const genderMatch =
          genderFilter === "all" || student.gender === genderFilter;
        const classMatch =
          classFilter === "all" ||
          student.className?.trim() === classFilter?.trim();
        return statusMatch && departmentMatch && genderMatch && classMatch;
      }) || [],
    [students, statusFilter, departmentFilter, genderFilter, classFilter],
  );

  // NOW do conditional returns AFTER all hooks
  // Show loading only while data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user exists but no schoolAdmin found, show error
  if (schoolAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">No school admin profile found</p>
        </div>
      </div>
    );
  }

  // If schoolAdmin exists but no school found, show error
  if (schoolAdmin && school !== undefined && !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">School not found</p>
        </div>
      </div>
    );
  }

  // If still loading schoolAdmin or school, show loading
  if (!schoolAdmin || !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSelectionChange = (rows: Student[]) => {
    setSelectedStudents((prev) => {
      if (prev.length === rows.length) {
        const same = prev.every((p, i) => p._id === rows[i]?._id);
        if (same) return prev;
      }
      return rows;
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">
            Manage your school&apos;s students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkAddDialogOpen(true)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Statistics Cards with Hover Effects */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freshers</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fresher || 0}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Continuing</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.continuing || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Department Stats with Hover Effects */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creche</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byDepartment?.creche || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kindergarten</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byDepartment?.kindergarten || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byDepartment?.primary || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Junior High</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byDepartment?.juniorHigh || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Students</CardTitle>
                <CardDescription>View and manage all students</CardDescription>
              </div>
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setBulkPromoteDialogOpen(true)}
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Promote Selected ({selectedStudents.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBulkStatusDialogOpen(true)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Change Status ({selectedStudents.length})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedStudents.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!students || students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">
                Get started by adding your first student
              </p>
              <Button onClick={() => setAddDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters Row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-45">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="continuing">Continuing</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-45">
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="creche">Creche</SelectItem>
                      <SelectItem value="kindergarten">Kindergarten</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="junior_high">Junior High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-45">
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-45">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {uniqueClasses.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredStudents}
                searchKey="firstName"
                searchPlaceholder="Search by name or class..."
                additionalSearchKeys={["lastName", "className"]}
                exportFormats={["csv", "pdf"]}
                onExport={(rows, format) =>
                  handleExportBulk(rows, format as "csv" | "pdf")
                }
                onSelectionChange={handleSelectionChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddStudentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <BulkAddStudentsDialog
        open={bulkAddDialogOpen}
        onOpenChange={setBulkAddDialogOpen}
      />

      {selectedStudent && (
        <>
          <EditStudentDialog
            student={selectedStudent}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <ViewStudentDialog
            student={{
              ...selectedStudent,
              createdAt: selectedStudent.createdAt ?? "",
              updatedAt: selectedStudent.updatedAt ?? "",
            }}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />

          <DeleteStudentDialog
            student={selectedStudent}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}

      <BulkDeleteStudentsDialog
        students={selectedStudents}
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onDeleted={() => setSelectedStudents([])}
      />

      {selectedStudent && (
        <PromoteStudentDialog
          student={selectedStudent}
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
        />
      )}

      <BulkPromoteStudentsDialog
        students={selectedStudents}
        open={bulkPromoteDialogOpen}
        onOpenChange={setBulkPromoteDialogOpen}
        onPromoted={() => setSelectedStudents([])}
      />

      <BulkStatusChangeDialog
        students={selectedStudents}
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
        onStatusChanged={() => setSelectedStudents([])}
      />
    </div>
  );
}
