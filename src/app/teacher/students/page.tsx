"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  Printer,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Columns,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ViewMode = "card" | "table";
type SortField = "name" | "studentId" | "gender" | "status";
type SortOrder = "asc" | "desc";

interface ColumnVisibility {
  photo: boolean;
  studentId: boolean;
  gender: boolean;
  dateOfBirth: boolean;
  parentName: boolean;
  parentPhone: boolean;
  status: boolean;
}

const PAGE_SIZES = [10, 20, 30, 50];

// Sort icon component moved to module scope so it's not recreated during render
const SortIcon = ({
  field,
  currentSortField,
  currentSortOrder,
}: {
  field: SortField;
  currentSortField: SortField;
  currentSortOrder: SortOrder;
}) =>
  currentSortField !== field ? (
    <ArrowUpDown className="inline h-3.5 w-3.5 ml-1 opacity-50" />
  ) : currentSortOrder === "asc" ? (
    <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="inline h-3.5 w-3.5 ml-1" />
  );

export default function TeacherStudentsPage() {
  const { teacher } = useTeacherAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    photo: true,
    studentId: true,
    gender: true,
    dateOfBirth: true,
    parentName: true,
    parentPhone: true,
    status: true,
  });

  const classId = teacher?.classIds?.[0];
  const studentsQuery = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : "skip",
  );

  const filteredAndSortedStudents = useMemo(() => {
    if (!studentsQuery) return [];

    let result = [...studentsQuery];

    // Filter
    result = result.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch =
        fullName.includes(q) || s.studentId.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchGender = genderFilter === "all" || s.gender === genderFilter;
      return matchSearch && matchStatus && matchGender;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          );
          break;
        case "studentId":
          cmp = a.studentId.localeCompare(b.studentId);
          break;
        case "gender":
          cmp = a.gender.localeCompare(b.gender);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    studentsQuery,
    searchQuery,
    statusFilter,
    genderFilter,
    sortField,
    sortOrder,
  ]);

  // Pagination
  const totalStudents = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalStudents / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredAndSortedStudents.slice(
    startIndex,
    startIndex + pageSize,
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExportPDF = async () => {
    if (!filteredAndSortedStudents.length) return;

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text(`Students - ${teacher?.classNames?.[0] || "Class"}`, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const head: string[][] = [[]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any[][] = [];

    if (columnVisibility.photo) head[0].push("Photo");
    head[0].push("Name");
    if (columnVisibility.studentId) head[0].push("Student ID");
    if (columnVisibility.gender) head[0].push("Gender");
    if (columnVisibility.dateOfBirth) head[0].push("Date of Birth");
    if (columnVisibility.parentName) head[0].push("Parent Name");
    if (columnVisibility.parentPhone) head[0].push("Parent Phone");
    if (columnVisibility.status) head[0].push("Status");

    for (const student of filteredAndSortedStudents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any[] = [];

      if (columnVisibility.photo) {
        row.push(""); // Placeholder - real image embedding is complex without base64
      }

      row.push(`${student.firstName} ${student.lastName}`);
      if (columnVisibility.studentId) row.push(student.studentId);
      if (columnVisibility.gender) row.push(student.gender || "-");
      if (columnVisibility.dateOfBirth)
        row.push(formatDate(student.dateOfBirth) || "-");
      if (columnVisibility.parentName) row.push(student.parentName || "-");
      if (columnVisibility.parentPhone) row.push(student.parentPhone || "-");
      if (columnVisibility.status) row.push(student.status);

      body.push(row);
    }

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { top: 28, left: 14, right: 14 },
    });

    doc.save(`class-students-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getStatusColor = (status: string) => {
    if (["continuing", "fresher", "active"].includes(status))
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "inactive") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // SortIcon is defined at module scope to avoid creating components during render.

  if (!teacher) return <div className="py-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          {teacher.classNames?.[0] && (
            <p className="text-muted-foreground mt-1">
              {teacher.classNames[0]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="continuing">Continuing</SelectItem>
              <SelectItem value="fresher">Fresher</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={genderFilter}
            onValueChange={(v) => {
              setGenderFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Columns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(columnVisibility).map(([key, visible]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visible}
                    onCheckedChange={(checked) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [key]: checked,
                      }))
                    }
                  >
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="border rounded flex">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats & Pagination controls */}
      {studentsQuery && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              {totalStudents} student{totalStudents !== 1 ? "s" : ""}
              {searchQuery && ` matching “${searchQuery}”`}
            </span>
          </div>

          {totalStudents > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <span>
                  {startIndex + 1}–
                  {Math.min(startIndex + pageSize, totalStudents)} of{" "}
                  {totalStudents}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!studentsQuery ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : totalStudents === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 opacity-40 mb-4" />
          <p className="font-medium">No students found</p>
          {searchQuery && (
            <p className="text-sm mt-2">Try adjusting your search</p>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedStudents.map((student) => (
            <Card
              key={student._id}
              className="hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/teacher/students/${student._id}`)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4 ring-1 ring-border/50">
                  <AvatarImage src={student.photoUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-xl">
                    {student.firstName?.[0]}
                    {student.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-lg leading-tight">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {student.studentId}
                </p>
                <Badge
                  className={`mt-3 px-3 py-1 ${getStatusColor(student.status)}`}
                >
                  {student.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {columnVisibility.photo && (
                  <TableHead className="w-16">Photo</TableHead>
                )}
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    Name{" "}
                    <SortIcon
                      field="name"
                      currentSortField={sortField}
                      currentSortOrder={sortOrder}
                    />
                  </button>
                </TableHead>
                {columnVisibility.studentId && (
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("studentId")}
                    >
                      Student ID{" "}
                      <SortIcon
                        field="studentId"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                      />
                    </button>
                  </TableHead>
                )}
                {columnVisibility.gender && (
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("gender")}
                    >
                      Gender{" "}
                      <SortIcon
                        field="gender"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                      />
                    </button>
                  </TableHead>
                )}
                {columnVisibility.dateOfBirth && (
                  <TableHead>Date of Birth</TableHead>
                )}
                {columnVisibility.parentName && (
                  <TableHead>Parent Name</TableHead>
                )}
                {columnVisibility.parentPhone && (
                  <TableHead>Parent Phone</TableHead>
                )}
                {columnVisibility.status && (
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort("status")}
                    >
                      Status{" "}
                      <SortIcon
                        field="status"
                        currentSortField={sortField}
                        currentSortOrder={sortOrder}
                      />
                    </button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow
                  key={student._id}
                  className="cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() =>
                    router.push(`/teacher/students/${student._id}`)
                  }
                >
                  {columnVisibility.photo && (
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.photoUrl ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  {columnVisibility.studentId && (
                    <TableCell className="font-mono">
                      {student.studentId}
                    </TableCell>
                  )}
                  {columnVisibility.gender && (
                    <TableCell className="capitalize">
                      {student.gender || "—"}
                    </TableCell>
                  )}
                  {columnVisibility.dateOfBirth && (
                    <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                  )}
                  {columnVisibility.parentName && (
                    <TableCell>{student.parentName || "—"}</TableCell>
                  )}
                  {columnVisibility.parentPhone && (
                    <TableCell>{student.parentPhone || "—"}</TableCell>
                  )}
                  {columnVisibility.status && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(student.status)}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
