"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Bell, Calendar } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

export function StudentNotificationBell(): React.JSX.Element {
  const { student } = useStudentAuth();
  const notifications = useQuery(
    api.eventNotifications.getMyEventNotifications,
    student ? { schoolId: student.schoolId, recipientId: student.id } : "skip",
  );
  const markRead = useMutation(api.eventNotifications.markNotificationAsRead);

  const sorted = useMemo(() => {
    if (!notifications?.length) return [];
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notifications]);

  const unreadCount = sorted.filter((n) => !n.readAt).length;

  const handleOpenItem = async (id: Id<"eventNotifications">, hasRead: boolean): Promise<void> => {
    if (!hasRead) {
      await markRead({ notificationId: id });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 text-blue-700 dark:text-blue-300"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white dark:bg-blue-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">School events and reminders</p>
        </div>
        <ScrollArea className="h-[min(320px,50vh)]">
          {sorted.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sorted.slice(0, 12).map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                      !n.readAt && "bg-blue-500/5 dark:bg-blue-500/10",
                    )}
                    onClick={() => void handleOpenItem(n._id, Boolean(n.readAt))}
                  >
                    <span className="font-medium leading-snug">{n.eventTitle}</span>
                    <span className="text-xs text-muted-foreground">{n.notificationType.replace(/_/g, " ")}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-blue-700 dark:text-blue-300" asChild>
            <Link href="/student/timetable">View timetable</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
