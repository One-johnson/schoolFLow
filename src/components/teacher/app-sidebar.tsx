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
  Home,
  Users,
  ClipboardCheck,
  BookOpen,
  FileText,
  User,
  LogOut,
  GraduationCap,
  Bell,
  MessageSquare,
  BarChart3,
  Calendar,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useState } from 'react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { toast } from 'sonner';

const mainMenuItems = [
  { title: 'Dashboard', icon: Home, url: '/teacher' },
  { title: 'Students', icon: Users, url: '/teacher/students' },
  { title: 'Attendance', icon: ClipboardCheck, url: '/teacher/attendance' },
  { title: 'Grade Book', icon: BookOpen, url: '/teacher/gradebook' },
  { title: 'Messages', icon: MessageSquare, url: '/teacher/messages' },
];

const toolsMenuItems = [
  { title: 'Analytics', icon: BarChart3, url: '/teacher/analytics' },
  { title: 'Calendar', icon: Calendar, url: '/teacher/calendar' },
  { title: 'Reports', icon: FileText, url: '/teacher/reports' },
  { title: 'Export', icon: Download, url: '/teacher/export' },
];

const settingsMenuItems = [
  { title: 'Notifications', icon: Bell, url: '/teacher/notifications' },
  { title: 'Profile', icon: User, url: '/teacher/profile' },
];

export function TeacherAppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, teacher } = useTeacherAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/teacher/login');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link href="/teacher" className="flex items-center gap-2 px-4 py-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SchoolFlow</span>
              <span className="text-xs text-muted-foreground">Teacher Portal</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || (item.url !== '/teacher' && pathname.startsWith(item.url))}
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

          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url)}
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

          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname.startsWith(item.url)}
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
          <div className="px-4 py-2 border-t">
            <p className="text-sm font-medium truncate">
              {teacher?.firstName} {teacher?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{teacher?.email}</p>
            {teacher?.classNames && teacher.classNames.length > 0 && (
              <p className="text-xs text-primary truncate mt-1">
                Class: {teacher.classNames.join(', ')}
              </p>
            )}
          </div>
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
