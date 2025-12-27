'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { authService } from '@/lib/auth';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Users,
  School,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/super-admin/profile', icon: User, label: 'Profile Management' },
  { href: '/super-admin/school-admins', icon: Users, label: 'School Admins' },
  { href: '/super-admin/schools', icon: School, label: 'Schools' },
  { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/super-admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { href: '/super-admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/super-admin/settings', icon: Settings, label: 'Settings' },
  { href: '/super-admin/support', icon: HelpCircle, label: 'Support' },
];

export function MobileHeader(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useQuery(api.notifications.list) || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser({ name: currentUser.name, email: currentUser.email });
    }
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SchoolFlow</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push('/super-admin/notifications')}
        >
          <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/super-admin/account')}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user?.name || 'User'} />
            <AvatarFallback>{user ? getInitials(user.name) : 'SA'}</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}
