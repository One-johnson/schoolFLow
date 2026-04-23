"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  Clock,
  BookOpen,
  Sparkles,
  Bell,
  BarChart3,
  ChevronRight,
  Calendar,
  Shield,
  Inbox,
  BellOff,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

const quickLinks = [
  { title: "Dashboard", icon: Home, href: "/student" },
  { title: "Timetable", icon: Clock, href: "/student/timetable" },
  { title: "Homework", icon: BookOpen, href: "/student/homework" },
  { title: "Study help", icon: Sparkles, href: "/student/study-help" },
  { title: "Updates", icon: Bell, href: "/student/notifications" },
  { title: "Results", icon: BarChart3, href: "/student/results" },
] as const;

function formatDue(due: string): string {
  const x = new Date(due);
  return Number.isNaN(x.getTime())
    ? due
    : x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StudentProfileAside({
  studentId,
}: {
  studentId: Id<"students">;
}) {
  const summaries = useQuery(api.students.getHomeworkSummariesForStudentPortal, {
    studentId,
    limit: 50,
  });
  const notifications = useQuery(api.notifications.getNotificationsByStudent, {
    studentId,
    limit: 8,
  });

  const dueSoon = useMemo(() => {
    if (!summaries?.length) return [];
    const start = new Date().setHours(0, 0, 0, 0);
    return [...summaries]
      .filter((h) => new Date(h.dueDate).getTime() >= start)
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 4);
  }, [summaries]);

  const recentUpdates = notifications?.slice(0, 5) ?? [];
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <aside className="w-full max-w-2xl mx-auto md:mx-0 md:max-w-none space-y-6 md:sticky md:top-24 md:self-start">
      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick links</CardTitle>
          <CardDescription>Jump to your usual places</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1">
          {quickLinks.map(({ title, icon: Icon, href }) => (
            <Button
              key={href}
              variant="ghost"
              className="h-auto justify-between gap-2 py-2.5 px-3 font-normal"
              asChild
            >
              <Link href={href}>
                <span className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  <span className="truncate">{title}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Due soon</CardTitle>
            <CardDescription>Open homework with upcoming due dates</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/homework">All</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {summaries === undefined ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 rounded-md bg-muted/60" />
              <div className="h-10 rounded-md bg-muted/60" />
            </div>
          ) : dueSoon.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/25 px-3 py-5 text-center">
              <Inbox
                className="mx-auto mb-2 h-8 w-8 text-muted-foreground/55"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines right now.
              </p>
              <Button variant="link" asChild className="mt-1 h-auto p-0 text-violet-700 dark:text-violet-300">
                <Link href="/student/homework">View homework</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-1">
              {dueSoon.map((h) => (
                <li key={h._id}>
                  <Link
                    href={`/student/homework/${h._id}`}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-violet-500/10 dark:hover:bg-violet-500/15"
                  >
                    <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium line-clamp-2">{h.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        Due {formatDue(h.dueDate)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Updates</CardTitle>
            <CardDescription>
              {notifications === undefined
                ? "Loading…"
                : unreadCount > 0
                  ? `${unreadCount} unread`
                  : "Recent from your school"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/notifications">Open</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {notifications === undefined ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-9 rounded-md bg-muted/60" />
              <div className="h-9 rounded-md bg-muted/60" />
            </div>
          ) : recentUpdates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/25 px-3 py-5 text-center">
              <BellOff
                className="mx-auto mb-2 h-8 w-8 text-muted-foreground/55"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
              <Button variant="link" asChild className="mt-1 h-auto p-0 text-violet-700 dark:text-violet-300">
                <Link href="/student/notifications">Open updates</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentUpdates.map((n) => (
                <li key={n._id}>
                  <Link
                    href="/student/notifications"
                    className="block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-violet-500/10 dark:hover:bg-violet-500/15"
                  >
                    <span className="flex items-center gap-2">
                      {!n.read ? (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
                      )}
                      <span className="font-medium line-clamp-2">{n.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-200/50 dark:border-violet-800/40 shadow-md shadow-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Account tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Use a strong password and do not share your login. If your school record looks wrong,
            ask a parent or the office to update it.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
