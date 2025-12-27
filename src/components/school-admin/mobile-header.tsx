'use client';

import { Bell, Menu, LogOut, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  School, 
  CreditCard, 
  User, 
  Settings 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { JSX } from 'react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/school-admin',
  },
  {
    title: 'My School',
    icon: School,
    url: '/school-admin/school',
  },
  {
    title: 'Subscription',
    icon: CreditCard,
    url: '/school-admin/subscription',
  },
  {
    title: 'Notifications',
    icon: Bell,
    url: '/school-admin/notifications',
  },
  {
    title: 'Profile',
    icon: User,
    url: '/school-admin/profile',
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/school-admin/settings',
  },
];

export function MobileHeader(): JSX.Element {
  const notifications = useQuery(api.notifications.list);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = (): void => {
    localStorage.removeItem('schoolAdminEmail');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <header className="md:hidden flex h-14 items-center gap-4 border-b bg-background px-4 sticky top-0 z-10">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col text-left">
                <SheetTitle className="text-base font-semibold">SchoolFlow</SheetTitle>
                <span className="text-xs text-muted-foreground">School Admin Portal</span>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    {item.title === 'Notifications' && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="text-lg font-semibold">SchoolFlow</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/school-admin/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>SA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
