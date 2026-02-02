'use client';

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';

interface Notification {
  _id: Id<'notifications'>;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
  teacherId: string;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeStyles = {
  info: 'text-blue-500 bg-blue-50',
  warning: 'text-yellow-500 bg-yellow-50',
  success: 'text-green-500 bg-green-50',
  error: 'text-red-500 bg-red-50',
};

export function NotificationsDrawer({
  open,
  onOpenChange,
  notifications,
}: NotificationsDrawerProps) {
  const markAsRead = useMutation(api.notifications.markAsRead);

  // Mark unread notifications as read when drawer opens
  useEffect(() => {
    if (open) {
      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => n._id);

      if (unreadIds.length > 0) {
        unreadIds.forEach((id) => {
          markAsRead({ id });
        });
      }
    }
  }, [open, notifications, markAsRead]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-60px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification._id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      notification.read
                        ? 'bg-background'
                        : 'bg-muted/50'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full h-fit',
                          typeStyles[notification.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
