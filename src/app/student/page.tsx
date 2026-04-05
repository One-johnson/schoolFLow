"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentDashboardCalendar } from "@/components/student/student-dashboard-calendar";
import { StudentHeroCarousel } from "@/components/student/student-hero-carousel";
import { StudentIllustration } from "@/components/student/student-illustration";
import { cn } from "@/lib/utils";
import {
  homeworkProgressIndicatorCn,
  homeworkProgressLabel,
  homeworkProgressValue,
} from "@/lib/student-homework-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Clock,
  User,
  ChevronRight,
  Megaphone,
  CalendarDays,
  BarChart3,
  Sparkles,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;

function greetingForHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

type TimetableBlock = {
  dayLabel: string;
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName?: string;
  teacherName?: string;
};

function buildUpcomingClasses(
  timetableData: {
    periods: Array<{
      _id: Id<"periods">;
      day: string;
      periodName: string;
      startTime: string;
      endTime: string;
      periodType: string;
    }>;
    assignments: Array<{
      periodId: Id<"periods">;
      day: string;
      subjectName?: string;
      teacherName?: string;
    }>;
  } | null,
  now: Date = new Date(),
): TimetableBlock[] {
  if (!timetableData?.periods?.length) return [];

  const assignMap = new Map<string, (typeof timetableData.assignments)[0]>();
  for (const a of timetableData.assignments) {
    assignMap.set(`${a.periodId}_${a.day}`, a);
  }

  const dow = now.getDay();
  let targetDay: (typeof WEEKDAYS)[number];
  let dayLabel: string;

  if (dow >= 1 && dow <= 5) {
    targetDay = WEEKDAYS[dow - 1];
    dayLabel = "Today";
  } else {
    targetDay = "monday";
    dayLabel = "Monday";
  }

  const periods = timetableData.periods
    .filter((p) => p.day === targetDay && p.periodType === "class")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nowM = now.getHours() * 60 + now.getMinutes();
  const filtered =
    dayLabel === "Today"
      ? periods.filter((p) => parseTimeToMinutes(p.startTime) >= nowM)
      : periods;

  return filtered.slice(0, 6).map((p) => {
    const a = assignMap.get(`${p._id}_${targetDay}`);
    return {
      dayLabel,
      periodName: p.periodName,
      startTime: p.startTime,
      endTime: p.endTime,
      subjectName: a?.subjectName,
      teacherName: a?.teacherName,
    };
  });
}

type ActivityItem = { at: string; label: string; href: string };

