'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Megaphone, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/parent', icon: Home, label: 'Home' },
  { href: '/parent/children', icon: Users, label: 'Children' },
  { href: '/parent/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/parent/announcements', icon: Megaphone, label: 'News' },
  { href: '/parent/profile', icon: User, label: 'Profile' },
];

export function ParentBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/parent' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
                isActive
                  ? 'text-emerald-600'
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
