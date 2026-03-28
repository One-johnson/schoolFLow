"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarDays } from "lucide-react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

export default function StudentTimetablePage(): React.ReactNode {
  const { student } = useStudentAuth();

  const data = useQuery(
    api.students.getTimetableForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students"> } : "skip",
  );

  const byDay = useMemo(() => {
    if (!data?.timetable || !data.periods?.length) return null;
    const map = new Map<string, typeof data.periods>();
    for (const day of DAYS) {
      map.set(
        day,
        data.periods.filter((p) => p.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      );
    }
    return map;
  }, [data]);

  const assignmentByPeriodDay = useMemo(() => {
    const m = new Map<string, Doc<"timetableAssignments">>();
    if (!data?.assignments) return m;
    for (const a of data.assignments) {
      m.set(`${a.periodId}_${a.day}`, a);
    }
    return m;
  }, [data]);

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
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

      {data?.timetable && byDay && (
        <div className="space-y-6">
          {DAYS.map((day) => {
            const periods = byDay.get(day) ?? [];
            if (periods.length === 0) return null;
            return (
              <Card
                key={day}
                className="border-violet-200/50 dark:border-violet-800/40 shadow-sm shadow-violet-500/5 overflow-hidden"
              >
                <CardHeader>
                  <CardTitle className="capitalize text-lg">{day}</CardTitle>
                  <CardDescription>{data.timetable?.className}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {periods.map((p) => {
                    const assign = assignmentByPeriodDay.get(`${p._id}_${day}`);
                    return (
                      <div
                        key={p._id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-border/60 pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{p.periodName}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.startTime} – {p.endTime}
                            {p.periodType === "break" && " · Break"}
                          </p>
                        </div>
                        {assign && p.periodType === "class" && (
                          <div className="text-sm text-right">
                            <p className="font-medium">{assign.subjectName}</p>
                            <p className="text-muted-foreground">{assign.teacherName}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