export default function StudentDashboardPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const reduceMotion = useReducedMotion();

  const sid = student?.id ? (student.id as Id<"students">) : undefined;

  const homeworkSummaries = useQuery(
    api.students.getHomeworkSummariesForStudentPortal,
    sid ? { studentId: sid, limit: 50 } : "skip",
  );

  const timetableData = useQuery(
    api.students.getTimetableForStudentPortal,
    sid ? { studentId: sid } : "skip",
  );

  const announcements = useQuery(
    api.students.getAnnouncementsForStudentPortal,
    sid ? { studentId: sid, limit: 12 } : "skip",
  );

  const portalEvents = useQuery(
    api.students.getEventsForStudentPortal,
    sid ? { studentId: sid, limit: 40 } : "skip",
  );

  const publishedMarks = useQuery(
    api.students.getPublishedMarksForStudentPortal,
    sid ? { studentId: sid, limit: 20 } : "skip",
  );

  const upcomingClasses = useMemo(() => {
    if (!timetableData?.timetable) return [];
    return buildUpcomingClasses(timetableData);
  }, [timetableData]);

  const recentActivities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];
    if (homeworkSummaries) {
      for (const h of [...homeworkSummaries].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ).slice(0, 4)) {
        items.push({
          at: h.createdAt,
          label: `Homework: ${h.title}`,
          href: `/student/homework/${h._id}`,
        });
      }
    }
    if (publishedMarks) {
      for (const m of publishedMarks.slice(0, 4)) {
        items.push({
          at: m.updatedAt,
          label: m.isAbsent
            ? `Marked absent · ${m.subjectName}`
            : `Result · ${m.subjectName}: ${m.grade}`,
          href: "/student/results",
        });
      }
    }
    if (announcements) {
      for (const a of announcements.slice(0, 3)) {
        items.push({
          at: a.publishedAt ?? a.createdAt,
          label: `Announcement: ${a.title}`,
          href: `/student#student-announcement-${a._id}`,
        });
      }
    }
    items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
    return items.slice(0, 10);
  }, [homeworkSummaries, publishedMarks, announcements]);

  if (!student) {
    return null;
  }

  const upcomingHw = homeworkSummaries?.filter(
    (h) => new Date(h.dueDate).getTime() >= new Date().setHours(0, 0, 0, 0),
  );
  const hasTimetable = Boolean(timetableData?.timetable);
  const greet = greetingForHour();

  const calendarHomework = homeworkSummaries ?? [];
  const hwClassDone =
    homeworkSummaries?.filter((h) => h.submissionStatus !== "none").length ?? 0;
  const hwClassTotal = homeworkSummaries?.length ?? 0;
  const hwClassProgressPct =
    hwClassTotal > 0 ? Math.round((hwClassDone / hwClassTotal) * 100) : 0;
  const calendarEvents =
    portalEvents?.map((e) => ({ startDate: e.startDate, endDate: e.endDate })) ?? [];

  const stats = [
    {
      title: "Homework due",
      value: upcomingHw === undefined ? "—" : String(upcomingHw.length),
      sub: "Open tasks",
      href: "/student/homework",
      icon: BookOpen,
      largeValue: true,
      cardClass:
        "border-violet-600 bg-violet-600 text-white hover:border-violet-500 hover:bg-violet-600 dark:border-violet-700 dark:bg-violet-950/75 dark:text-white dark:hover:border-violet-500",
      labelClass: "text-white dark:text-white",
      chevronClass:
        "text-white group-hover:text-white dark:text-white dark:group-hover:text-white",
      valueLargeClass: "text-white dark:text-white",
    },
    {
      title: "Timetable",
      value: timetableData === undefined ? "…" : hasTimetable ? "Live" : "Soon",
      sub: hasTimetable ? "Your week" : "Not published yet",
      href: "/student/timetable",
      icon: Clock,
      largeValue: false,
      cardClass:
        "border-sky-600 bg-sky-600 text-white hover:border-sky-500 hover:bg-sky-600 dark:border-sky-700 dark:bg-sky-950/72 dark:text-white dark:hover:border-sky-500",
      labelClass: "text-white dark:text-white",
      chevronClass:
        "text-white group-hover:text-white dark:text-white dark:group-hover:text-white",
      valueLargeClass: "",
    },
    {
      title: "Results",
      value:
        publishedMarks === undefined ? "…" : publishedMarks.length ? "View" : "—",
      sub:
        publishedMarks && publishedMarks.length
          ? `${publishedMarks.length} published`
          : "No marks yet",
      href: "/student/results",
      icon: BarChart3,
      largeValue: false,
      cardClass:
        "border-amber-600 bg-amber-600 text-white hover:border-amber-500 hover:bg-amber-600 dark:border-amber-800 dark:bg-amber-950/72 dark:text-white dark:hover:border-amber-600",
      labelClass: "text-white dark:text-white",
      chevronClass:
        "text-white group-hover:text-white dark:text-white dark:group-hover:text-white",
      valueLargeClass: "",
    },
    {
      title: "My account",
      value: "Open",
      sub: "Password & details",
      href: "/student/profile",
      icon: User,
      largeValue: false,
      cardClass:
        "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-500 hover:bg-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-white dark:hover:border-emerald-600",
      labelClass: "text-white dark:text-white",
      chevronClass:
        "text-white group-hover:text-white dark:text-white dark:group-hover:text-white",
      valueLargeClass: "",
    },
  ] as const;

  return (
    <div className="w-full max-w-7xl space-y-8 py-6 sm:py-8 md:py-10">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <StudentHeroCarousel
          student={student}
          greet={greet}
          upcomingHwCount={upcomingHw === undefined ? undefined : upcomingHw.length}
          homeworkLoaded={homeworkSummaries !== undefined}
          hasTimetable={hasTimetable}
          timetableLoaded={timetableData !== undefined}
          upcomingClasses={upcomingClasses}
          portalEvents={portalEvents}
          announcements={announcements}
        />
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.35,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Link href="/student/study-help" className="group block">
          <Card className="border-violet-600 bg-violet-600 text-white shadow-sm transition-all hover:border-violet-500 hover:shadow-md dark:border-violet-800 dark:bg-violet-950/50 dark:text-white dark:hover:border-violet-600">
            <CardHeader className="flex flex-row items-center gap-4 pb-2 sm:pb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-sm dark:bg-violet-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base text-white sm:text-lg dark:text-white">Study help</CardTitle>
                <CardDescription className="mt-0.5 text-white dark:text-white">
                  Get explanations and study tips—without answers for your graded homework.
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white transition group-hover:translate-x-0.5 dark:text-white dark:group-hover:text-white" />
            </CardHeader>
          </Card>
        </Link>
      </motion.div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1 space-y-8 lg:basis-[62%]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item, i) => (
              <motion.div
                key={item.href}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.35,
                  delay: reduceMotion ? 0 : 0.05 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link href={item.href} className="group block h-full">
                  <Card
                    className={`relative h-full border-2 shadow-sm transition-all duration-200 hover:shadow-md ${item.cardClass}`}
                  >
                    <ChevronRight
                      className={`absolute right-3 top-3 h-4 w-4 transition group-hover:translate-x-0.5 ${item.chevronClass}`}
                    />
                    <CardHeader className="pb-2 pr-10">
                      <div className={`mb-1 flex items-center gap-2 ${item.labelClass}`}>
                        <item.icon className="h-4 w-4" />
                        <CardDescription className={`font-medium ${item.labelClass}`}>
                          {item.title}
                        </CardDescription>
                      </div>
                      <CardTitle
                        className={
                          item.largeValue
                            ? `text-3xl tabular-nums ${item.valueLargeClass}`
                            : "text-lg text-white dark:text-white"
                        }
                      >
                        {item.value}
                      </CardTitle>
                      <p className="text-xs text-white dark:text-white">{item.sub}</p>
                      {item.href === "/student/homework" && homeworkSummaries !== undefined && hwClassTotal > 0 ? (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-white dark:text-white">
                            <span>Your homework</span>
                            <span className="tabular-nums text-white dark:text-white">
                              {hwClassDone}/{hwClassTotal}
                            </span>
                          </div>
                          <Progress
                            value={hwClassProgressPct}
                            className="h-1.5 bg-white/25 [&>[data-slot=progress-indicator]]:bg-white dark:bg-violet-950/50 dark:[&>[data-slot=progress-indicator]]:bg-violet-500"
                          />
                        </div>
                      ) : null}
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StudentDashboardCalendar homework={calendarHomework} events={calendarEvents} />
            <Card
              id="announcements-section"
              className="scroll-mt-24 border-2 border-violet-600 bg-violet-600 text-white shadow-sm dark:border-violet-700 dark:bg-violet-950/65 dark:text-white"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-white dark:text-white">
                  <Megaphone className="h-4 w-4 text-white dark:text-white" />
                  Announcements
                </CardTitle>
                <CardDescription className="text-white dark:text-white">
                  From your school and class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {announcements === undefined && (
                  <p className="text-sm text-white dark:text-white">Loading…</p>
                )}
                {announcements && announcements.length === 0 && (
                  <p className="text-sm text-white dark:text-white">
                    No announcements right now.
                  </p>
                )}
                {announcements && announcements.length > 0 && (
                  <ScrollArea className="h-[280px] pr-3">
                    <ul className="space-y-4">
                      {announcements.map((a) => (
                        <li
                          key={a._id}
                          id={`student-announcement-${a._id}`}
                          className="scroll-mt-28 rounded-lg border-b border-white/15 px-2 py-2 pb-3 transition-colors last:border-0 last:pb-0 hover:bg-white/10 dark:border-transparent dark:hover:bg-violet-500/15"
                        >
                          <p className="font-medium leading-snug text-white dark:text-white">{a.title}</p>
                          <p className="mt-1 line-clamp-3 text-sm text-white dark:text-white">
                            {a.content}
                          </p>
                          <p className="mt-1 text-xs text-white dark:text-white">
                            {a.targetType === "school"
                              ? "Whole school"
                              : a.targetName ?? "Class"}{" "}
                            ·{" "}
                            {new Date(a.publishedAt ?? a.createdAt).toLocaleDateString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {publishedMarks && publishedMarks.length > 0 && (
            <Card className="border-2 border-violet-600 bg-violet-600 text-white shadow-sm dark:border-violet-800 dark:bg-card dark:text-white">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base text-white dark:text-white">
                    <BarChart3 className="h-4 w-4 text-white dark:text-white" />
                    Recent results
                  </CardTitle>
                  <CardDescription className="text-white dark:text-white">
                    Latest published grades
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-white/50 text-white hover:bg-white/10 dark:border-violet-700 dark:text-white dark:hover:bg-transparent"
                  asChild
                >
                  <Link href="/student/results">
                    All results
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {publishedMarks.slice(0, 4).map((m) => (
                  <div
                    key={m._id}
                    className="rounded-lg border border-white/25 bg-white/12 px-3 py-2 text-sm text-white dark:border-violet-900/50 dark:bg-violet-950/25 dark:text-white"
                  >
                    <p className="font-medium dark:text-white">{m.subjectName}</p>
                    <p className="text-white dark:text-white">{m.examName}</p>
                    <p className="mt-1 font-semibold text-white dark:text-white">
                      {m.isAbsent ? "Absent" : `${m.grade} · ${Math.round(m.percentage)}%`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {homeworkSummaries !== undefined && homeworkSummaries.length === 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <BookOpen className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                  Upcoming homework
                </h2>
                <p className="text-sm text-muted-foreground">Nearest due dates for your class</p>
              </div>
              <Card className="border-2 border-dashed border-violet-300 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                  <StudentIllustration variant="emptyHomework" />
                  <div>
                    <p className="font-medium text-foreground">You&apos;re all caught up</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No homework is due right now. Check back later or open the homework page.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg border-violet-300 dark:border-violet-700" asChild>
                    <Link href="/student/homework">Homework page</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}

          {homeworkSummaries && homeworkSummaries.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <BookOpen className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                    Upcoming homework
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Nearest due dates · Progress shows your status on each task
                  </p>
                </div>
                {hwClassTotal > 0 ? (
                  <div className="flex items-center gap-3 rounded-lg border border-violet-500 bg-violet-600 px-3 py-2 text-white dark:border-violet-800 dark:bg-violet-950/35 dark:text-white">
                    <div className="min-w-[100px] space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-white dark:text-white">
                        Overall
                      </p>
                      <Progress
                        value={hwClassProgressPct}
                        className="h-2 bg-white/25 [&>[data-slot=progress-indicator]]:bg-white dark:bg-violet-900/50 dark:[&>[data-slot=progress-indicator]]:bg-violet-500"
                      />
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-white dark:text-white">
                      {hwClassDone}/{hwClassTotal}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {homeworkSummaries.slice(0, 8).map((h, idx) => (
                  <motion.div
                    key={h._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.04 * idx,
                      duration: reduceMotion ? 0 : 0.3,
                    }}
                  >
                    <Link href={`/student/homework/${h._id}`} className="group block h-full">
                      <Card className="relative h-full overflow-hidden border-2 border-violet-300 bg-card shadow-sm transition-all duration-200 hover:border-violet-500 hover:shadow-md dark:border-violet-800 dark:hover:border-violet-600">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-violet-600 dark:bg-violet-500" />
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-bold leading-snug text-foreground line-clamp-2 pr-6 group-hover:text-violet-800 dark:group-hover:text-violet-200">
                              {h.title}
                            </CardTitle>
                            <ChevronRight className="h-4 w-4 shrink-0 text-violet-700 transition group-hover:translate-x-0.5 dark:text-violet-300" />
                          </div>
                          {h.subjectName ? (
                            <CardDescription className="font-medium text-violet-800 dark:text-violet-200">
                              {h.subjectName}
                            </CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-violet-950 dark:text-violet-100">
                              Due {new Date(h.dueDate).toLocaleDateString()}
                            </p>
                            {h.isOverdue ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Overdue
                              </Badge>
                            ) : null}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{homeworkProgressLabel(h.submissionStatus)}</span>
                              <span className="tabular-nums">{homeworkProgressValue(h.submissionStatus)}%</span>
                            </div>
                            <Progress
                              value={homeworkProgressValue(h.submissionStatus)}
                              className={cn("h-2 bg-muted/80", homeworkProgressIndicatorCn(h.submissionStatus))}
                            />
                          </div>
                          <p className="text-xs font-bold text-violet-800 dark:text-violet-300">
                            Open assignment →
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <Button variant="link" className="px-0 font-semibold text-violet-800 dark:text-violet-300" asChild>
                <Link href="/student/homework">See all homework</Link>
              </Button>
            </section>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-20 lg:basis-[34%] lg:max-w-md">
          <Card className="border-2 border-violet-600 bg-violet-600 text-white shadow-sm dark:border-violet-800 dark:bg-card dark:text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-white dark:text-white">
                <CalendarDays className="h-4 w-4 text-white dark:text-white" />
                Upcoming events
              </CardTitle>
              <CardDescription className="text-white dark:text-white">
                School calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {portalEvents === undefined && (
                <p className="text-sm text-white dark:text-white">Loading…</p>
              )}
              {portalEvents && portalEvents.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <StudentIllustration variant="emptyEvents" className="max-w-[120px] sm:max-w-[140px]" />
                  <p className="text-sm text-white dark:text-white">No upcoming events.</p>
                </div>
              )}
              {portalEvents?.map((e) => (
                <div
                  key={e._id}
                  className="rounded-lg border border-white/25 bg-white/12 px-3 py-2 text-sm text-white transition-all hover:bg-white/18 dark:border-violet-900/40 dark:bg-muted/15 dark:text-white dark:hover:border-violet-600/50"
                >
                  <p className="font-medium leading-snug dark:text-white">{e.eventTitle}</p>
                  <p className="text-xs capitalize text-white dark:text-white">
                    {e.eventType.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white dark:text-white">
                    {new Date(e.startDate).toLocaleDateString()}
                    {e.isAllDay
                      ? ""
                      : e.startTime
                        ? ` · ${e.startTime}`
                        : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-sky-600 bg-sky-600 text-white shadow-sm dark:border-sky-700 dark:bg-sky-950/65 dark:text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-white dark:text-white">
                <Clock className="h-4 w-4 text-white dark:text-white" />
                Upcoming classes
              </CardTitle>
              <CardDescription className="text-white dark:text-white">
                {timetableData === undefined
                  ? "Loading…"
                  : !hasTimetable
                    ? "Timetable not published"
                    : upcomingClasses.length
                      ? upcomingClasses[0]?.dayLabel === "Today"
                        ? "Next on your schedule today"
                        : "Next Monday · preview"
                      : "No more classes in this block"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasTimetable && timetableData !== undefined && (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <StudentIllustration variant="emptyTimetable" className="max-w-[120px] sm:max-w-[140px]" />
                  <p className="text-sm text-white dark:text-white">
                    Your timetable will show here when the school publishes it.
                  </p>
                </div>
              )}
              {hasTimetable && upcomingClasses.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <StudentIllustration variant="emptyTimetable" className="max-w-[120px] sm:max-w-[140px]" />
                  <p className="text-sm text-white dark:text-white">Enjoy your free time.</p>
                </div>
              )}
              {upcomingClasses.map((c, i) => (
                <div
                  key={`${c.periodName}-${c.startTime}-${i}`}
                  className="rounded-lg border border-white/25 bg-white/12 px-3 py-2 text-sm text-white transition-all hover:bg-white/18 dark:border-sky-900/45 dark:bg-sky-950/35 dark:text-white dark:hover:border-sky-500/50 dark:hover:bg-sky-950/55"
                >
                  <p className="text-xs font-medium text-white dark:text-white">{c.dayLabel}</p>
                  <p className="font-medium dark:text-white">{c.subjectName ?? c.periodName}</p>
                  <p className="text-xs text-white dark:text-white">
                    {c.startTime} – {c.endTime}
                    {c.teacherName ? ` · ${c.teacherName}` : ""}
                  </p>
                </div>
              ))}
              {hasTimetable && (
                <Button
                  variant="link"
                  className="h-auto px-0 font-semibold text-white hover:text-white/90 dark:text-white"
                  asChild
                >
                  <Link href="/student/timetable">Full timetable</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-800 dark:bg-emerald-950/58 dark:text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-white dark:text-white">
                <Sparkles className="h-4 w-4 text-white dark:text-white" />
                Recent activity
              </CardTitle>
              <CardDescription className="text-white dark:text-white">
                Homework, results, and notices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-white dark:text-white">Nothing recent yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentActivities.map((act, idx) => (
                    <li
                      key={`${act.at}-${idx}`}
                      className="rounded-lg border border-white/25 bg-white/12 px-2.5 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/35"
                    >
                      <Link
                        href={act.href}
                        className="font-medium text-white underline-offset-4 hover:text-white/90 hover:underline dark:text-white dark:hover:text-white/90"
                      >
                        {act.label}
                      </Link>
                      <p className="text-xs text-white dark:text-white">
                        {new Date(act.at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
