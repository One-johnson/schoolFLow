'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Bell, Check, Info, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NotificationsPage(): JSX.Element {
  const router = useRouter();

  const schoolAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('schoolAdminEmail') : null;

  const schoolAdmins = useQuery(api.schoolAdmins.list);
  const currentAdmin = schoolAdmins?.find((admin) => admin.email === schoolAdminEmail);

  const allNotifications = useQuery(api.notifications.list);
  const notifications = allNotifications?.filter(
    (notif) => 
      notif.recipientRole === 'school_admin' && 
      (!notif.recipientId || notif.recipientId === currentAdmin?._id)
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    if (!schoolAdminEmail) {
      router.push('/login');
    }
  }, [schoolAdminEmail, router]);

  const handleMarkAsRead = async (id: string): Promise<void> => {
    try {
      await markAsRead({ id: id as any });
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      await markAllAsRead({});
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  if (!currentAdmin) {
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
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Bell className="mr-1 h-3 w-3" />
              {notifications?.length || 0} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex gap-4 p-4 rounded-lg border ${
                    notification.read ? 'bg-background' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification._id)}
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
                          <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                            View Details →
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
              <h3 className="mt-4 text-lg font-semibold">No notifications yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You'll see notifications here when there's activity
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
