"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import {
  StudentTimetableGrid,
  StudentTimetableLegend,
} from "@/components/student/student-timetable-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarDays } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentTimetablePage(): React.ReactNode {
  const { student } = useStudentAuth();

  const data = useQuery(
    api.students.getTimetableForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students"> } : "skip",
  );

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <StudentPageHeader icon={Clock} title="Timetable" subtitle={student.className} />

      {data === undefined && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading your week…</p>
      )}

      {data && !data.timetable && (
        <Card className="border-violet-200/60 dark:border-violet-800/40 border-dashed bg-violet-500/[0.03] dark:bg-violet-500/[0.05]">
          <CardHeader className="text-center py-10">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <CalendarDays className="h-7 w-7" />
            </div>
            <CardTitle>Schedule coming soon</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Your school hasn&apos;t published an active weekly timetable for your class yet.
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
        <Card className="border-violet-200/50 shadow-sm dark:border-violet-900/50">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-lg">Weekly schedule</CardTitle>
            <CardDescription>
              Same layout as your school timetable. Subject colors show core, elective, or
              extracurricular; assembly, breaks, lunch, and closing use solid colored blocks. On
              school days, today&apos;s column is highlighted and your current class period is
              outlined when it matches the time shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StudentTimetableLegend />
            <StudentTimetableGrid periods={data.periods} assignments={data.assignments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
