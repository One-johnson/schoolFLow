'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  School,
  CreditCard,
  Bell,
  User,
  Settings,
  LogOut,
  GraduationCap,
  HelpCircle,
  Users,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ClipboardCheck,
  Megaphone,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
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
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const standaloneNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/school-admin' },
];

const navGroups: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ title: string; icon: React.ComponentType<{ className?: string }>; url: string }>;
}> = [
  {
    label: 'School & setup',
    icon: School,
    items: [
      { title: 'My School', icon: School, url: '/school-admin/school' },
      { title: 'Departments', icon: Layers, url: '/school-admin/departments' },
      { title: 'Academic Years', icon: Calendar, url: '/school-admin/academic-years' },
    ],
  },
  {
    label: 'People & classes',
    icon: Users,
    items: [
      { title: 'Teachers', icon: Users, url: '/school-admin/teachers' },
      { title: 'Classes', icon: BookOpen, url: '/school-admin/classes' },
      { title: 'Students', icon: GraduationCap, url: '/school-admin/students' },
      { title: 'Subjects', icon: BookOpen, url: '/school-admin/subjects' },
    ],
  },
  {
    label: 'Timetable & attendance',
    icon: Clock,
    items: [
      { title: 'Timetable', icon: Clock, url: '/school-admin/timetable' },
      { title: 'Attendance', icon: ClipboardCheck, url: '/school-admin/attendance' },
    ],
  },
  {
    label: 'Exams & reports',
    icon: FileText,
    items: [
      { title: 'Exams', icon: FileText, url: '/school-admin/exams' },
      { title: 'Reports', icon: BarChart3, url: '/school-admin/reports' },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    items: [
      { title: 'Fees', icon: DollarSign, url: '/school-admin/fees' },
      { title: 'Subscription', icon: CreditCard, url: '/school-admin/subscription' },
    ],
  },
  {
    label: 'Events & communication',
    icon: Megaphone,
    items: [
      { title: 'Events', icon: Calendar, url: '/school-admin/events' },
      { title: 'Announcements', icon: Megaphone, url: '/school-admin/announcements' },
      { title: 'Notifications', icon: Bell, url: '/school-admin/notifications' },
    ],
  },
  {
    label: 'Account & support',
    icon: User,
    items: [
      { title: 'Profile', icon: User, url: '/school-admin/profile' },
      { title: 'Settings', icon: Settings, url: '/school-admin/settings' },
      { title: 'Support', icon: HelpCircle, url: '/school-admin/support' },
    ],
  },
];

function isPathInGroup(
  pathname: string,
  items: Array<{ url: string }>,
): boolean {
  return items.some(
    (item) => pathname === item.url || pathname.startsWith(item.url + '/'),
  );
}

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SchoolFlow</span>
              <span className="text-xs text-muted-foreground">School Admin</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {standaloneNavItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                          <SidebarMenuButton>
                            <GroupIcon className="h-4 w-4" />
                            <span>{group.label}</span>
                            <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.items.map((item) => {
                              const SubIcon = item.icon;
                              const isActive = pathname === item.url;
                              return (
                                <SidebarMenuSubItem key={item.url}>
                                  <SidebarMenuSubButton asChild isActive={isActive}>
                                    <Link href={item.url}>
                                      <SubIcon className="h-4 w-4" />
                                      <span>{item.title}</span>
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
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the home
              page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
