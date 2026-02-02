'use client';

import { JSX } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Announcement } from './edit-announcement-dialog';

interface ViewAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement;
}

export function ViewAnnouncementDialog({ open, onOpenChange, announcement }: ViewAnnouncementDialogProps): React.JSX.Element {
  const getTargetDisplay = (): string => {
    switch (announcement.targetType) {
      case 'school':
        return 'Entire School';
      case 'class':
        return `Class: ${announcement.targetName || announcement.targetId || 'Unknown'}`;
      case 'department':
        return `Department: ${announcement.targetName || announcement.targetId || 'Unknown'}`;
      case 'teachers':
        return 'Teachers';
    }
  };

  const getStatusColor = (): string => {
    switch (announcement.status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="pr-4">{announcement.title}</DialogTitle>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${getStatusColor()}`}>
              {announcement.status}
            </span>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Target Audience</p>
            <Badge variant="secondary">{getTargetDisplay()}</Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Content</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{announcement.content}</p>
          </div>
          <div className="border-t pt-4 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {formatDate(announcement.createdAt)}
            </p>
            {announcement.publishedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Published: {formatDate(announcement.publishedAt)}
              </p>
            )}
            {announcement.updatedAt !== announcement.createdAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatDate(announcement.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
