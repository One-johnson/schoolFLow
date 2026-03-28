"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentDashboardCalendar } from "@/components/student/student-dashboard-calendar";
import { StudentHeroCarousel } from "@/components/student/student-hero-carousel";
import { StudentIllustration } from "@/components/student/student-illustration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const sid = student?.id ? (student.id as Id<"students">) : undefined;

  const homework = useQuery(
    api.students.getHomeworkForStudentPortal,
    sid ? { studentId: sid, limit: 8 } : "skip",
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
    if (homework) {
      for (const h of [...homework].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ).slice(0, 4)) {
        items.push({
          at: h.createdAt,
          label: `Homework: ${h.title}`,
          href: "/student/homework",
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
          href: "#",
        });
      }
    }
    items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
    return items.slice(0, 10);
  }, [homework, publishedMarks, announcements]);

  if (!student) {
    return null;
  }

  const upcomingHw = homework?.filter(
    (h) => new Date(h.dueDate).getTime() >= new Date().setHours(0, 0, 0, 0),
  );
  const hasTimetable = Boolean(timetableData?.timetable);
  const greet = greetingForHour();

  const calendarHomework = homework ?? [];
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
    },
    {
      title: "Timetable",
      value: timetableData === undefined ? "…" : hasTimetable ? "Live" : "Soon",
      sub: hasTimetable ? "Your week" : "Not published yet",
      href: "/student/timetable",
      icon: Clock,
      largeValue: false,
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
    },
    {
      title: "Profile",
      value: "You",
      sub: "Password & details",
      href: "/student/profile",
      icon: User,
      largeValue: false,
    },
  ] as const;

  return (
    <div className="w-full max-w-7xl space-y-8 py-6 sm:py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <StudentHeroCarousel
          student={student}
          greet={greet}
          upcomingHwCount={upcomingHw === undefined ? undefined : upcomingHw.length}
          homeworkLoaded={homework !== undefined}
          hasTimetable={hasTimetable}
          timetableLoaded={timetableData !== undefined}
          upcomingClasses={upcomingClasses}
          portalEvents={portalEvents}
          announcements={announcements}
        />
      </motion.div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1 space-y-8 lg:basis-[62%]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={item.href} className="group block h-full">
                  <Card className="relative h-full border-blue-200/80 bg-card shadow-sm transition-shadow hover:shadow-md dark:border-blue-900/50">
                    <ChevronRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    <CardHeader className="pb-2 pr-10">
                      <div className="mb-1 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <item.icon className="h-4 w-4" />
                        <CardDescription className="font-medium text-blue-700 dark:text-blue-400">
                          {item.title}
                        </CardDescription>
                      </div>
                      <CardTitle
                        className={
                          item.largeValue
                            ? "text-3xl tabular-nums text-blue-800 dark:text-blue-200"
                            : "text-lg"
                        }
                      >
                        {item.value}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StudentDashboardCalendar homework={calendarHomework} events={calendarEvents} />
            <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Announcements
                </CardTitle>
                <CardDescription>From your school and class</CardDescription>
              </CardHeader>
              <CardContent>
                {announcements === undefined && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
                {announcements && announcements.length === 0 && (
                  <p className="text-sm text-muted-foreground">No announcements right now.</p>
                )}
                {announcements && announcements.length > 0 && (
                  <ScrollArea className="h-[280px] pr-3">
                    <ul className="space-y-4">
                      {announcements.map((a) => (
                        <li key={a._id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                          <p className="font-medium leading-snug">{a.title}</p>
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {a.content}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
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
            <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Recent results
                  </CardTitle>
                  <CardDescription>Latest published grades</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-800" asChild>
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
                    className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{m.subjectName}</p>
                    <p className="text-muted-foreground">{m.examName}</p>
                    <p className="mt-1 text-blue-800 dark:text-blue-200">
                      {m.isAbsent ? "Absent" : `${m.grade} · ${Math.round(m.percentage)}%`}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {homework !== undefined && homework.length === 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Upcoming homework
                </h2>
                <p className="text-sm text-muted-foreground">Nearest due dates for your class</p>
              </div>
              <Card className="border-blue-200/80 border-dashed bg-muted/10 dark:border-blue-900/50">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                  <StudentIllustration variant="emptyHomework" />
                  <div>
                    <p className="font-medium text-foreground">You&apos;re all caught up</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No homework is due right now. Check back later or open the homework page.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-800" asChild>
                    <Link href="/student/homework">Homework page</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}

          {homework && homework.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Upcoming homework
                </h2>
                <p className="text-sm text-muted-foreground">Nearest due dates for your class</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {homework.slice(0, 8).map((h, idx) => (
                  <motion.div
                    key={h._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * idx, duration: 0.3 }}
                  >
                    <Card className="h-full border-blue-200/80 bg-card shadow-sm dark:border-blue-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base leading-snug">{h.title}</CardTitle>
                        {h.subjectName ? (
                          <CardDescription className="text-blue-700 dark:text-blue-400">
                            {h.subjectName}
                          </CardDescription>
                        ) : null}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Due {new Date(h.dueDate).toLocaleDateString()}
                        </p>
                        <Button
                          variant="link"
                          className="mt-1 h-auto px-0 text-blue-700 dark:text-blue-300"
                          asChild
                        >
                          <Link href="/student/homework">View homework</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <Button variant="link" className="px-0 text-blue-700 dark:text-blue-300" asChild>
                <Link href="/student/homework">See all homework</Link>
              </Button>
            </section>
          )}
        </div>

        <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-20 lg:basis-[34%] lg:max-w-md">
          <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Upcoming events
              </CardTitle>
              <CardDescription>School calendar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {portalEvents === undefined && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {portalEvents && portalEvents.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <StudentIllustration variant="emptyEvents" className="max-w-[120px] sm:max-w-[140px]" />
                  <p className="text-sm text-muted-foreground">No upcoming events.</p>
                </div>
              )}
              {portalEvents?.map((e) => (
                <div
                  key={e._id}
                  className="rounded-lg border border-border/70 bg-muted/15 px-3 py-2 text-sm"
                >
                  <p className="font-medium leading-snug">{e.eventTitle}</p>
                  <p className="text-xs capitalize text-muted-foreground">{e.eventType.replace(/_/g, " ")}</p>
                  <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
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

          <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Upcoming classes
              </CardTitle>
              <CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                    Your timetable will show here when the school publishes it.
                  </p>
                </div>
              )}
              {hasTimetable && upcomingClasses.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <StudentIllustration variant="emptyTimetable" className="max-w-[120px] sm:max-w-[140px]" />
                  <p className="text-sm text-muted-foreground">Enjoy your free time.</p>
                </div>
              )}
              {upcomingClasses.map((c, i) => (
                <div
                  key={`${c.periodName}-${c.startTime}-${i}`}
                  className="rounded-lg border border-border/70 bg-muted/15 px-3 py-2 text-sm"
                >
                  <p className="text-xs font-medium text-muted-foreground">{c.dayLabel}</p>
                  <p className="font-medium">{c.subjectName ?? c.periodName}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.startTime} – {c.endTime}
                    {c.teacherName ? ` · ${c.teacherName}` : ""}
                  </p>
                </div>
              ))}
              {hasTimetable && (
                <Button variant="link" className="h-auto px-0 text-blue-700 dark:text-blue-300" asChild>
                  <Link href="/student/timetable">Full timetable</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Recent activity
              </CardTitle>
              <CardDescription>Homework, results, and notices</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing recent yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentActivities.map((act, idx) => (
                    <li key={`${act.at}-${idx}`}>
                      {act.href === "#" ? (
                        <span className="text-muted-foreground">{act.label}</span>
                      ) : (
                        <Link
                          href={act.href}
                          className="text-foreground underline-offset-4 hover:text-blue-700 hover:underline dark:hover:text-blue-300"
                        >
                          {act.label}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground">
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
