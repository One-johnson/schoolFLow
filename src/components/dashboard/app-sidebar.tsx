'use client';

import * as React from 'react';
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
  CheckSquare,
  Bell,
  Clock,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/super-admin/approvals', icon: CheckSquare, label: 'Approvals' },
  { href: '/super-admin/profile', icon: User, label: 'Profile Management' },
  { href: '/super-admin/school-admins', icon: Users, label: 'School Admins' },
  { href: '/super-admin/schools', icon: School, label: 'Schools' },
  { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/super-admin/trial-management', icon: Clock, label: 'Trial Management' },
  { href: '/super-admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { href: '/super-admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/super-admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/super-admin/settings', icon: Settings, label: 'Settings' },
  { href: '/super-admin/support', icon: HelpCircle, label: 'Support' },
];

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/super-admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SchoolFlow</span>
                  <span className="truncate text-xs">Super Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
