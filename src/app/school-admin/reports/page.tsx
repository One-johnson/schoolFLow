/* eslint-disable react-hooks/static-components */
"use client";

import { JSX, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import {
  BarChart3,
  FileDown,
  Eye,
  TrendingUp,
  Users,
  Award,
  FileText,
  UserCheck,
  ClipboardList,
  DollarSign,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exports";
import { ReportCardSheet } from "@/components/exams/report-card-sheet";
import { DataTable, createSortableHeader } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  _id: Id<"students">;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  classId: string;
  className: string;
  department: string;
  gender: string;
  status: string;
  admissionDate?: string;
}

interface Teacher {
  _id: Id<"teachers">;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[];
  employmentType: string;
  status: string;
}

interface AttendanceRecord {
  _id: Id<"attendance">;
  classId: string;
  className: string;
  date: string;
  session: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  totalStudents: number;
  status: string;
  markedByName?: string;
}

interface FeePayment {
  _id: Id<"feePayments">;
  studentName: string;
  classId: string;
  className: string;
  totalAmountDue: number;
  totalAmountPaid: number;
  totalBalance: number;
  paymentStatus: string;
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

interface SchoolEvent {
  _id: Id<"events">;
  eventTitle: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string;
  audienceType: string;
  status: string;
  venueType: string;
}

interface ReportCard {
  _id: Id<"reportCards">;
  reportCode: string;
  studentName: string;
  classId: string;
  className: string;
  academicYearId?: string;
  academicYearName?: string;
  termId?: string;
  termName?: string;
  totalScore: number;
  rawScore: number;
  percentage: number;
  overallGrade: string;
  position?: number;
  status: "draft" | "generated" | "published" | "archived";
  publishedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "published":
    case "paid":
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
    case "inactive":
    case "archived":
    case "cancelled":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    case "on_leave":
    case "partial":
    case "draft":
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
    case "fresher":
    case "upcoming":
    case "generated":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
    case "graduated":
    case "ongoing":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200";
    case "transferred":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200";
    default:
      return "";
  }
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "",
  iconColor = "text-primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  iconColor?: string;
}): JSX.Element {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function ExportButtons({
  onCSV,
  onPDF,
  disabled,
}: {
  onCSV: () => void;
  onPDF: () => void;
  disabled: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button variant="outline" size="sm" onClick={onCSV} disabled={disabled}>
        <FileDown className="h-3.5 w-3.5 mr-1.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onPDF} disabled={disabled}>
        <FileText className="h-3.5 w-3.5 mr-1.5" />
        PDF
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage(): JSX.Element {
  const { user } = useAuth();
  const schoolId = user?.schoolId || "";

  // ─── Data Queries ───────────────────────────────────────────────────────────
  const students = useQuery(api.students.getStudentsBySchool, { schoolId });
  const teachers = useQuery(api.teachers.getTeachersBySchool, { schoolId });
  const attendance = useQuery(api.attendance.getAttendanceBySchool, {
    schoolId,
  });
  const feePayments = useQuery(api.feePayments.getPaymentsBySchool, {
    schoolId,
  });
  const events = useQuery(api.events.getEventsBySchool, { schoolId });
  const reportCards = useQuery(api.reportCards.getReportCardsBySchool, {
    schoolId,
  });
  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });
  const terms = useQuery(api.terms.getTermsBySchool, { schoolId });
  const academicYears = useQuery(api.academicYears.getYearsBySchool, {
    schoolId,
  });

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [studentFilterClass, setStudentFilterClass] = useState("all");
  const [studentFilterStatus, setStudentFilterStatus] = useState("all");
  const [teacherFilterStatus, setTeacherFilterStatus] = useState("all");
  const [teacherFilterEmployment, setTeacherFilterEmployment] = useState("all");
  const [attFilterClass, setAttFilterClass] = useState("all");
  const [feeFilterClass, setFeeFilterClass] = useState("all");
  const [feeFilterStatus, setFeeFilterStatus] = useState("all");
  const [eventFilterStatus, setEventFilterStatus] = useState("all");
  const [eventFilterType, setEventFilterType] = useState("all");
  const [rcFilterClass, setRcFilterClass] = useState("all");
  const [rcFilterTerm, setRcFilterTerm] = useState("all");
  const [rcFilterYear, setRcFilterYear] = useState("all");
  const [rcFilterStatus, setRcFilterStatus] = useState("all");

  // Report card view dialog
  const [showView, setShowView] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return (students as Student[]).filter((s) => {
      if (studentFilterClass !== "all" && s.classId !== studentFilterClass)
        return false;
      if (studentFilterStatus !== "all" && s.status !== studentFilterStatus)
        return false;
      return true;
    });
  }, [students, studentFilterClass, studentFilterStatus]);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return (teachers as Teacher[]).filter((t) => {
      if (teacherFilterStatus !== "all" && t.status !== teacherFilterStatus)
        return false;
      if (
        teacherFilterEmployment !== "all" &&
        t.employmentType !== teacherFilterEmployment
      )
        return false;
      return true;
    });
  }, [teachers, teacherFilterStatus, teacherFilterEmployment]);

  const filteredAttendance = useMemo(() => {
    if (!attendance) return [];
    return (attendance as AttendanceRecord[]).filter((a) => {
      if (attFilterClass !== "all" && a.classId !== attFilterClass)
        return false;
      return true;
    });
  }, [attendance, attFilterClass]);

  const filteredFees = useMemo(() => {
    if (!feePayments) return [];
    return (feePayments as FeePayment[]).filter((f) => {
      if (feeFilterClass !== "all" && f.classId !== feeFilterClass)
        return false;
      if (feeFilterStatus !== "all" && f.paymentStatus !== feeFilterStatus)
        return false;
      return true;
    });
  }, [feePayments, feeFilterClass, feeFilterStatus]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return (events as SchoolEvent[]).filter((e) => {
      if (eventFilterStatus !== "all" && e.status !== eventFilterStatus)
        return false;
      if (eventFilterType !== "all" && e.eventType !== eventFilterType)
        return false;
      return true;
    });
  }, [events, eventFilterStatus, eventFilterType]);

  const filteredReportCards = useMemo(() => {
    if (!reportCards) return [];
    return (reportCards as ReportCard[]).filter((r) => {
      if (rcFilterClass !== "all" && r.classId !== rcFilterClass) return false;
      if (rcFilterTerm !== "all" && r.termId !== rcFilterTerm) return false;
      if (rcFilterYear !== "all" && r.academicYearId !== rcFilterYear)
        return false;
      if (rcFilterStatus !== "all" && r.status !== rcFilterStatus) return false;
      return true;
    });
  }, [reportCards, rcFilterClass, rcFilterTerm, rcFilterYear, rcFilterStatus]);

  // ─── Derived Stats ──────────────────────────────────────────────────────────
  const studentStats = useMemo(
    () => ({
      total: filteredStudents.length,
      active: filteredStudents.filter((s) => s.status === "active").length,
      inactive: filteredStudents.filter((s) => s.status === "inactive").length,
      freshers: filteredStudents.filter((s) => s.status === "fresher").length,
    }),
    [filteredStudents],
  );

  const teacherStats = useMemo(
    () => ({
      total: filteredTeachers.length,
      active: filteredTeachers.filter((t) => t.status === "active").length,
      onLeave: filteredTeachers.filter((t) => t.status === "on_leave").length,
      fullTime: filteredTeachers.filter((t) => t.employmentType === "full_time")
        .length,
    }),
    [filteredTeachers],
  );

  const attendanceStats = useMemo(() => {
    const present = filteredAttendance.reduce((s, a) => s + a.presentCount, 0);
    const absent = filteredAttendance.reduce((s, a) => s + a.absentCount, 0);
    const late = filteredAttendance.reduce((s, a) => s + a.lateCount, 0);
    const excused = filteredAttendance.reduce((s, a) => s + a.excusedCount, 0);
    const marked = present + absent + late + excused;
    return {
      sessions: filteredAttendance.length,
      rate:
        marked > 0
          ? Math.round(((present + late + excused) / marked) * 100)
          : 0,
      present,
      absent,
    };
  }, [filteredAttendance]);

  const feeStats = useMemo(
    () => ({
      totalDue: filteredFees.reduce((s, f) => s + f.totalAmountDue, 0),
      collected: filteredFees.reduce((s, f) => s + f.totalAmountPaid, 0),
      outstanding: filteredFees.reduce((s, f) => s + f.totalBalance, 0),
      paidCount: filteredFees.filter((f) => f.paymentStatus === "paid").length,
    }),
    [filteredFees],
  );

  const eventStats = useMemo(
    () => ({
      total: filteredEvents.length,
      upcoming: filteredEvents.filter((e) => e.status === "upcoming").length,
      completed: filteredEvents.filter((e) => e.status === "completed").length,
      cancelled: filteredEvents.filter((e) => e.status === "cancelled").length,
    }),
    [filteredEvents],
  );

  const reportCardStats = useMemo(() => {
    const total = filteredReportCards.length;
    const published = filteredReportCards.filter(
      (r) => r.status === "published",
    ).length;
    const avgPct =
      total > 0
        ? Math.round(
            filteredReportCards.reduce((s, r) => s + r.percentage, 0) / total,
          )
        : 0;
    const top =
      total > 0
        ? filteredReportCards.reduce(
            (best, r) => (r.percentage > best.percentage ? r : best),
            filteredReportCards[0],
          )
        : null;
    return { total, published, avgPct, topStudent: top?.studentName || "—" };
  }, [filteredReportCards]);

  // ─── Column Definitions ─────────────────────────────────────────────────────
  const studentColumns: ColumnDef<Student>[] = [
    {
      accessorKey: "firstName",
      header: ({ column }) => createSortableHeader(column, "Name"),
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "admissionNumber",
      header: "Adm. No.",
      cell: ({ row }) => row.original.admissionNumber || "—",
    },
    {
      accessorKey: "className",
      header: ({ column }) => createSortableHeader(column, "Class"),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => capitalize(row.original.department),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => capitalize(row.original.gender),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "admissionDate",
      header: "Admitted",
      cell: ({ row }) =>
        row.original.admissionDate
          ? shortDate(row.original.admissionDate)
          : "—",
    },
  ];

  const teacherColumns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "firstName",
      header: ({ column }) => createSortableHeader(column, "Name"),
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ row }) => row.original.subjects?.join(", ") || "—",
    },
    {
      accessorKey: "employmentType",
      header: "Employment",
      cell: ({ row }) => capitalize(row.original.employmentType),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  const attendanceColumns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: "className",
      header: ({ column }) => createSortableHeader(column, "Class"),
    },
    {
      accessorKey: "date",
      header: ({ column }) => createSortableHeader(column, "Date"),
      cell: ({ row }) => shortDate(row.original.date),
    },
    {
      accessorKey: "session",
      header: "Session",
      cell: ({ row }) => capitalize(row.original.session),
    },
    {
      accessorKey: "presentCount",
      header: ({ column }) => createSortableHeader(column, "Present"),
    },
    {
      accessorKey: "absentCount",
      header: ({ column }) => createSortableHeader(column, "Absent"),
    },
    {
      accessorKey: "lateCount",
      header: "Late",
    },
    {
      accessorKey: "excusedCount",
      header: "Excused",
    },
    {
      accessorKey: "totalStudents",
      header: "Total",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "markedByName",
      header: "Marked By",
      cell: ({ row }) => row.original.markedByName || "—",
    },
  ];

  const feeColumns: ColumnDef<FeePayment>[] = [
    {
      accessorKey: "studentName",
      header: ({ column }) => createSortableHeader(column, "Student"),
    },
    {
      accessorKey: "className",
      header: ({ column }) => createSortableHeader(column, "Class"),
    },
    {
      accessorKey: "receiptNumber",
      header: "Receipt",
      cell: ({ row }) => row.original.receiptNumber || "—",
    },
    {
      accessorKey: "totalAmountDue",
      header: ({ column }) => createSortableHeader(column, "Due"),
      cell: ({ row }) => row.original.totalAmountDue.toLocaleString(),
    },
    {
      accessorKey: "totalAmountPaid",
      header: ({ column }) => createSortableHeader(column, "Paid"),
      cell: ({ row }) => row.original.totalAmountPaid.toLocaleString(),
    },
    {
      accessorKey: "totalBalance",
      header: ({ column }) => createSortableHeader(column, "Balance"),
      cell: ({ row }) => (
        <span
          className={
            row.original.totalBalance > 0 ? "text-red-600" : "text-green-600"
          }
        >
          {row.original.totalBalance.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => row.original.paymentMethod || "—",
    },
    {
      accessorKey: "paymentDate",
      header: "Date",
      cell: ({ row }) =>
        row.original.paymentDate ? shortDate(row.original.paymentDate) : "—",
    },
  ];

  const eventColumns: ColumnDef<SchoolEvent>[] = [
    {
      accessorKey: "eventTitle",
      header: ({ column }) => createSortableHeader(column, "Event"),
    },
    {
      accessorKey: "eventType",
      header: "Type",
      cell: ({ row }) => capitalize(row.original.eventType),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => createSortableHeader(column, "Start"),
      cell: ({ row }) => shortDate(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: "End",
      cell: ({ row }) => shortDate(row.original.endDate),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) =>
        row.original.location ||
        (row.original.venueType === "virtual" ? "Virtual" : "—"),
    },
    {
      accessorKey: "audienceType",
      header: "Audience",
      cell: ({ row }) => capitalize(row.original.audienceType),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  const reportCardColumns: ColumnDef<ReportCard>[] = [
    {
      accessorKey: "studentName",
      header: ({ column }) => createSortableHeader(column, "Student"),
    },
    {
      accessorKey: "className",
      header: ({ column }) => createSortableHeader(column, "Class"),
    },
    {
      accessorKey: "termName",
      header: "Term",
      cell: ({ row }) => row.original.termName || "—",
    },
    {
      accessorKey: "academicYearName",
      header: "Year",
      cell: ({ row }) => row.original.academicYearName || "—",
    },
    {
      accessorKey: "totalScore",
      header: ({ column }) => createSortableHeader(column, "Score"),
      cell: ({ row }) =>
        `${row.original.totalScore} / ${row.original.rawScore}`,
    },
    {
      accessorKey: "percentage",
      header: ({ column }) => createSortableHeader(column, "%"),
      cell: ({ row }) => `${row.original.percentage}%`,
    },
    {
      accessorKey: "overallGrade",
      header: "Grade",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.overallGrade}
        </span>
      ),
    },
    {
      accessorKey: "position",
      header: ({ column }) => createSortableHeader(column, "Rank"),
      cell: ({ row }) =>
        row.original.position ? `#${row.original.position}` : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => {
            setSelectedReport(row.original);
            setShowView(true);
          }}
          title="View Report"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // ─── Export Handlers ────────────────────────────────────────────────────────
  const exportStudentsCSV = (): void => {
    if (!filteredStudents.length) return;
    exportToCSV(
      filteredStudents.map((s) => ({
        Name: `${s.firstName} ${s.lastName}`,
        "Admission No.": s.admissionNumber || "—",
        Class: s.className,
        Department: s.department,
        Gender: s.gender,
        Status: s.status,
        "Admission Date": s.admissionDate || "—",
      })),
      "students-report",
    );
  };
  const exportStudentsPDF = (): void => {
    if (!filteredStudents.length) return;
    exportToPDF(
      filteredStudents.map((s) => ({
        Name: `${s.firstName} ${s.lastName}`,
        "Adm. No.": s.admissionNumber || "—",
        Class: s.className,
        Department: s.department,
        Gender: s.gender,
        Status: s.status,
      })),
      "students-report",
      "Students Report",
    );
  };

  const exportTeachersCSV = (): void => {
    if (!filteredTeachers.length) return;
    exportToCSV(
      filteredTeachers.map((t) => ({
        Name: `${t.firstName} ${t.lastName}`,
        Email: t.email,
        Phone: t.phone || "—",
        Subjects: t.subjects?.join(", ") || "—",
        Employment: t.employmentType,
        Status: t.status,
      })),
      "teachers-report",
    );
  };
  const exportTeachersPDF = (): void => {
    if (!filteredTeachers.length) return;
    exportToPDF(
      filteredTeachers.map((t) => ({
        Name: `${t.firstName} ${t.lastName}`,
        Email: t.email,
        Subjects: t.subjects?.join(", ") || "—",
        Employment: t.employmentType,
        Status: t.status,
      })),
      "teachers-report",
      "Teachers Report",
    );
  };

  const exportAttendanceCSV = (): void => {
    if (!filteredAttendance.length) return;
    exportToCSV(
      filteredAttendance.map((a) => ({
        Class: a.className,
        Date: a.date,
        Session: a.session,
        Present: String(a.presentCount),
        Absent: String(a.absentCount),
        Late: String(a.lateCount),
        Excused: String(a.excusedCount),
        "Total Students": String(a.totalStudents),
        Status: a.status,
        "Marked By": a.markedByName || "—",
      })),
      "attendance-report",
    );
  };
  const exportAttendancePDF = (): void => {
    if (!filteredAttendance.length) return;
    exportToPDF(
      filteredAttendance.map((a) => ({
        Class: a.className,
        Date: a.date,
        Session: a.session,
        Present: String(a.presentCount),
        Absent: String(a.absentCount),
        Late: String(a.lateCount),
        Excused: String(a.excusedCount),
        Total: String(a.totalStudents),
        Status: a.status,
      })),
      "attendance-report",
      "Attendance Report",
    );
  };

  const exportFeesCSV = (): void => {
    if (!filteredFees.length) return;
    exportToCSV(
      filteredFees.map((f) => ({
        Student: f.studentName,
        Class: f.className,
        Receipt: f.receiptNumber || "—",
        "Amount Due": String(f.totalAmountDue),
        "Amount Paid": String(f.totalAmountPaid),
        Balance: String(f.totalBalance),
        Status: f.paymentStatus,
        Method: f.paymentMethod || "—",
        Date: f.paymentDate || "—",
      })),
      "fees-report",
    );
  };
  const exportFeesPDF = (): void => {
    if (!filteredFees.length) return;
    exportToPDF(
      filteredFees.map((f) => ({
        Student: f.studentName,
        Class: f.className,
        Due: f.totalAmountDue.toLocaleString(),
        Paid: f.totalAmountPaid.toLocaleString(),
        Balance: f.totalBalance.toLocaleString(),
        Status: f.paymentStatus,
        Date: f.paymentDate || "—",
      })),
      "fees-report",
      "Fee Payments Report",
    );
  };

  const exportEventsCSV = (): void => {
    if (!filteredEvents.length) return;
    exportToCSV(
      filteredEvents.map((e) => ({
        Event: e.eventTitle,
        Type: e.eventType,
        "Start Date": e.startDate,
        "End Date": e.endDate,
        Location: e.location || "—",
        Audience: e.audienceType,
        "Venue Type": e.venueType,
        Status: e.status,
      })),
      "events-report",
    );
  };
  const exportEventsPDF = (): void => {
    if (!filteredEvents.length) return;
    exportToPDF(
      filteredEvents.map((e) => ({
        Event: e.eventTitle,
        Type: e.eventType,
        Start: e.startDate,
        End: e.endDate,
        Location: e.location || "—",
        Audience: e.audienceType,
        Status: e.status,
      })),
      "events-report",
      "Events Report",
    );
  };

  const exportReportCardsCSV = (): void => {
    if (!filteredReportCards.length) return;
    exportToCSV(
      filteredReportCards.map((r) => ({
        "Report Code": r.reportCode,
        "Student Name": r.studentName,
        Class: r.className,
        "Academic Year": r.academicYearName || "—",
        Term: r.termName || "—",
        "Total Score": r.totalScore,
        "Raw Score": r.rawScore,
        Percentage: `${r.percentage}%`,
        Grade: r.overallGrade,
        Position: r.position || "—",
        Status: r.status,
        "Published Date": r.publishedAt || "—",
      })),
      "report-cards",
    );
  };
  const exportReportCardsPDF = (): void => {
    if (!filteredReportCards.length) return;
    exportToPDF(
      filteredReportCards.map((r) => ({
        Student: r.studentName,
        Class: r.className,
        Term: r.termName || "—",
        Score: `${r.totalScore} / ${r.rawScore}`,
        Percentage: `${r.percentage}%`,
        Grade: r.overallGrade,
        Position: r.position ? `#${r.position}` : "—",
        Status: r.status,
      })),
      "report-cards",
      "Report Cards Summary",
    );
  };

  // ─── Reusable: Class Filter ─────────────────────────────────────────────────
  const ClassFilter = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }): JSX.Element => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-45">
        <SelectValue placeholder="All Classes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Classes</SelectItem>
        {classes?.map((cls) => (
          <SelectItem key={cls._id} value={cls._id}>
            {cls.className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Comprehensive school reports — students, teachers, attendance, fees,
          events, and report cards
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="students">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Events
          </TabsTrigger>
          <TabsTrigger value="reportcards">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Report Cards
          </TabsTrigger>
        </TabsList>

        {/* ─── Students Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={studentStats.total}
              icon={Users}
            />
            <StatCard
              label="Active"
              value={studentStats.active}
              icon={TrendingUp}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="Inactive"
              value={studentStats.inactive}
              icon={Award}
              color="text-gray-600"
              iconColor="text-gray-400"
            />
            <StatCard
              label="New (Freshers)"
              value={studentStats.freshers}
              icon={BarChart3}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ClassFilter
              value={studentFilterClass}
              onChange={setStudentFilterClass}
            />
            <Select
              value={studentFilterStatus}
              onValueChange={setStudentFilterStatus}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Statuses" />
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
            {(studentFilterClass !== "all" ||
              studentFilterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStudentFilterClass("all");
                  setStudentFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportStudentsCSV}
              onPDF={exportStudentsPDF}
              disabled={filteredStudents.length === 0}
            />
          </div>
          <DataTable columns={studentColumns} data={filteredStudents} />
        </TabsContent>

        {/* ─── Teachers Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="teachers" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Teachers"
              value={teacherStats.total}
              icon={Users}
            />
            <StatCard
              label="Active"
              value={teacherStats.active}
              icon={TrendingUp}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="On Leave"
              value={teacherStats.onLeave}
              icon={Award}
              color="text-yellow-600"
              iconColor="text-yellow-500"
            />
            <StatCard
              label="Full-Time"
              value={teacherStats.fullTime}
              icon={BarChart3}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={teacherFilterStatus}
              onValueChange={setTeacherFilterStatus}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={teacherFilterEmployment}
              onValueChange={setTeacherFilterEmployment}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Employment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employment</SelectItem>
                <SelectItem value="full_time">Full-Time</SelectItem>
                <SelectItem value="part_time">Part-Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            {(teacherFilterStatus !== "all" ||
              teacherFilterEmployment !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTeacherFilterStatus("all");
                  setTeacherFilterEmployment("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportTeachersCSV}
              onPDF={exportTeachersPDF}
              disabled={filteredTeachers.length === 0}
            />
          </div>
          <DataTable columns={teacherColumns} data={filteredTeachers} />
        </TabsContent>

        {/* ─── Attendance Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Sessions"
              value={attendanceStats.sessions}
              icon={ClipboardList}
            />
            <StatCard
              label="Attendance Rate"
              value={`${attendanceStats.rate}%`}
              icon={TrendingUp}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="Total Present"
              value={attendanceStats.present}
              icon={Users}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
            <StatCard
              label="Total Absent"
              value={attendanceStats.absent}
              icon={BarChart3}
              color="text-red-600"
              iconColor="text-red-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ClassFilter value={attFilterClass} onChange={setAttFilterClass} />
            {attFilterClass !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttFilterClass("all")}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportAttendanceCSV}
              onPDF={exportAttendancePDF}
              disabled={filteredAttendance.length === 0}
            />
          </div>
          <DataTable columns={attendanceColumns} data={filteredAttendance} />
        </TabsContent>

        {/* ─── Fees Tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="fees" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Due"
              value={feeStats.totalDue.toLocaleString()}
              icon={DollarSign}
            />
            <StatCard
              label="Collected"
              value={feeStats.collected.toLocaleString()}
              icon={TrendingUp}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="Outstanding"
              value={feeStats.outstanding.toLocaleString()}
              icon={Award}
              color="text-red-600"
              iconColor="text-red-500"
            />
            <StatCard
              label="Paid Count"
              value={feeStats.paidCount}
              icon={BarChart3}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ClassFilter value={feeFilterClass} onChange={setFeeFilterClass} />
            <Select value={feeFilterStatus} onValueChange={setFeeFilterStatus}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {(feeFilterClass !== "all" || feeFilterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFeeFilterClass("all");
                  setFeeFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportFeesCSV}
              onPDF={exportFeesPDF}
              disabled={filteredFees.length === 0}
            />
          </div>
          <DataTable columns={feeColumns} data={filteredFees} />
        </TabsContent>

        {/* ─── Events Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Events"
              value={eventStats.total}
              icon={Calendar}
            />
            <StatCard
              label="Upcoming"
              value={eventStats.upcoming}
              icon={TrendingUp}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
            <StatCard
              label="Completed"
              value={eventStats.completed}
              icon={Award}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="Cancelled"
              value={eventStats.cancelled}
              icon={BarChart3}
              color="text-red-600"
              iconColor="text-red-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={eventFilterStatus}
              onValueChange={setEventFilterStatus}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilterType} onValueChange={setEventFilterType}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="parent_meeting">Parent Meeting</SelectItem>
                <SelectItem value="assembly">Assembly</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="field_trip">Field Trip</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {(eventFilterStatus !== "all" || eventFilterType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEventFilterStatus("all");
                  setEventFilterType("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportEventsCSV}
              onPDF={exportEventsPDF}
              disabled={filteredEvents.length === 0}
            />
          </div>
          <DataTable columns={eventColumns} data={filteredEvents} />
        </TabsContent>

        {/* ─── Report Cards Tab ───────────────────────────────────────────────── */}
        <TabsContent value="reportcards" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Reports"
              value={reportCardStats.total}
              icon={BarChart3}
            />
            <StatCard
              label="Published"
              value={reportCardStats.published}
              icon={Users}
              color="text-green-600"
              iconColor="text-green-500"
            />
            <StatCard
              label="Avg Score"
              value={`${reportCardStats.avgPct}%`}
              icon={TrendingUp}
              color="text-blue-600"
              iconColor="text-blue-500"
            />
            {/* Top Student card — smaller text for long names */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Top Student
                    </p>
                    <p className="text-sm font-bold text-amber-600 truncate max-w-25">
                      {reportCardStats.topStudent}
                    </p>
                  </div>
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ClassFilter value={rcFilterClass} onChange={setRcFilterClass} />
            <Select value={rcFilterTerm} onValueChange={setRcFilterTerm}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms?.map((term) => (
                  <SelectItem key={term._id} value={term._id}>
                    {term.termName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rcFilterYear} onValueChange={setRcFilterYear}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears?.map((year) => (
                  <SelectItem key={year._id} value={year._id}>
                    {year.yearName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rcFilterStatus} onValueChange={setRcFilterStatus}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {(rcFilterClass !== "all" ||
              rcFilterTerm !== "all" ||
              rcFilterYear !== "all" ||
              rcFilterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRcFilterClass("all");
                  setRcFilterTerm("all");
                  setRcFilterYear("all");
                  setRcFilterStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
            <ExportButtons
              onCSV={exportReportCardsCSV}
              onPDF={exportReportCardsPDF}
              disabled={filteredReportCards.length === 0}
            />
          </div>
          <DataTable columns={reportCardColumns} data={filteredReportCards} />
        </TabsContent>
      </Tabs>

      {/* View Report Card Dialog */}
      {selectedReport && (
        <ReportCardSheet
          open={showView}
          onOpenChange={setShowView}
          reportCardId={selectedReport._id}
        />
      )}
    </div>
  );
}
