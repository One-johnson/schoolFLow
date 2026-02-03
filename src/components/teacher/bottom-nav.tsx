'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ClipboardCheck, MessageSquare, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/teacher', icon: Home, label: 'Home' },
  { href: '/teacher/students', icon: Users, label: 'Students' },
  { href: '/teacher/attendance', icon: ClipboardCheck, label: 'Attend' },
  { href: '/teacher/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/teacher/reports', icon: FileText, label: 'Reports' },
  { href: '/teacher/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/teacher' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
