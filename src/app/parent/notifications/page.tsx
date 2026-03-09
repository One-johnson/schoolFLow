'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Id } from '../../../../convex/_generated/dataModel';

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

export default function ParentNotificationsPage() {
  const { parent } = useParentAuth();

  const notifications = useQuery(
    api.notifications.getNotificationsByParent,
    parent ? { parentId: parent.id } : 'skip'
  );

  const markAsRead = useMutation(api.notifications.markAsRead);

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

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-7 w-7" />
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Your notifications and alerts
        </p>
      </div>

      <Card>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4 space-y-3">
            {notifications === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type];
                return (
                  <div
                    key={n._id}
                    className={cn(
                      'p-4 rounded-lg border transition-colors',
                      n.read ? 'bg-background' : 'bg-muted/50'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="p-2 rounded-full h-fit bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h4 className="font-medium">{n.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(n.timestamp)}
                            </span>
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead({ id: n._id })}
                              >
                                Mark read
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
