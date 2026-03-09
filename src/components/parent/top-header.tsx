'use client';

import { useState } from 'react';
import { Bell, GraduationCap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { NotificationsDrawer } from '@/components/teacher/notifications-drawer';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ParentTopHeaderProps {
  parentId: string;
  schoolName?: string;
}

export function ParentTopHeader({ parentId, schoolName = 'SchoolFlow' }: ParentTopHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const notifications = useQuery(api.notifications.getNotificationsByParent, {
    parentId,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 pl-2 pr-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => toggleSidebar()}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <GraduationCap className="h-6 w-6 text-emerald-600" />
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
        teacherId={parentId}
      />
    </>
  );
}
