"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { convertTo12Hour } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

const DAYS: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export type StudentTimetableAssignment = Doc<"timetableAssignments"> & {
  subjectCategory?: "core" | "elective" | "extracurricular";
  subjectColor?: string;
};

function parseTimeKey(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function dateToSchoolDay(d: Date): Day | null {
  switch (d.getDay()) {
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    default:
      return null;
  }
}

function isClassPeriodActiveNow(period: Doc<"periods">, nowMinutes: number): boolean {
  if (period.periodType !== "class") return false;
  const s = parseTimeKey(period.startTime);
  const e = parseTimeKey(period.endTime);
  return nowMinutes >= s && nowMinutes < e;
}

function periodRowsTemplate(periods: Doc<"periods">[]): Doc<"periods">[] {
  for (const day of DAYS) {
    const row = periods
      .filter((p) => p.day === day)
      .sort((a, b) => parseTimeKey(a.startTime) - parseTimeKey(b.startTime));
    if (row.length > 0) return row;
  }
  return [];
}

function groupPeriodsByDay(periods: Doc<"periods">[]): Record<Day, Doc<"periods">[]> {
  const out: Record<Day, Doc<"periods">[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
  for (const p of periods) {
    if (p.day in out) {
      out[p.day as Day].push(p);
    }
  }
  for (const d of DAYS) {
    out[d].sort((a, b) => parseTimeKey(a.startTime) - parseTimeKey(b.startTime));
  }
  return out;
}

type BreakKind = "assembly" | "lunch" | "closing" | "break";

function breakKindFromPeriodName(name: string): BreakKind {
  const n = name.toLowerCase();
  if (n.includes("assembly")) return "assembly";
  if (n.includes("lunch")) return "lunch";
  if (n.includes("closing")) return "closing";
  return "break";
}

/** Bold fill for assembly / break / lunch / closing cells (full cell, no dashes). */
function breakSlotPresentation(kind: BreakKind): { cell: string; label: string } {
  switch (kind) {
    case "assembly":
      return {
        cell: "bg-emerald-600 text-white shadow-inner dark:bg-emerald-700",
        label: "Assembly",
      };
    case "lunch":
      return {
        cell: "bg-orange-500 text-white shadow-inner dark:bg-orange-600",
        label: "Lunch",
      };
    case "closing":
      return {
        cell: "bg-slate-600 text-white shadow-inner dark:bg-slate-700",
        label: "Closing",
      };
    case "break":
      return {
        cell: "bg-sky-600 text-white shadow-inner dark:bg-sky-700",
        label: "Break",
      };
  }
}

function categoryCellClasses(
  category: StudentTimetableAssignment["subjectCategory"],
): string {
  switch (category) {
    case "core":
      return "border border-blue-200/90 bg-blue-500/[0.11] dark:border-blue-800/60 dark:bg-blue-500/[0.14]";
    case "elective":
      return "border border-amber-200/90 bg-amber-500/[0.11] dark:border-amber-800/60 dark:bg-amber-500/[0.14]";
    case "extracurricular":
      return "border border-violet-200/90 bg-violet-500/[0.11] dark:border-violet-800/60 dark:bg-violet-500/[0.14]";
    default:
      return "border border-border/70 bg-muted/25 dark:bg-muted/20";
  }
}

function buildNowNextSummary(
  todayDay: Day | null,
  periodsByDay: Record<Day, Doc<"periods">[]>,
  nowMinutes: number,
  assignmentByPeriodId: Map<Id<"periods">, StudentTimetableAssignment>,
): { line: string } {
  if (!todayDay) {
    return {
      line: "No classes scheduled today (weekend).",
    };
  }
  const dayPeriods = periodsByDay[todayDay];
  let current: Doc<"periods"> | null = null;
  for (const p of dayPeriods) {
    const s = parseTimeKey(p.startTime);
    const e = parseTimeKey(p.endTime);
    if (nowMinutes >= s && nowMinutes < e) {
      current = p;
      break;
    }
  }

  const threshold =
    current?.periodType === "class"
      ? parseTimeKey(current.endTime)
      : nowMinutes;

  let nextClass: Doc<"periods"> | null = null;
  for (const p of dayPeriods) {
    if (p.periodType !== "class") continue;
    if (parseTimeKey(p.startTime) >= threshold) {
      if (current && p._id === current._id) continue;
      nextClass = p;
      break;
    }
  }

  const formatSlot = (p: Doc<"periods">): string => {
    if (p.periodType === "break") {
      const kind = breakKindFromPeriodName(p.periodName);
      const label = breakSlotPresentation(kind).label;
      return `${label} (${convertTo12Hour(p.startTime)}–${convertTo12Hour(p.endTime)})`;
    }
    const a = assignmentByPeriodId.get(p._id);
    if (a) {
      return `${a.subjectName} (${convertTo12Hour(p.startTime)}–${convertTo12Hour(p.endTime)})`;
    }
    return `${p.periodName} (${convertTo12Hour(p.startTime)}–${convertTo12Hour(p.endTime)})`;
  };

  const currentPart = current
    ? `Now: ${formatSlot(current)}`
    : "Now: Between periods or outside school hours.";

  let nextPart: string;
  if (nextClass) {
    const a = assignmentByPeriodId.get(nextClass._id);
    const nm = a?.subjectName ?? nextClass.periodName;
    nextPart = `Next class: ${nm} at ${convertTo12Hour(nextClass.startTime)}`;
  } else {
    nextPart = "No further classes today.";
  }

  return {
    line: `${currentPart} · ${nextPart}`,
  };
}

export function StudentTimetableLegend(): React.JSX.Element {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-foreground">Subject type</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm border border-blue-300 bg-blue-500/20 dark:border-blue-700 dark:bg-blue-500/25" />
          Core
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm border border-amber-300 bg-amber-500/20 dark:border-amber-700 dark:bg-amber-500/25" />
          Elective
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm border border-violet-300 bg-violet-500/20 dark:border-violet-700 dark:bg-violet-500/25" />
          Extracurricular
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-foreground">Non-class periods</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-emerald-600 dark:bg-emerald-700" />
          Assembly
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-sky-600 dark:bg-sky-700" />
          Break
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-orange-500 dark:bg-orange-600" />
          Lunch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-sm bg-slate-600 dark:bg-slate-700" />
          Closing
        </span>
      </div>
    </div>
  );
}

export function StudentTimetableGrid({
  periods,
  assignments,
}: {
  periods: Doc<"periods">[];
  assignments: StudentTimetableAssignment[];
}): React.JSX.Element {
  const [nowTick, setNowTick] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Day>(() => {
    const t = dateToSchoolDay(new Date());
    return t ?? "monday";
  });

  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { todayDay, nowMinutes } = useMemo(() => {
    const n = new Date();
    return {
      todayDay: dateToSchoolDay(n),
      nowMinutes: n.getHours() * 60 + n.getMinutes(),
    };
  }, [nowTick]);

  const periodsByDay = useMemo(() => groupPeriodsByDay(periods), [periods]);
  const rowTemplate = useMemo(() => periodRowsTemplate(periods), [periods]);

  const assignmentByPeriodId = useMemo(() => {
    const m = new Map<Id<"periods">, StudentTimetableAssignment>();
    for (const a of assignments) {
      m.set(a.periodId, a);
    }
    return m;
  }, [assignments]);

  const nowNext = useMemo(
    () =>
      buildNowNextSummary(
        todayDay,
        periodsByDay,
        nowMinutes,
        assignmentByPeriodId,
      ),
    [todayDay, periodsByDay, nowMinutes, assignmentByPeriodId],
  );

  const getPeriodForDayAndName = (day: Day, periodName: string): Doc<"periods"> | undefined =>
    periodsByDay[day].find((p) => p.periodName === periodName);

  if (rowTemplate.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No period rows found for this timetable.
      </p>
    );
  }

  return (
    <div className="space-y-3 print:max-w-none">
      <div
        className="rounded-lg border border-blue-200/70 bg-blue-500/[0.06] px-3 py-2 text-sm text-foreground dark:border-blue-900/50 dark:bg-blue-500/10 print:border print:border-foreground/20 print:bg-white"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {nowNext.line}
      </div>

      <div className="flex flex-wrap gap-1.5 md:hidden print:hidden">
        {DAYS.map((day) => {
          const isToday = todayDay !== null && day === todayDay;
          return (
            <Button
              key={day}
              type="button"
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              className="h-8 capitalize"
              onClick={() => setSelectedDay(day)}
            >
              {day.slice(0, 3)}
              {isToday ? (
                <span className="ml-1 text-[10px] font-normal opacity-90">• today</span>
              ) : null}
            </Button>
          );
        })}
      </div>

      <div className="rounded-lg border border-violet-200/60 bg-card shadow-sm dark:border-violet-900/50 overflow-x-auto print:rounded-md print:shadow-none print:border-foreground/20 print:[&_[data-slot=table-container]]:overflow-visible">
        <Table
          className="print:text-foreground"
          aria-label="Weekly class timetable"
        >
          <TableHeader>
            <TableRow className="border-violet-200/50 hover:bg-transparent dark:border-violet-900/40">
              <TableHead
                scope="col"
                className="min-w-[140px] font-semibold text-foreground print:bg-muted/30"
              >
                Period / time
              </TableHead>
              {DAYS.map((day) => {
                const isTodayCol = todayDay !== null && day === todayDay;
                return (
                  <TableHead
                    key={day}
                    scope="col"
                    className={cn(
                      "min-w-[120px] text-center font-semibold capitalize text-foreground print:table-cell",
                      day !== selectedDay && "hidden md:table-cell",
                      isTodayCol &&
                        "bg-blue-500/12 text-blue-900 dark:bg-blue-500/18 dark:text-blue-100",
                    )}
                  >
                    <span className="block">{day.slice(0, 3)}</span>
                    {isTodayCol ? (
                      <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                        Today
                      </span>
                    ) : null}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowTemplate.map((templatePeriod) => {
              const isBreak = templatePeriod.periodType === "break";
              const breakStyle = isBreak
                ? breakSlotPresentation(breakKindFromPeriodName(templatePeriod.periodName))
                : null;
              const todayPeriod =
                todayDay !== null
                  ? getPeriodForDayAndName(todayDay, templatePeriod.periodName)
                  : undefined;
              const isCurrentClassSlot =
                todayPeriod !== undefined &&
                isClassPeriodActiveNow(todayPeriod, nowMinutes);

              return (
                <TableRow
                  key={templatePeriod.periodName}
                  className={cn(
                    "border-border/70",
                    isBreak ? "hover:bg-transparent" : "hover:bg-muted/30",
                    !isBreak && isCurrentClassSlot && "bg-blue-500/[0.06] dark:bg-blue-500/10",
                  )}
                >
                  <TableHead
                    scope="row"
                    className={cn(
                      "h-auto p-0 align-stretch print:bg-muted/20",
                      isBreak && breakStyle ? breakStyle.cell : "align-top font-medium",
                      !isBreak && isCurrentClassSlot && "bg-blue-500/10 dark:bg-blue-500/15",
                    )}
                  >
                    {isBreak && breakStyle ? (
                      <div className="flex min-h-[4rem] flex-col items-center justify-center gap-1 px-2 py-3 text-center">
                        <span className="text-sm font-extrabold uppercase tracking-wide">
                          {breakStyle.label}
                        </span>
                        <span className="text-[11px] font-semibold text-white/90">
                          {convertTo12Hour(templatePeriod.startTime)} –{" "}
                          {convertTo12Hour(templatePeriod.endTime)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 py-2 pl-1 pr-2">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {templatePeriod.periodName}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {convertTo12Hour(templatePeriod.startTime)} –{" "}
                          {convertTo12Hour(templatePeriod.endTime)}
                        </span>
                      </div>
                    )}
                  </TableHead>
                  {DAYS.map((day) => {
                    const period = getPeriodForDayAndName(day, templatePeriod.periodName);
                    if (!period) {
                      if (isBreak && breakStyle) {
                        return (
                          <TableCell
                            key={day}
                            className={cn(
                              "p-0 align-stretch border-l border-white/10 print:table-cell",
                              day !== selectedDay && "hidden md:table-cell",
                            )}
                          >
                            <div
                              className={cn(
                                "flex min-h-[4rem] w-full items-center justify-center px-2 py-3",
                                breakStyle.cell,
                              )}
                            >
                              <span className="text-center text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-xs">
                                {breakStyle.label}
                              </span>
                            </div>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell
                          key={day}
                          className={cn(
                            "text-center text-muted-foreground print:table-cell",
                            day !== selectedDay && "hidden md:table-cell",
                          )}
                        >
                          —
                        </TableCell>
                      );
                    }
                    if ((isBreak || period.periodType === "break") && breakStyle) {
                      return (
                        <TableCell
                          key={day}
                          className={cn(
                            "p-0 align-stretch border-l border-white/15 print:table-cell",
                            day !== selectedDay && "hidden md:table-cell",
                          )}
                        >
                          <div
                            className={cn(
                              "flex min-h-[4rem] w-full items-center justify-center px-2 py-3",
                              breakStyle.cell,
                            )}
                          >
                            <span className="text-center text-[11px] font-extrabold uppercase leading-tight tracking-wide sm:text-xs">
                              {breakStyle.label}
                            </span>
                          </div>
                        </TableCell>
                      );
                    }
                    const assign = assignmentByPeriodId.get(period._id);
                    const highlightNow =
                      todayDay !== null &&
                      day === todayDay &&
                      isCurrentClassSlot &&
                      period.periodType === "class";
                    return (
                      <TableCell
                        key={day}
                        className={cn(
                          "p-1.5 align-top print:table-cell",
                          day !== selectedDay && "hidden md:table-cell",
                          todayDay !== null && day === todayDay && "bg-blue-500/[0.07] dark:bg-blue-500/12",
                        )}
                      >
                        {assign ? (
                          <div
                            className={cn(
                              "flex min-h-[4rem] flex-col gap-1 rounded-md px-2 py-2 text-left",
                              categoryCellClasses(assign.subjectCategory),
                              highlightNow &&
                                "ring-2 ring-blue-500 ring-offset-2 ring-offset-background dark:ring-blue-400",
                            )}
                            style={
                              assign.subjectColor
                                ? {
                                    borderLeftWidth: 3,
                                    borderLeftColor: assign.subjectColor,
                                  }
                                : undefined
                            }
                          >
                            <p className="text-sm font-semibold leading-tight text-foreground">
                              {assign.subjectName}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug print:text-foreground/80">
                              <span className="sr-only">Teacher: </span>
                              {assign.teacherName}
                            </p>
                            {assign.subjectCategory ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-auto w-fit text-[10px] font-normal capitalize",
                                  assign.subjectCategory === "core" &&
                                    "border-blue-300/80 text-blue-800 dark:border-blue-700 dark:text-blue-200",
                                  assign.subjectCategory === "elective" &&
                                    "border-amber-300/80 text-amber-900 dark:border-amber-700 dark:text-amber-200",
                                  assign.subjectCategory === "extracurricular" &&
                                    "border-violet-300/80 text-violet-900 dark:border-violet-700 dark:text-violet-200",
                                )}
                              >
                                {assign.subjectCategory}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "flex min-h-[3.5rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/10 px-2 text-xs text-muted-foreground",
                              highlightNow &&
                                "ring-2 ring-blue-500 ring-offset-2 ring-offset-background dark:ring-blue-400",
                            )}
                          >
                            Free
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
