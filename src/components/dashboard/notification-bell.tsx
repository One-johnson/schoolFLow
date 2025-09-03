
"use client";

import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  BookOpen,
  Megaphone,
  DollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FirebaseOptions } from "firebase/app";

type Notification = {
  id: string;
  type: "student_enrolled" | "teacher_added" | "class_created" | "announcement" | "exam_published" | "fee_assigned" | "payment_received";
  message: string;
  read: boolean;
  createdAt: number;
  recipientId?: string; // For user-specific notifications
};

const iconMap = {
  student_enrolled: <UserPlus className="h-4 w-4" />,
  teacher_added: <UserPlus className="h-4 w-4" />,
  class_created: <BookOpen className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
  exam_published: <FileText className="h-4 w-4 text-purple-500" />,
  fee_assigned: <DollarSign className="h-4 w-4 text-red-500" />,
  payment_received: <DollarSign className="h-4 w-4 text-green-500" />,
};

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications, updateData, deleteData } = useDatabase<Notification>('notifications');

  // Filter notifications for the current user or system-wide
  const userNotifications = React.useMemo(() => {
    return notifications.filter(n => !n.recipientId || n.recipientId === user?.uid)
  }, [notifications, user]);

  const unreadCount = userNotifications.filter((n) => !n.read).length;
  const sortedNotifications = [...userNotifications].sort((a, b) => b.createdAt - a.createdAt);


  const markAllAsRead = () => {
    userNotifications.forEach((n) => {
      if (!n.read) {
        updateData(n.id, { read: true });
      }
    });
  };

  const clearAll = () => {
    userNotifications.forEach((n) => {
      deleteData(n.id);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <p>Notifications</p>
          {unreadCount > 0 && <Badge>{unreadCount} New</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 ${!notification.read ? "bg-accent" : ""}`}
                   onSelect={(e) => {
                    e.preventDefault();
                    if (!notification.read) {
                      updateData(notification.id, { read: true });
                    }
                  }}
                >
                  <div className="mt-1 text-muted-foreground">
                    {iconMap[notification.type] || <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="flex justify-center items-center h-full p-4 text-sm text-muted-foreground">
                No new notifications
              </div>
            )}
          </DropdownMenuGroup>
        </ScrollArea>
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
          <DropdownMenuItem onSelect={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            <span>Mark all as read</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={clearAll} disabled={notifications.length === 0} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear all</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
