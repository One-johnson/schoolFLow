"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCheck, Megaphone } from "lucide-react";
import { WebPushPrompt } from "@/components/web-push-prompt";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentNotificationsPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const rows = useQuery(
    api.notifications.getNotificationsByStudent,
    student ? { studentId: student.id as Id<"students">, limit: 100 } : "skip",
  );
  const markAll = useMutation(api.notifications.markAllStudentNotificationsAsRead);

  if (!student) return null;

  const unread = rows?.filter((n) => !n.read).length ?? 0;

  const handleMarkAll = async () => {
    try {
      const n = await markAll({ studentId: student.id as Id<"students"> });
      if (n > 0) toast.success(`Marked ${n} as read`);
      else toast.message("Nothing to mark");
    } catch {
      toast.error("Could not update notifications");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StudentPageHeader
        icon={Bell}
        title="Updates"
        subtitle="Homework and reminders from your school"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows === undefined ? "Loading…" : `${rows.length} notification${rows.length === 1 ? "" : "s"}`}
          {unread > 0 ? ` · ${unread} unread` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WebPushPrompt />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!rows?.length || unread === 0}
          onClick={() => void handleMarkAll()}
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
        </div>
      </div>

      {rows && rows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No notifications yet. You&apos;ll see new homework and reminders here.
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {rows?.map((n) => (
          <li key={n._id}>
            <NotificationRow notification={n} studentId={student.id as Id<"students">} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  notification,
  studentId,
}: {
  notification: {
    _id: Id<"notifications">;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "error";
    timestamp: string;
    read: boolean;
    actionUrl?: string;
  };
  studentId: Id<"students">;
}) {
  const markRead = useMutation(api.notifications.markStudentNotificationAsRead);

  const onMarkRead = async () => {
    if (notification.read) return;
    try {
      await markRead({ id: notification._id, studentId });
    } catch {
      toast.error("Could not mark as read");
    }
  };

  return (
    <Card
      className={
        notification.read
          ? "border-border/80"
          : "border-violet-200/60 bg-violet-500/[0.04] dark:border-violet-800/50 dark:bg-violet-500/[0.06]"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-snug">{notification.title}</CardTitle>
            <CardDescription className="text-xs">
              {new Date(notification.timestamp).toLocaleString()} · {notification.type}
            </CardDescription>
          </div>
          {!notification.read ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600 dark:bg-violet-400" aria-hidden />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
        <p className="whitespace-pre-wrap leading-relaxed">{notification.message}</p>
        <div className="flex flex-wrap gap-2">
          {!notification.read ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void onMarkRead()}>
              Mark read
            </Button>
          ) : null}
          {notification.actionUrl?.startsWith("/") ? (
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-600/90" asChild>
              <Link href={notification.actionUrl} onClick={() => void onMarkRead()}>
                Open
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
