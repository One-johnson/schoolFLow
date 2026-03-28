"use client";

import { useMemo } from "react";
import { eachDayOfInterval, parseISO, startOfDay, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type HomeworkLike = { dueDate: string };
type EventLike = { startDate: string; endDate: string };

function dateKey(d: Date): number {
  return startOfDay(d).getTime();
}

function buildHomeworkKeys(items: HomeworkLike[]): Set<number> {
  const set = new Set<number>();
  for (const h of items) {
    const raw = h.dueDate.includes("T") ? h.dueDate : `${h.dueDate}T12:00:00`;
    const d = startOfDay(parseISO(raw));
    if (isValid(d)) set.add(d.getTime());
  }
  return set;
}

function buildEventKeys(items: EventLike[]): Set<number> {
  const set = new Set<number>();
  for (const e of items) {
    try {
      const start = parseISO(e.startDate.slice(0, 10));
      const end = parseISO(e.endDate.slice(0, 10));
      if (!isValid(start) || !isValid(end)) continue;
      const days = eachDayOfInterval({ start, end });
      for (const d of days) {
        set.add(startOfDay(d).getTime());
      }
    } catch {
      /* skip malformed */
    }
  }
  return set;
}

interface StudentDashboardCalendarProps {
  homework: HomeworkLike[];
  events: EventLike[];
  className?: string;
}

export function StudentDashboardCalendar({
  homework,
  events,
  className,
}: StudentDashboardCalendarProps): React.JSX.Element {
  const homeworkKeys = useMemo(() => buildHomeworkKeys(homework), [homework]);
  const eventKeys = useMemo(() => buildEventKeys(events), [events]);

  return (
    <div className={cn("space-y-3", className)}>
      <Calendar
        mode="single"
        className="rounded-xl border border-blue-200/80 bg-card p-2 shadow-sm dark:border-blue-900/50 [--cell-size:2.25rem]"
        modifiers={{
          homeworkDue: (date: Date) => homeworkKeys.has(dateKey(date)),
          schoolEvent: (date: Date) => eventKeys.has(dateKey(date)),
        }}
        modifiersClassNames={{
          homeworkDue:
            "relative font-medium after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-600 dark:after:bg-blue-400",
          schoolEvent:
            "bg-amber-500/15 text-amber-950 dark:bg-amber-500/20 dark:text-amber-100",
        }}
      />
      <div className="flex flex-wrap gap-4 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          Homework due
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          School event
        </span>
      </div>
    </div>
  );
}
