"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Percent,
  FileCheck,
  UserX,
  Download,
  MessageCircle,
  Mail,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  buildResultsShareText,
  buildStudentResultsPdf,
  downloadStudentResultsPdf,
  openEmailWithBody,
  openWhatsAppWithText,
  sharePdfWithSystemSheet,
  type StudentResultPdfRow,
} from "@/lib/student-results-pdf";

const NONE_KEY = "__none__";

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function gradeBadgeClass(grade: string): string {
  const g = grade.trim().toUpperCase();
  if (g.startsWith("A"))
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-100";
  if (g.startsWith("B"))
    return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-100";
  if (g.startsWith("C"))
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100";
  return "border-violet-200/80 bg-violet-50/80 text-violet-950 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-100";
}

function toPdfRows(
  rows: Array<{
    examName: string;
    subjectName: string;
    classScore: number;
    examScore: number;
    totalScore: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    remarks: string;
    isAbsent: boolean;
    academicYearName: string | null;
    termName: string | null;
  }>,
): StudentResultPdfRow[] {
  return rows.map((m) => ({
    examName: m.examName,
    subjectName: m.subjectName,
    classScore: m.classScore,
    examScore: m.examScore,
    totalScore: m.totalScore,
    maxMarks: m.maxMarks,
    percentage: m.percentage,
    grade: m.grade,
    remarks: m.remarks,
    isAbsent: m.isAbsent,
    academicYearName: m.academicYearName,
    termName: m.termName,
  }));
}

function slugForFile(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "export";
}

type FilterMode = "all" | "year" | "term";

