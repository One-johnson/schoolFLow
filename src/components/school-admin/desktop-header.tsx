'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { JSX } from 'react';

export function DesktopHeader(): JSX.Element {
  const notifications = useQuery(api.notifications.list);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <header className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-10">
      <SidebarTrigger />
      <div className="flex-1 flex items-center gap-4">
        <form className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4">
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
