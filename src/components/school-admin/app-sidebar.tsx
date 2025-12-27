'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  School,
  CreditCard,
  Bell,
  User,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { JSX } from 'react';
import { toast } from 'sonner';

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

export function AppSidebar(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = (): void => {
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">SchoolFlow</span>
            <span className="text-xs text-muted-foreground">School Admin</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
