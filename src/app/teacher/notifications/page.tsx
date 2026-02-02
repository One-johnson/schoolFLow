'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '../../../../convex/_generated/dataModel';

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: Info,
  error: AlertTriangle,
};

export default function TeacherNotificationsPage() {
  const { teacher } = useTeacherAuth();

  const notifications = useQuery(
    api.notifications.getNotificationsByTeacher,
    teacher ? { teacherId: teacher.id } : 'skip'
  );

  const markAsRead = useMutation(api.notifications.markAsRead);

  const handleMarkAsRead = async (notificationId: Id<'notifications'>) => {
    try {
      await markAsRead({ id: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications) return;
    const unread = notifications.filter((n) => !n.read);
    for (const notification of unread) {
      await markAsRead({ id: notification._id });
    }
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || Bell;
            const timeAgo = formatDistanceToNow(new Date(notification.timestamp), {
              addSuffix: true,
            });

            return (
              <Card
                key={notification._id}
                className={`transition-colors ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        notification.type === 'warning' || notification.type === 'error'
                          ? 'bg-yellow-100 text-yellow-600'
                          : notification.type === 'success'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
