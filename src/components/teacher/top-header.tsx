'use client';

import { useState } from 'react';
import { Bell, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsDrawer } from './notifications-drawer';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface TopHeaderProps {
  teacherId: string;
  schoolName?: string;
}

export function TopHeader({ teacherId, schoolName = 'SchoolFlow' }: TopHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = useQuery(api.notifications.getNotificationsByTeacher, {
    teacherId,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-sm truncate max-w-45">
              {schoolName}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications || []}
        teacherId={teacherId}
      />
    </>
  );
}
