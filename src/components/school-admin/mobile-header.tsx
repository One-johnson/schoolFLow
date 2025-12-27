'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { JSX } from 'react';

export function MobileHeader(): JSX.Element {
  const notifications = useQuery(api.notifications.list);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <header className="md:hidden flex h-14 items-center gap-4 border-b bg-background px-4 sticky top-0 z-10">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">SchoolFlow</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>SA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
