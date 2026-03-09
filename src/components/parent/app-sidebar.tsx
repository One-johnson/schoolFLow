'use client';

import { useEffect } from 'react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  MessageSquare,
  FileText,
  User,
  LogOut,
  GraduationCap,
  Bell,
  Megaphone,
  Calendar,
  Wallet,
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
import { useParentAuth } from '@/hooks/useParentAuth';
import { toast } from 'sonner';

const mainMenuItems = [
  { title: 'Dashboard', icon: Home, url: '/parent' },
  { title: 'My Children', icon: Users, url: '/parent/children' },
  { title: 'Messages', icon: MessageSquare, url: '/parent/messages' },
  { title: 'Announcements', icon: Megaphone, url: '/parent/announcements' },
  { title: 'Events', icon: Calendar, url: '/parent/events' },
  { title: 'Fees', icon: Wallet, url: '/parent/fees' },
];

const settingsMenuItems = [
  { title: 'Notifications', icon: Bell, url: '/parent/notifications' },
  { title: 'Profile', icon: User, url: '/parent/profile' },
];

export function ParentAppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, parent } = useParentAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  // Close mobile sheet when navigating
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/parent/login');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link href="/parent" className="flex items-center gap-2 px-4 py-3 hover:opacity-80 transition-opacity" onClick={() => isMobile && setOpenMobile(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SchoolFlow</span>
              <span className="text-xs text-muted-foreground">Parent Portal</span>
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
                      isActive={pathname === item.url || (item.url !== '/parent' && pathname.startsWith(item.url))}
                    >
                      <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
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
                      <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
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
            <p className="text-sm font-medium truncate">{parent?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{parent?.email}</p>
            {parent?.students && parent.students.length > 0 && (
              <p className="text-xs text-emerald-600 truncate mt-1">
                {parent.students.length} child{parent.students.length !== 1 ? 'ren' : ''}
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
