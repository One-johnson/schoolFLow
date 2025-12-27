'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, Moon, Sun, Settings, Search } from 'lucide-react';
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
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { SidebarTrigger } from '@/components/ui/sidebar';

const searchItems = [
  { label: 'Dashboard', href: '/dashboard', keywords: ['home', 'overview', 'metrics'] },
  { label: 'Profile Management', href: '/dashboard/profile', keywords: ['profile', 'account', 'settings'] },
  { label: 'School Admins', href: '/dashboard/school-admins', keywords: ['admins', 'users', 'invite'] },
  { label: 'Schools', href: '/dashboard/schools', keywords: ['schools', 'institutions', 'approve'] },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', keywords: ['billing', 'payments', 'subscription'] },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', keywords: ['logs', 'history', 'audit'] },
  { label: 'Reports & Analytics', href: '/dashboard/reports', keywords: ['reports', 'analytics', 'charts'] },
  { label: 'System Settings', href: '/dashboard/settings', keywords: ['settings', 'configuration', 'system'] },
  { label: 'Support', href: '/dashboard/support', keywords: ['help', 'support', 'tickets'] },
];

export function DesktopHeader(): JSX.Element {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const notifications = useQuery(api.notifications.list) || [];
  const markAsRead = useMutation(api.notifications.markAsRead);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser({ name: currentUser.name, email: currentUser.email });
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = (): void => {
    authService.logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleMarkAsRead = async (id: Id<'notifications'>): Promise<void> => {
    try {
      await markAsRead({ id });
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          
          <Button
            variant="outline"
            className="gap-2 text-gray-900 dark:text-white justify-start w-64"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification._id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.name || 'User'} />
                  <AvatarFallback>{user ? getInitials(user.name) : 'SA'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
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
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={showSearch} onOpenChange={setShowSearch}>
        <CommandInput placeholder="Search dashboard..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {searchItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setShowSearch(false);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

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
