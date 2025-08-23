
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
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
import { useAuth } from "@/hooks/use-auth";

export function DashboardSidebar({ role }: { role: ReturnType<typeof useAuth>['role'] }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string, exact: boolean = true) => {
    if (!path) return false;
    // For sub-items, we don't want an exact match, just that the path starts with it
    if (!exact) return pathname.startsWith(path);
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
      exact: true,
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
      roles: ['admin','teacher', 'student'],
    },
    {
      path: "/dashboard/permissions",
      icon: NotebookPen,
      label: "Permissions",
      roles: ['admin', 'teacher', 'student'],
    },
     {
      path: "/dashboard/reports",
      icon: BarChart3,
      label: "Reports",
      roles: ['admin'],
    },
    {
      path: "/dashboard/exams",
      icon: FileText,
      label: "Exams",
      roles: ['admin', 'teacher', 'student'],
      disabled: true,
    },
    {
      label: "Fees",
      path: "/dashboard/fees",
      icon: DollarSign,
      roles: ['admin', 'student'],
      subItems: [
        { path: '/dashboard/fees/structures', label: 'Structures', roles: ['admin'] },
        { path: '/dashboard/fees/assign', label: 'Assign Fees', roles: ['admin'] },
        { path: '/dashboard/fees/payments', label: 'Payments', roles: ['admin'] },
        { path: '/dashboard/fees/my-fees', label: 'My Fees', roles: ['student'], disabled: true },
      ]
    },
    {
      path: "/dashboard/timetable",
      icon: CalendarDays,
      label: "Timetable",
      roles: ['admin', 'teacher', 'student'],
      disabled: true,
    },
    {
      path: "/dashboard/summarize",
      icon: Sparkles,
      label: "AI Summarizer",
      roles: ['admin', 'teacher', 'student'],
    },
  ];

  const menuItems = allMenuItems.filter(item => {
    // If the item has sub-items, we need to check if any of the sub-items are available for the current role.
    if (item.subItems) {
      return item.subItems.some(sub => sub.roles.includes(role || ''));
    }
    return item.roles.includes(role || '');
  });

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
          {menuItems.map((item) => {
            const hasVisibleSubItems = item.subItems?.some(sub => sub.roles.includes(role || ''));
            const visibleSubItems = item.subItems?.filter(sub => sub.roles.includes(role || ''));

            return (
            <SidebarMenuItem key={item.path || item.label}>
              {!hasVisibleSubItems ? (
                 <Link href={item.disabled ? "#" : item.path!} asChild>
                    <SidebarMenuButton
                      isActive={!item.disabled && isActive(item.path!, item.exact)}
                      tooltip={item.label}
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                      className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
              ) : (
                 <SidebarMenuButton
                      isActive={!item.disabled && !!visibleSubItems?.some(sub => isActive(sub.path, false))}
                      tooltip={item.label}
                      disabled={item.disabled}
                      aria-disabled={item.disabled}
                      isSubmenu
                      className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                  </SidebarMenuButton>
              )}
               
                {visibleSubItems && visibleSubItems.length > 0 && (
                   <SidebarMenuSub>
                     {visibleSubItems.map(subItem => (
                       <SidebarMenuSubItem key={subItem.path}>
                          <Link href={subItem.path} asChild>
                            <SidebarMenuSubButton isActive={isActive(subItem.path)}>
                                {subItem.label}
                            </SidebarMenuSubButton>
                          </Link>
                       </SidebarMenuSubItem>
                     ))}
                   </SidebarMenuSub>
                )}
            </SidebarMenuItem>
          )})}
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

  