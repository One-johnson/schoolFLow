"use client";

import { useEffect, useState } from "react";
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
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  LogOut,
  GraduationCap,
  Clock,
  BookOpen,
  BarChart3,
  Bell,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { toast } from "sonner";

const mainMenuItems = [
  { title: "Dashboard", icon: Home, url: "/student" },
  { title: "Timetable", icon: Clock, url: "/student/timetable" },
  { title: "Homework", icon: BookOpen, url: "/student/homework" },
  { title: "Study help", icon: Sparkles, url: "/student/study-help" },
  { title: "Updates", icon: Bell, url: "/student/notifications" },
  { title: "Results", icon: BarChart3, url: "/student/results" },
];

const settingsMenuItems = [{ title: "Profile", icon: User, url: "/student/profile" }];

export function StudentAppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, student } = useStudentAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/student/login");
  };

  const isActive = (url: string): boolean => {
    if (url === "/student") return pathname === "/student";
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-blue-200/50 dark:border-blue-900/40">
          <Link
            href="/student"
            className="mx-2 mt-1 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm dark:bg-blue-500">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-bold tracking-tight text-blue-900 dark:text-blue-100">
                SchoolFlow
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-blue-700/90 dark:text-blue-400/90">
                Student hub
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-700/70 dark:text-blue-400/80">Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
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
            <SidebarGroupLabel className="text-blue-700/70 dark:text-blue-400/80">Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
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
        <SidebarFooter className="border-t border-blue-200/50 dark:border-blue-900/40">
          <div className="mx-2 mb-1 rounded-xl bg-blue-500/5 px-4 py-3 dark:bg-blue-500/10">
            <p className="text-sm font-semibold truncate">
              {student ? `${student.firstName} ${student.lastName}` : ""}
            </p>
            <p className="text-xs text-muted-foreground truncate font-mono">{student?.studentId}</p>
            {student?.className && (
              <p className="mt-1 truncate text-xs font-medium text-blue-700 dark:text-blue-400">
                {student.className}
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