export default function StudentResultsPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedYearKey, setSelectedYearKey] = useState<string>("");
  const [selectedTermKey, setSelectedTermKey] = useState<string>("");

  const marks = useQuery(
    api.students.getPublishedMarksWithTermsForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students">, limit: 200 } : "skip",
  );

  const yearOptions = useMemo(() => {
    if (!marks?.length) return [];
    const map = new Map<string, string>();
    for (const m of marks) {
      const id = m.academicYearId ?? NONE_KEY;
      const name =
        m.academicYearName ??
        (id === NONE_KEY ? "Not linked to an academic year" : "Academic year");
      if (!map.has(id)) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [marks]);

  const termOptions = useMemo(() => {
    if (!marks?.length) return [];
    const map = new Map<string, string>();
    for (const m of marks) {
      const id = m.termId ?? NONE_KEY;
      const label =
        id === NONE_KEY
          ? "Not linked to a term"
          : `${m.termName ?? "Term"} · ${m.academicYearName ?? "—"}`;
      if (!map.has(id)) map.set(id, label);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [marks]);

  const effectiveYearKey =
    filterMode === "year" && yearOptions.length
      ? yearOptions.some((o) => o.id === selectedYearKey)
        ? selectedYearKey
        : yearOptions[0].id
      : selectedYearKey;

  const effectiveTermKey =
    filterMode === "term" && termOptions.length
      ? termOptions.some((o) => o.id === selectedTermKey)
        ? selectedTermKey
        : termOptions[0].id
      : selectedTermKey;

  const filteredMarks = useMemo(() => {
    if (!marks?.length) return [];
    if (filterMode === "all") return marks;
    if (filterMode === "year") {
      if (!effectiveYearKey) return marks;
      if (effectiveYearKey === NONE_KEY) {
        return marks.filter((m) => !m.academicYearId);
      }
      return marks.filter((m) => m.academicYearId === effectiveYearKey);
    }
    if (!effectiveTermKey) return marks;
    if (effectiveTermKey === NONE_KEY) {
      return marks.filter((m) => !m.termId);
    }
    return marks.filter((m) => m.termId === effectiveTermKey);
  }, [marks, filterMode, effectiveYearKey, effectiveTermKey]);

  const periodLabel = useMemo(() => {
    if (filterMode === "all") return "All published results";
    if (filterMode === "year") {
      const o = yearOptions.find((x) => x.id === effectiveYearKey);
      return o?.name ?? "Academic year";
    }
    const o = termOptions.find((x) => x.id === effectiveTermKey);
    return o?.label ?? "Term";
  }, [filterMode, effectiveYearKey, effectiveTermKey, yearOptions, termOptions]);

  const stats = useMemo(() => {
    if (!filteredMarks.length) {
      return { total: 0, absent: 0, avgPct: null as number | null };
    }
    const absent = filteredMarks.filter((m) => m.isAbsent).length;
    const scored = filteredMarks.filter((m) => !m.isAbsent);
    const avgPct =
      scored.length > 0
        ? Math.round(
            scored.reduce((s, m) => s + m.percentage, 0) / scored.length,
          )
        : null;
    return { total: filteredMarks.length, absent, avgPct };
  }, [filteredMarks]);

  const studentDisplayName = `${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim();

  const handleDownloadPdf = () => {
    if (!student || !filteredMarks.length) {
      toast.error("No results to download for this scope.");
      return;
    }
    const rows = toPdfRows(filteredMarks);
    const doc = buildStudentResultsPdf({
      studentDisplayName,
      studentIdLabel: student.studentId,
      className: student.className,
      periodLabel,
      generatedAt: new Date(),
      rows,
    });
    const fname = `results-${student.studentId}-${slugForFile(periodLabel)}.pdf`;
    downloadStudentResultsPdf(doc, fname);
    toast.success("PDF downloaded");
  };

  const sharePayload = () => {
    if (!student || !filteredMarks.length) return null;
    const rows = toPdfRows(filteredMarks);
    const text = buildResultsShareText({
      studentDisplayName,
      studentIdLabel: student.studentId,
      className: student.className,
      periodLabel,
      rows,
    });
    const doc = buildStudentResultsPdf({
      studentDisplayName,
      studentIdLabel: student.studentId,
      className: student.className,
      periodLabel,
      generatedAt: new Date(),
      rows,
    });
    const fname = `results-${student.studentId}-${slugForFile(periodLabel)}.pdf`;
    return { text, doc, fname };
  };

  const handleWhatsApp = () => {
    const p = sharePayload();
    if (!p) {
      toast.error("No results to share for this scope.");
      return;
    }
    openWhatsAppWithText(p.text);
  };

  const handleEmail = () => {
    const p = sharePayload();
    if (!p) {
      toast.error("No results to share for this scope.");
      return;
    }
    openEmailWithBody(`School results — ${periodLabel}`, p.text);
  };

  const handleNativeSharePdf = async () => {
    const p = sharePayload();
    if (!p) {
      toast.error("No results to share for this scope.");
      return;
    }
    const blob = p.doc.output("blob");
    const ok = await sharePdfWithSystemSheet({
      pdfBlob: blob,
      filename: p.fname,
      title: `Results — ${periodLabel}`,
      text: `Results for ${studentDisplayName} (${student!.studentId})`,
    });
    if (ok) toast.success("Shared");
    else {
      toast.message("Sharing PDF isn’t available here—use Download, then attach in your app.");
      downloadStudentResultsPdf(p.doc, p.fname);
    }
  };

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-1">
      <StudentPageHeader
        icon={BarChart3}
        title="Results"
        subtitle="Published scores from your exams and class work"
      />

      {marks === undefined && (
        <div className="space-y-4 animate-pulse">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-muted/60" />
            <div className="h-24 rounded-xl bg-muted/60" />
            <div className="h-24 rounded-xl bg-muted/60" />
          </div>
          <div className="h-64 rounded-xl bg-muted/40" />
        </div>
      )}

      {marks && marks.length === 0 && (
        <Card className="border-dashed border-violet-200/80 bg-violet-50/20 shadow-sm dark:border-violet-800/50 dark:bg-violet-950/20">
          <CardHeader>
            <CardTitle>No published results yet</CardTitle>
            <CardDescription>
              When your teachers publish marks for your class, they will show up here. Check back
              after exams or reports are released.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {marks && marks.length > 0 && (
        <>
          <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Download &amp; share</CardTitle>
              <CardDescription>
                Export a PDF by academic year or term (when your school links exams to them). WhatsApp
                and email send a text summary—use &quot;Share PDF&quot; on supported devices to attach the
                file.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-2 min-w-[200px] flex-1">
                  <Label htmlFor="scope-mode">Scope</Label>
                  <Select
                    value={filterMode}
                    onValueChange={(v) => setFilterMode(v as FilterMode)}
                  >
                    <SelectTrigger id="scope-mode" className="w-full sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All published</SelectItem>
                      <SelectItem value="year">Academic year</SelectItem>
                      <SelectItem value="term">Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filterMode === "year" && yearOptions.length > 0 ? (
                  <div className="space-y-2 min-w-[200px] flex-1">
                    <Label htmlFor="scope-year">Academic year</Label>
                    <Select value={effectiveYearKey} onValueChange={setSelectedYearKey}>
                      <SelectTrigger id="scope-year" className="w-full sm:max-w-xs">
                        <SelectValue placeholder="Choose year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                {filterMode === "term" && termOptions.length > 0 ? (
                  <div className="space-y-2 min-w-[220px] flex-1">
                    <Label htmlFor="scope-term">Term</Label>
                    <Select value={effectiveTermKey} onValueChange={setSelectedTermKey}>
                      <SelectTrigger id="scope-term" className="w-full sm:max-w-md">
                        <SelectValue placeholder="Choose term" />
                      </SelectTrigger>
                      <SelectContent>
                        {termOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {filteredMarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No marks match this scope. Try &quot;All published&quot; or another year/term.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{periodLabel}</span> —{" "}
                  {filteredMarks.length} row{filteredMarks.length === 1 ? "" : "s"}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={!filteredMarks.length}
                  onClick={handleDownloadPdf}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!filteredMarks.length}
                  onClick={handleWhatsApp}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!filteredMarks.length}
                  onClick={handleEmail}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!filteredMarks.length}
                  onClick={() => void handleNativeSharePdf()}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>In scope</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{stats.total}</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Average %</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">
                    {stats.avgPct !== null ? `${stats.avgPct}%` : "—"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  For rows in this scope (absences excluded)
                </p>
              </CardContent>
            </Card>
            <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Absent</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{stats.absent}</CardTitle>
                </div>
              </CardHeader>
              {stats.absent > 0 ? (
                <CardContent className="pb-4 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Recorded as absent for that paper
                  </p>
                </CardContent>
              ) : null}
            </Card>
          </div>

          <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your marks</CardTitle>
              <CardDescription>{student.className}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0 px-0 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Exam</TableHead>
                    <TableHead className="hidden lg:table-cell">Year</TableHead>
                    <TableHead className="hidden lg:table-cell">Term</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Class</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Exam</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="hidden xl:table-cell max-w-[140px]">Remark</TableHead>
                    <TableHead className="hidden sm:table-cell text-muted-foreground font-normal">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarks.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="font-medium align-top max-w-[160px]">
                        <span className="line-clamp-2">{m.examName}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground align-top">
                        {m.academicYearName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground align-top">
                        {m.termName ?? "—"}
                      </TableCell>
                      <TableCell className="align-top">{m.subjectName}</TableCell>
                      <TableCell className="hidden md:table-cell text-right tabular-nums align-top">
                        {m.isAbsent ? "—" : m.classScore}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right tabular-nums align-top">
                        {m.isAbsent ? "—" : m.examScore}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        {m.isAbsent ? "—" : m.totalScore}
                      </TableCell>
                      <TableCell className="text-right tabular-nums align-top">{m.maxMarks}</TableCell>
                      <TableCell className="text-right tabular-nums align-top">
                        {m.isAbsent ? "—" : `${Math.round(m.percentage)}%`}
                      </TableCell>
                      <TableCell className="align-top">
                        {m.isAbsent ? (
                          <Badge variant="outline" className="font-normal">
                            Absent
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`font-medium border ${gradeBadgeClass(m.grade)}`}
                          >
                            {m.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground align-top max-w-[180px]">
                        {m.isAbsent ? "—" : <span className="line-clamp-2">{m.remarks}</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap align-top">
                        {formatUpdated(m.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
