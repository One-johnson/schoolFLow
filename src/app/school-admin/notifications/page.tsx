"use client";

import { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Bell,
  Check,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// Unified notification type
type UnifiedNotification = {
  _id: string;
  type: "platform" | "event";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: "success" | "warning" | "error" | "info" | "event";
  actionUrl?: string;
  eventId?: string;
  eventCode?: string;
  notificationType?: string;
};

export default function NotificationsPage(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const { user } = useAuth();

  // Fetch school admin data
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : "skip",
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : "skip",
  );

  // Query both notification types
  const allPlatformNotifications = useQuery(api.notifications.list);
  const platformNotifications = allPlatformNotifications?.filter(
    (notif) =>
      notif.recipientRole === "school_admin" &&
      (!notif.recipientId || notif.recipientId === schoolAdmin?._id),
  );

  type EventNotificationDoc = {
    _id: string;
    notificationType: string;
    eventTitle: string;
    createdAt: string;
    readAt?: string | null;
    eventId?: string;
    eventCode?: string;
  };

  const eventNotifications = useQuery(
    schoolAdmin?.schoolId
      ? api.eventNotifications.getMyEventNotifications
      : "skip",
    schoolAdmin?.schoolId
      ? {
          schoolId: schoolAdmin.schoolId,
          recipientId: schoolAdmin._id.toString(),
        }
      : undefined,
  ) as EventNotificationDoc[] | undefined;

  const markPlatformAsRead = useMutation(api.notifications.markAsRead);
  const markAllPlatformAsRead = useMutation(api.notifications.markAllAsRead);
  const markEventAsRead = useMutation(
    api.eventNotifications.markNotificationAsRead,
  );

  // Merge and transform notifications
  const unifiedNotifications: UnifiedNotification[] = [
    ...(platformNotifications || []).map((notif) => ({
      _id: notif._id,
      type: "platform" as const,
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp,
      read: notif.read,
      icon: notif.type as "success" | "warning" | "error" | "info",
      actionUrl: notif.actionUrl,
    })),
    ...(eventNotifications || []).map((notif) => ({
      _id: notif._id,
      type: "event" as const,
      title: getEventNotificationTitle(
        notif.notificationType,
        notif.eventTitle,
      ),
      message: getEventNotificationMessage(
        notif.notificationType,
        notif.eventTitle,
      ),
      timestamp: notif.createdAt,
      read: !!notif.readAt,
      icon: "event" as const,
      actionUrl: `/school-admin/events`,
      eventId: notif.eventId,
      eventCode: notif.eventCode,
      notificationType: notif.notificationType,
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const handleMarkAsRead = async (
    notification: UnifiedNotification,
  ): Promise<void> => {
    try {
      if (notification.type === "platform") {
        await markPlatformAsRead({ id: notification._id });
      } else {
        await markEventAsRead({ notificationId: notification._id });
      }
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      // Mark all platform notifications as read
      await markAllPlatformAsRead({});

      // Mark all event notifications as read (one by one for now)
      const unreadEventNotifs = (eventNotifications || []).filter(
        (n) => !n.readAt,
      );
      for (const notif of unreadEventNotifs) {
        await markEventAsRead({ notificationId: notif._id });
      }

      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const getNotificationIcon = (icon: string): React.JSX.Element => {
    switch (icon) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "event":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  function getEventNotificationTitle(type: string, eventTitle: string): string {
    switch (type) {
      case "event_created":
        return "📅 New Event Created";
      case "event_updated":
        return "✏️ Event Updated";
      case "event_cancelled":
        return "❌ Event Cancelled";
      case "rsvp_reminder":
        return "⏰ RSVP Reminder";
      case "event_reminder":
        return "⏰ Event Reminder";
      default:
        return "📅 Event Notification";
    }
  }

  function getEventNotificationMessage(
    type: string,
    eventTitle: string,
  ): string {
    switch (type) {
      case "event_created":
        return `New event "${eventTitle}" has been scheduled`;
      case "event_updated":
        return `Event "${eventTitle}" has been updated`;
      case "event_cancelled":
        return `Event "${eventTitle}" has been cancelled`;
      case "rsvp_reminder":
        return `Please RSVP for "${eventTitle}"`;
      case "event_reminder":
        return `Reminder: "${eventTitle}" is coming up`;
      default:
        return eventTitle;
    }
  }

  const filteredNotifications = unifiedNotifications.filter((notif) => {
    if (activeTab === "all") return true;
    if (activeTab === "platform") return notif.type === "platform";
    if (activeTab === "events") return notif.type === "event";
    return true;
  });

  const unreadCount = unifiedNotifications.filter((n) => !n.read).length;
  const platformUnreadCount = unifiedNotifications.filter(
    (n) => n.type === "platform" && !n.read,
  ).length;
  const eventUnreadCount = unifiedNotifications.filter(
    (n) => n.type === "event" && !n.read,
  ).length;

  if (!schoolAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your school activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "No unread notifications"}
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Bell className="mr-1 h-3 w-3" />
              {unifiedNotifications.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 min-w-5 px-1 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="platform">
                Platform
                {platformUnreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 min-w-5 px-1 text-xs"
                  >
                    {platformUnreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events">
                Events
                {eventUnreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 min-w-5 px-1 text-xs"
                  >
                    {eventUnreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`flex gap-4 p-4 rounded-lg border ${
                        notification.read
                          ? "bg-background"
                          : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.icon)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {notification.title}
                              </h4>
                              {notification.type === "event" && (
                                <Badge variant="outline" className="text-xs">
                                  Event
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                size="sm"
                                variant="link"
                                className="h-auto p-0 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {notification.type === "event"
                                  ? "View Event"
                                  : "View Details"}{" "}
                                →
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No notifications
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {activeTab === "all" &&
                      "You'll see notifications here when there's activity"}
                    {activeTab === "platform" &&
                      "No platform notifications yet"}
                    {activeTab === "events" && "No event notifications yet"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
