"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Bell, Calendar, Megaphone } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useStudentMobileChrome } from "@/components/student/student-mobile-chrome-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

type MergedRow =
  | {
      kind: "general";
      key: string;
      id: Id<"notifications">;
      title: string;
      subtitle: string;
      at: number;
      unread: boolean;
      actionUrl?: string;
    }
  | {
      kind: "event";
      key: string;
      id: Id<"eventNotifications">;
      title: string;
      subtitle: string;
      at: number;
      unread: boolean;
    };

function NotificationBellTrigger({
  unreadCount,
  ...props
}: React.ComponentProps<typeof Button> & { unreadCount: number }): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative size-9 shrink-0 text-blue-700 dark:text-blue-300"
      aria-label="Notifications"
      {...props}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white dark:bg-blue-500">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}

function NotificationsPanelBody({
  merged,
  onRowClick,
}: {
  merged: MergedRow[];
  onRowClick: (row: MergedRow) => void;
}): React.JSX.Element {
  return (
    <>
      <div className="border-b border-border px-3 py-2">
        <p className="text-sm font-semibold">Notifications</p>
        <p className="text-xs text-muted-foreground">Homework updates & school events</p>
      </div>
      <ScrollArea className="h-[min(340px,55vh)] sm:h-[min(340px,50vh)]">
        {merged.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {merged.map((row) => (
              <li key={row.key}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                    row.unread && "bg-blue-500/5 dark:bg-blue-500/10",
                  )}
                  onClick={() => onRowClick(row)}
                >
                  <span className="flex items-center gap-1.5 font-medium leading-snug">
                    {row.kind === "general" ? (
                      <Megaphone className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                    )}
                    {row.title}
                  </span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{row.subtitle}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.at).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
      <div className="flex flex-col gap-1 border-t border-border p-2">
        <Button variant="ghost" size="sm" className="w-full text-blue-700 dark:text-blue-300" asChild>
          <Link href="/student/notifications">All updates</Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-blue-700 dark:text-blue-300" asChild>
          <Link href="/student/timetable">Timetable</Link>
        </Button>
      </div>
    </>
  );
}

export function StudentNotificationBell(): React.JSX.Element {
  const router = useRouter();
  const { student } = useStudentAuth();
  const { setNotificationSheetOpen } = useStudentMobileChrome();

  const eventRows = useQuery(
    api.eventNotifications.getMyEventNotifications,
    student ? { schoolId: student.schoolId, recipientId: student.id } : "skip",
  );
  const generalRows = useQuery(
    api.notifications.getNotificationsByStudent,
    student ? { studentId: student.id as Id<"students">, limit: 40 } : "skip",
  );

  const markEventRead = useMutation(api.eventNotifications.markNotificationAsRead);
  const markGeneralRead = useMutation(api.notifications.markStudentNotificationAsRead);

  const merged = useMemo((): MergedRow[] => {
    const out: MergedRow[] = [];
    if (generalRows) {
      for (const n of generalRows) {
        out.push({
          kind: "general",
          key: `g-${n._id}`,
          id: n._id,
          title: n.title,
          subtitle: n.message,
          at: new Date(n.timestamp).getTime(),
          unread: !n.read,
          actionUrl: n.actionUrl,
        });
      }
    }
    if (eventRows) {
      for (const n of eventRows) {
        out.push({
          kind: "event",
          key: `e-${n._id}`,
          id: n._id,
          title: n.eventTitle,
          subtitle: n.notificationType.replace(/_/g, " "),
          at: new Date(n.createdAt).getTime(),
          unread: !n.readAt,
        });
      }
    }
    out.sort((a, b) => b.at - a.at);
    return out.slice(0, 18);
  }, [generalRows, eventRows]);

  const unreadCount = merged.filter((r) => r.unread).length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const clearCompactNav = () => {
      if (mq.matches) setNotificationSheetOpen(false);
    };
    clearCompactNav();
    mq.addEventListener("change", clearCompactNav);
    return () => mq.removeEventListener("change", clearCompactNav);
  }, [setNotificationSheetOpen]);

  const handleRow = async (row: MergedRow): Promise<void> => {
    if (!student) return;
    if (row.kind === "general" && row.unread) {
      await markGeneralRead({ id: row.id, studentId: student.id as Id<"students"> });
    }
    if (row.kind === "event" && row.unread) {
      await markEventRead({ notificationId: row.id });
    }
    if (row.kind === "general" && row.actionUrl?.startsWith("/")) {
      router.push(row.actionUrl);
    }
  };

  return (
    <>
      <div className="md:hidden">
        <Sheet
          onOpenChange={(open) => {
            setNotificationSheetOpen(open);
          }}
        >
          <SheetTrigger asChild>
            <NotificationBellTrigger unreadCount={unreadCount} />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            overlayClassName="z-[100]"
            className="z-[100] flex h-[min(72vh,560px)] max-h-[85vh] flex-col gap-0 rounded-t-2xl border-t p-0 pt-2 [&>[data-slot=sheet-close]]:top-3"
          >
            <NotificationsPanelBody merged={merged} onRowClick={(row) => void handleRow(row)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        <Popover>
          <PopoverTrigger asChild>
            <NotificationBellTrigger unreadCount={unreadCount} />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
            <NotificationsPanelBody merged={merged} onRowClick={(row) => void handleRow(row)} />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
