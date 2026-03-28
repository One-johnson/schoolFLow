"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  homeworkProgressIndicatorCn,
  homeworkProgressLabel,
  homeworkProgressValue,
} from "@/lib/student-homework-progress";
import {
  BookOpen,
  Library,
  Paperclip,
  ChevronRight,
  ListFilter,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

type HomeworkFilter = "all" | "todo" | "submitted" | "marked";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function StudentHomeworkPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<HomeworkFilter>("all");

  const summaries = useQuery(
    api.students.getHomeworkSummariesForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students">, limit: 100 } : "skip",
  );

  const filtered = useMemo(() => {
    if (!summaries) return [];
    switch (filter) {
      case "todo":
        return summaries.filter((s) => s.submissionStatus === "none");
      case "submitted":
        return summaries.filter((s) => s.submissionStatus === "submitted");
      case "marked":
        return summaries.filter((s) => s.submissionStatus === "marked");
      default:
        return summaries;
    }
  }, [summaries, filter]);

  const stats = useMemo(() => {
    if (!summaries?.length) {
      return {
        total: 0,
        done: 0,
        overdue: 0,
        dueThisWeek: 0,
        pct: 0,
      };
    }
    const now = new Date();
    const weekEnd = addDays(startOfDay(now), 7);
    let overdue = 0;
    let dueThisWeek = 0;
    for (const s of summaries) {
      const due = new Date(s.dueDate);
      if (s.isOverdue) overdue += 1;
      if (!s.isOverdue && due >= startOfDay(now) && due <= weekEnd) dueThisWeek += 1;
    }
    const done = summaries.filter((s) => s.submissionStatus !== "none").length;
    return {
      total: summaries.length,
      done,
      overdue,
      dueThisWeek,
      pct: Math.round((done / summaries.length) * 100),
    };
  }, [summaries]);

  if (!student) {
    return null;
  }

  const filterButtons: { id: HomeworkFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "todo", label: "To do" },
    { id: "submitted", label: "Turned in" },
    { id: "marked", label: "Marked" },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <StudentPageHeader
        icon={BookOpen}
        title="Homework"
        subtitle={`${student.className} · Track progress, filter by status, open any card for details and submission`}
      />

      {summaries === undefined && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-xl bg-muted/70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted/60" />
            ))}
          </div>
        </div>
      )}

      {summaries && summaries.length === 0 && (
        <Card className="border-violet-200/60 dark:border-violet-800/40 border-dashed bg-violet-500/[0.03] dark:bg-violet-500/[0.05]">
          <CardHeader className="text-center py-10">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Library className="h-7 w-7" />
            </div>
            <CardTitle>All clear</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              When teachers post homework for your class, it&apos;ll land here. Check back after class.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {summaries && summaries.length > 0 && (
        <>
          <Card className="border-violet-200/50 shadow-sm dark:border-violet-800/40">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Class overview
                  </CardTitle>
                  <CardDescription>
                    How you&apos;re doing across all active assignments
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-3 text-sm lg:justify-end">
                  <div className="flex items-center gap-2 rounded-lg border border-violet-200/60 bg-violet-500/[0.04] px-3 py-2 dark:border-violet-800/50">
                    <span className="text-muted-foreground">Turned in</span>
                    <span className="font-semibold tabular-nums text-violet-900 dark:text-violet-100">
                      {stats.done}/{stats.total}
                    </span>
                  </div>
                  {stats.overdue > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{stats.overdue} overdue</span>
                    </div>
                  ) : null}
                  {stats.dueThisWeek > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium text-foreground">{stats.dueThisWeek}</span>{" "}
                        <span className="text-muted-foreground">due within 7 days</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Overall progress</span>
                  <span className="tabular-nums text-foreground">{stats.pct}%</span>
                </div>
                <Progress
                  value={stats.pct}
                  className="h-2.5 bg-violet-500/15 [&>[data-slot=progress-indicator]]:bg-violet-600 dark:[&>[data-slot=progress-indicator]]:bg-violet-400"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 border-t border-violet-200/40 pt-4 dark:border-violet-900/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ListFilter className="h-3.5 w-3.5" />
                  Show
                </span>
                <div className="flex flex-wrap gap-2">
                  {filterButtons.map((b) => (
                    <Button
                      key={b.id}
                      type="button"
                      size="sm"
                      variant={filter === b.id ? "default" : "outline"}
                      className={cn(
                        "h-8 rounded-full px-3 text-xs transition-transform active:scale-[0.98]",
                        filter === b.id &&
                          "bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-600 dark:hover:bg-violet-600/90",
                      )}
                      onClick={() => setFilter(b.id)}
                    >
                      {b.label}
                      {b.id !== "all" && summaries ? (
                        <span className="ml-1.5 tabular-nums opacity-80">
                          (
                          {b.id === "todo"
                            ? summaries.filter((s) => s.submissionStatus === "none").length
                            : b.id === "submitted"
                              ? summaries.filter((s) => s.submissionStatus === "submitted").length
                              : summaries.filter((s) => s.submissionStatus === "marked").length}
                          )
                        </span>
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <Card className="border-dashed border-violet-200/60 dark:border-violet-800/40">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No assignments match this filter. Try <strong className="text-foreground">All</strong> or another
                tab.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((h, idx) => (
                <motion.div
                  key={h._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  transition={{
                    delay: reduceMotion ? 0 : Math.min(0.04 * idx, 0.4),
                    duration: reduceMotion ? 0 : 0.28,
                  }}
                >
                  <Link href={`/student/homework/${h._id}`} className="group block h-full">
                    <Card className="h-full border-violet-200/50 dark:border-violet-800/40 shadow-sm shadow-violet-500/5 overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-violet-500/15 hover:border-violet-400/50 dark:hover:border-violet-600/40">
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-snug line-clamp-2 pr-1 group-hover:text-violet-800 dark:group-hover:text-violet-200 transition-colors">
                            {h.title}
                          </CardTitle>
                          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-50 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
                        </div>
                        <CardDescription className="space-y-1 text-xs sm:text-sm">
                          {h.subjectName ? (
                            <span className="font-medium text-violet-600/90 dark:text-violet-400 block">
                              {h.subjectName}
                            </span>
                          ) : null}
                          <span className="text-muted-foreground block">
                            Due{" "}
                            {new Date(h.dueDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {h.teacherName ? (
                            <span className="text-muted-foreground block truncate" title={h.teacherName}>
                              {h.teacherName}
                            </span>
                          ) : null}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {h.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              {h.attachmentCount} file{h.attachmentCount === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/80">No teacher files</span>
                          )}
                          {h.isOverdue ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Overdue
                            </Badge>
                          ) : null}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              {homeworkProgressLabel(h.submissionStatus)}
                              {h.submissionStatus === "marked" && h.grade ? (
                                <span className="ml-1 font-medium text-emerald-700 dark:text-emerald-400">
                                  ({h.grade})
                                </span>
                              ) : null}
                            </span>
                            <span className="tabular-nums">
                              {homeworkProgressValue(h.submissionStatus)}%
                            </span>
                          </div>
                          <Progress
                            value={homeworkProgressValue(h.submissionStatus)}
                            className={cn("h-2 bg-muted/80", homeworkProgressIndicatorCn(h.submissionStatus))}
                          />
                        </div>
                        <p className="text-xs font-medium text-violet-700/90 dark:text-violet-300/90">
                          Open for details & submit →
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
