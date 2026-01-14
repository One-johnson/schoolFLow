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
  HelpCircle,
  Users,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
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
import { JSX, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
    title: 'Academic Years',
    icon: Calendar,
    url: '/school-admin/academic-years',
  },
  {
    title: 'Teachers',
    icon: Users,
    url: '/school-admin/teachers',
  },
  {
    title: 'Classes',
    icon: BookOpen,
    url: '/school-admin/classes',
  },
  {
    title: 'Students',
    icon: GraduationCap,
    url: '/school-admin/students',
  },
  {
    title: 'Subjects',
    icon: BookOpen,
    url: '/school-admin/subjects',
  },
  {
    title: 'Timetable',
    icon: Clock,
    url: '/school-admin/timetable',
  },
   {
    title: 'Fees',
    icon: DollarSign,
    url: '/school-admin/fees',
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
    title: 'Support',
    icon: HelpCircle,
    url: '/school-admin/support',
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
          <Link href="/" className="flex items-center gap-2 px-4 py-3 hover:opacity-80 transition-opacity">
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
              Are you sure you want to logout? You will be redirected to the home page.
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
