'use client';

import { JSX, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function NotificationsPage(): JSX.Element {
  const notifications = useQuery(api.notifications.list) || [];
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteSingle = useMutation(api.notifications.deleteSingle);
  const deleteAll = useMutation(api.notifications.deleteAll);
  const bulkDelete = useMutation(api.notifications.bulkDelete);

  const [selectedIds, setSelectedIds] = useState<Set<Id<'notifications'>>>(new Set());
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState<boolean>(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: Id<'notifications'>): Promise<void> => {
    try {
      await markAsRead({ id });
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
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteSingle = async (id: Id<'notifications'>): Promise<void> => {
    try {
      await deleteSingle({ id });
      toast.success('Notification deleted');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAll = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const count = await deleteAll({});
      toast.success(`Deleted ${count} notifications`);
      setSelectedIds(new Set());
      setShowDeleteAllDialog(false);
    } catch (error) {
      toast.error('Failed to delete all notifications');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await bulkDelete({ ids });
      toast.success(`Deleted ${ids.length} notifications`);
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete selected notifications');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id: Id<'notifications'>): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (): void => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n._id)));
    }
  };

  const getNotificationIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Stay updated with platform activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
              <Check className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              onClick={() => setShowDeleteAllDialog(true)} 
              variant="destructive" 
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </Button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-900 dark:text-white font-medium">
            {selectedIds.size} notification{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <Button 
            onClick={() => setShowBulkDeleteDialog(true)} 
            variant="destructive" 
            size="sm" 
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </CardTitle>
            <div className="flex items-center gap-4">
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedIds.size === notifications.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
                </div>
              )}
              {unreadCount > 0 && (
                <Badge variant="default">{unreadCount} Unread</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <Bell className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                All caught up!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                No notifications at the moment. We'll notify you when something important happens.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:shadow-sm ${
                    !notification.read
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(notification._id)}
                    onCheckedChange={() => toggleSelection(notification._id)}
                  />
                  
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSingle(notification._id)}
                      className="hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {notifications.length} notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAll} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected notification{selectedIds.size > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
