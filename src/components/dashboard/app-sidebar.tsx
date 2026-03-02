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
  Shield,
  Activity,
  ChevronDown,
  UserCircle,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';

const standaloneNavItems = [
  { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/super-admin/approvals', icon: CheckSquare, label: 'Approvals' },
];

const navGroups: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ href: string; icon: React.ComponentType<{ className?: string }>; label: string }>;
}> = [
  {
    label: 'Users & access',
    icon: Users,
    items: [
      { href: '/super-admin/profile', icon: User, label: 'Profile Management' },
      { href: '/super-admin/manage-admins', icon: Shield, label: 'Manage Admins' },
      { href: '/super-admin/school-admins', icon: Users, label: 'School Admins' },
    ],
  },
  {
    label: 'Schools & billing',
    icon: School,
    items: [
      { href: '/super-admin/schools', icon: School, label: 'Schools' },
      { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { href: '/super-admin/trial-management', icon: Clock, label: 'Trial Management' },
    ],
  },
  {
    label: 'Activity & security',
    icon: Activity,
    items: [
      { href: '/super-admin/activity', icon: Activity, label: 'Activity & Sessions' },
      { href: '/super-admin/audit-logs', icon: FileText, label: 'Audit Logs' },
    ],
  },
  {
    label: 'Reports & notifications',
    icon: Bell,
    items: [
      { href: '/super-admin/notifications', icon: Bell, label: 'Notifications' },
      { href: '/super-admin/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { href: '/super-admin/account', icon: UserCircle, label: 'Account' },
      { href: '/super-admin/settings', icon: Settings, label: 'Settings' },
      { href: '/super-admin/support', icon: HelpCircle, label: 'Support' },
    ],
  },
];

function isPathInGroup(pathname: string, items: Array<{ href: string }>): boolean {
  return items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
}

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
              {standaloneNavItems.map((item) => {
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
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveChild = isPathInGroup(pathname, group.items);
                return (
                  <Collapsible
                    key={group.label}
                    defaultOpen={hasActiveChild}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={group.label}>
                          <GroupIcon />
                          <span>{group.label}</span>
                          <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {group.items.map((item) => {
                            const SubIcon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton asChild isActive={isActive}>
                                  <Link href={item.href}>
                                    <SubIcon />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
