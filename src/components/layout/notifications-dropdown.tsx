"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  schoolId?: Id<"schools">;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: number;
  readAt?: number;
}

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Queries
  const notifications = useQuery(
    api.notifications.getNotifications,
    user?.id ? { userId: user.id as Id<"users">, limit: 20 } : "skip"
  ) as Notification[] | undefined;

  const unreadCountData = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id as Id<"users"> } : "skip"
  ) as number | undefined;

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  const unreadCount = unreadCountData ?? 0;

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead({ userId: user.id as Id<"users"> });
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    try {
      await clearAll({ userId: user.id as Id<"users"> });
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between px-2 py-2">
          <DropdownMenuLabel className="p-0">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-red-600 hover:text-red-700"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {notifications && notifications.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <DropdownMenuItem
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification._id);
                      }
                    }}
                  >
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-950"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-red-600" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">No notifications</p>
            <p className="text-xs text-muted-foreground">
              You're all caught up!
            </p>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Notification Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
