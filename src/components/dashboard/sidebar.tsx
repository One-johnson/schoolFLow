
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Users,
  UserCheck,
  Megaphone,
  Sparkles,
  School,
  LogOut,
  Book,
  ClipboardCheck,
  FileText,
  DollarSign,
  CalendarDays,
  BarChart3,
  BookCopy,
  CalendarClock,
  NotebookPen,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type Role = 'admin' | 'teacher' | 'student' | null;

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const allMenuItems = [
    {
      path: "/dashboard",
      icon: LayoutGrid,
      label: "Dashboard",
      roles: ['admin', 'teacher', 'student'],
    },
    {
      path: "/dashboard/students",
      icon: Users,
      label: "Students",
      roles: ['admin'],
    },
    {
      path: "/dashboard/teachers",
      icon: UserCheck,
      label: "Teachers",
      roles: ['admin'],
    },
     {
      path: "/dashboard/classes",
      icon: Book,
      label: "Classes",
      roles: ['admin'],
    },
    {
      path: "/dashboard/subjects",
      icon: BookCopy,
      label: "Subjects",
      roles: ['admin', 'teacher'],
    },
    {
      path: "/dashboard/terms",
      icon: CalendarClock,
      label: "Terms",
      roles: ['admin'],
    },
    {
      path: "/dashboard/announcements",
      icon: Megaphone,
      label: "Announcements",
      roles: ['admin', 'teacher', 'student'],
    },
    {
      path: "/dashboard/attendance",
      icon: ClipboardCheck,
      label: "Attendance",
      roles: ['admin', 'teacher', 'student'],
    },
    {
      path: "/dashboard/permissions",
      icon: NotebookPen,
      label: "Permissions",
      roles: ['admin', 'teacher', 'student'],
    },
    {
      path: "/dashboard/exams",
      icon: FileText,
      label: "Exams",
      roles: ['admin', 'teacher', 'student'],
      disabled: true,
    },
    {
      path: "/dashboard/fees",
      icon: DollarSign,
      label: "Fees",
      roles: ['admin', 'student'],
      disabled: true,
    },
    {
      path: "/dashboard/timetable",
      icon: CalendarDays,
      label: "Timetable",
      roles: ['admin', 'teacher', 'student'],
      disabled: true,
    },
    {
      path: "/dashboard/reports",
      icon: BarChart3,
      label: "Reports",
      roles: ['admin'],
      disabled: true,
    },
    {
      path: "/dashboard/summarize",
      icon: Sparkles,
      label: "AI Summarizer",
      roles: ['admin', 'teacher', 'student'],
    },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role || ''));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold text-primary">SchoolFlow</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <Link href={item.disabled ? "#" : item.path} passHref>
                <SidebarMenuButton
                  as="a"
                  isActive={!item.disabled && isActive(item.path)}
                  tooltip={item.label}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                  className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
