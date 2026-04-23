"use client";

import { useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import {
  StudentTimetableGrid,
  StudentTimetableLegend,
} from "@/components/student/student-timetable-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  buildStudentTimetableIcs,
  downloadStudentTimetableIcs,
} from "@/lib/student-timetable-ics";
import { downloadStudentTimetablePdf } from "@/lib/student-timetable-pdf";
import { CalendarDays, ChevronDown, Clock, FileDown } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentTimetablePage(): React.ReactNode {
  const { student } = useStudentAuth();

  const data = useQuery(
    api.students.getTimetableForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students"> } : "skip",
  );

  const handleDownloadPdf = useCallback(() => {
    if (!student || !data?.timetable || !data.periods.length) return;
    downloadStudentTimetablePdf({
      className: student.className,
      periods: data.periods,
      assignments: data.assignments,
      academicYearLabel: data.academicYearLabel,
      termLabel: data.termLabel,
      updatedAt: data.timetable.updatedAt,
    });
  }, [student, data]);

  const handleDownloadIcs = useCallback(() => {
    if (!student || !data?.assignments?.length) return;
    const ics = buildStudentTimetableIcs({
      className: student.className,
      assignments: data.assignments,
    });
    downloadStudentTimetableIcs(ics, `timetable-${student.className}`);
  }, [student, data]);

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 print:max-w-none">
      <StudentPageHeader icon={Clock} title="Timetable" subtitle={student.className} />

      {data === undefined && (
        <Card className="border-violet-200/40 dark:border-violet-900/40">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-[22rem] w-full rounded-lg" />
          </CardContent>
        </Card>
      )}

      {data && !data.timetable && (
        <Card className="border-violet-200/60 dark:border-violet-800/40 border-dashed bg-violet-500/[0.03] dark:bg-violet-500/[0.05]">
          <CardHeader className="text-center py-10">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <CalendarDays className="h-7 w-7" />
            </div>
            <CardTitle>Schedule coming soon</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Your school hasn&apos;t published an active weekly timetable for your class yet. If you
              think this is a mistake, ask your form teacher or school office.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {data?.timetable && data.periods.length === 0 && (
        <Card className="border-amber-200/70 dark:border-amber-900/45 border-dashed bg-amber-500/[0.04] dark:bg-amber-500/[0.06]">
          <CardHeader className="text-center py-10">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <CalendarDays className="h-7 w-7" />
            </div>
            <CardTitle>No periods yet</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              A timetable exists for your class, but period slots haven&apos;t been added yet. Check
              back later or ask your school office.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {data?.timetable && data.periods.length > 0 && (
        <Card
          id="student-timetable-card"
          className="border-violet-200/50 shadow-sm dark:border-violet-900/50 print:shadow-none print:border-foreground/25"
        >
          <CardHeader className="space-y-1 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Weekly schedule</CardTitle>
                <CardDescription>
                  Same layout as your school timetable. Subject colors show core, elective, or
                  extracurricular; assembly, breaks, lunch, and closing use solid colored blocks. On
                  school days, today&apos;s column is highlighted and your current class period is
                  outlined when it matches the time shown.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadPdf}
                >
                  <FileDown className="size-4" aria-hidden />
                  Download PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownloadIcs}
                  disabled={!data.assignments.length}
                >
                  <CalendarDays className="size-4" aria-hidden />
                  Add to calendar
                </Button>
              </div>
            </div>
            {(data.academicYearLabel ||
              data.termLabel ||
              data.timetable.updatedAt) && (
              <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 pt-1">
                {data.academicYearLabel ? (
                  <span>Year: {data.academicYearLabel}</span>
                ) : null}
                {data.termLabel ? <span>Term: {data.termLabel}</span> : null}
                {data.timetable.updatedAt ? (
                  <span>Last updated {formatUpdatedAt(data.timetable.updatedAt)}</span>
                ) : null}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden md:block">
              <StudentTimetableLegend />
            </div>
            <Collapsible
              defaultOpen={false}
              className="group/collapsible md:hidden print:hidden"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-left text-sm font-medium outline-none hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring">
                <span>Color legend</span>
                <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden pt-3">
                <StudentTimetableLegend />
              </CollapsibleContent>
            </Collapsible>
            <StudentTimetableGrid periods={data.periods} assignments={data.assignments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
