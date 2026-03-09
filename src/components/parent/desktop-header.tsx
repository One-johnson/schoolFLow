'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useParentAuth } from '@/hooks/useParentAuth';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { NotificationsDrawer } from '@/components/teacher/notifications-drawer';

export function ParentDesktopHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { parent, logout } = useParentAuth();

  const notifications = useQuery(
    api.notifications.getNotificationsByParent,
    parent ? { parentId: parent.id } : 'skip'
  );
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/parent/login');
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-10">
        <SidebarTrigger />
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 cursor-pointer hover:bg-accent">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="cursor-pointer bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {parent ? getInitials(parent.name) : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium cursor-pointer">
                    {parent?.name}
                  </span>
                  {parent?.students && parent.students.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {parent.students.length} child{parent.students.length !== 1 ? 'ren' : ''}
                    </span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{parent?.name}</span>
                  <span className="text-xs text-muted-foreground">{parent?.email}</span>
                  <span className="text-xs text-muted-foreground">Parent</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/parent/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications || []}
        teacherId={parent?.id || ''}
      />

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
