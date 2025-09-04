
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Book,
  BookCopy,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  DollarSign,
  FileText,
  LayoutGrid,
  LogOut,
  Megaphone,
  NotebookPen,
  School,
  Sparkles,
  User,
  UserCheck,
  Users,
  MessageSquare,
  Home,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-unread-count";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/firebase";

export function DashboardSidebar({
  role,
}: {
  role: ReturnType<typeof useAuth>["role"];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const unreadMessageCount = useUnreadCount();

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
      roles: ["admin", "teacher", "student"],
      exact: true,
    },
    {
      path: `/dashboard/students/${user?.uid}`,
      icon: User,
      label: "My Profile",
      roles: ["student"],
    },
    {
      path: "/dashboard/students",
      icon: Users,
      label: "Students",
      roles: ["admin", "teacher"],
    },
    {
      path: "/dashboard/teachers",
      icon: UserCheck,
      label: "Teachers",
      roles: ["admin"],
    },
    {
      path: "/dashboard/classes",
      icon: Book,
      label: "Classes",
      roles: ["admin"],
    },
    {
      path: "/dashboard/subjects",
      icon: BookCopy,
      label: "Subjects",
      roles: ["admin"],
    },
     {
      path: "/dashboard/messages",
      icon: MessageSquare,
      label: "Messages",
      roles: ["admin", "teacher", "student"],
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      path: "/dashboard/assignments",
      icon: Home,
      label: "Assignments",
      roles: ["admin", "teacher", "student"],
    },
    {
      path: "/dashboard/terms",
      icon: CalendarClock,
      label: "Terms",
      roles: ["admin"],
    },
    {
      path: "/dashboard/announcements",
      icon: Megaphone,
      label: "Announcements",
      roles: ["admin", "teacher", "student"],
    },
    {
      path: "/dashboard/attendance",
      icon: ClipboardCheck,
      label: "Attendance",
      roles: ["admin", "teacher", "student"],
    },
    {
      path: "/dashboard/permissions",
      icon: NotebookPen,
      label: "Permissions",
      roles: ["admin", "teacher", "student"],
    },
    {
      path: "/dashboard/reports",
      icon: BarChart3,
      label: "Reports",
      roles: ["admin", "teacher"],
    },
    {
      path: "/dashboard/events",
      icon: CalendarDays,
      label: "Events",
      roles: ['admin', 'teacher', 'student'],
    },
    {
      path: "/dashboard/exams",
      icon: FileText,
      label: "Exams & Results",
      roles: ["admin", "teacher", "student"],
      subItems: [
        { path: "/dashboard/exams/setup", label: "Exam Setup", roles: ["admin"] },
        { path: "/dashboard/exams/results", label: "Results Overview", roles: ["admin"] },
        { path: "/dashboard/exams/grading", label: "Grading", roles: ["teacher"] },
        { path: "/dashboard/exams/my-results", label: "My Results", roles: ["student"] },
      ]
    },
    {
      label: "Fees",
      path: "/dashboard/fees",
      icon: DollarSign,
      roles: ["admin", "teacher", "student"],
      subItems: [
        {
          path: "/dashboard/fees/structures",
          label: "Structures",
          roles: ["admin"],
        },
        { path: "/dashboard/fees/assign", label: "Assign Fees", roles: ["admin"] },
        { path: "/dashboard/fees/payments", label: "Payments", roles: ["admin"] },
        {
          path: "/dashboard/fees/class-fees",
          label: "Class Fees",
          roles: ["teacher"],
        },
        { path: "/dashboard/fees/my-fees", label: "My Fees", roles: ["student"] },
      ],
    },
    {
      path: "/dashboard/timetable",
      icon: CalendarDays,
      label: "Timetable",
      roles: ["admin", "teacher", "student"],
      disabled: false,
    },
    {
      path: "/dashboard/summarize",
      icon: Sparkles,
      label: "Document Q&A",
      roles: ["admin", "teacher", "student"],
    },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.subItems) {
      // An item with sub-items should be shown if at least one of its sub-items is visible for the current role
      return item.subItems.some((sub) => sub.roles.includes(role || ""));
    }
    // Regular items are shown if their roles array includes the current role
    return item.roles.includes(role || "");
  });

  return (
    <Sidebar>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const hasVisibleSubItems = item.subItems?.some((sub) =>
              sub.roles.includes(role || "")
            );
            const visibleSubItems = item.subItems?.filter((sub) =>
              sub.roles.includes(role || "")
            );

            return (
              <SidebarMenuItem key={item.path || item.label}>
                {!hasVisibleSubItems ? (
                  <Link href={item.disabled ? "#" : item.path!}>
                    <SidebarMenuButton
                      isActive={!item.disabled && isActive(item.path!, item.exact)}
                      tooltip={item.label}
                      disabled={item.disabled}
                      className={item.disabled ? "opacity-50" : ""}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                       {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuButton>
                  </Link>
                ) : (
                  <SidebarMenuButton
                    isActive={
                      !item.disabled &&
                      !!visibleSubItems?.some((sub) => isActive(sub.path, false))
                    }
                    tooltip={item.label}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                    isSubmenu
                    className={item.disabled ? "cursor-not-allowed opacity-50" : ""}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuButton>
                )}

                {visibleSubItems && visibleSubItems.length > 0 && (
                  <SidebarMenuSub>
                    {visibleSubItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.path}>
                        <Link href={subItem.path}>
                          <SidebarMenuSubButton isActive={isActive(subItem.path)}>
                            <span>{subItem.label}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          })}
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
