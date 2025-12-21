"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { hasPermission, ROLES } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  Building2,
  ClipboardList,
  UserCircle,
  BookMarked,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    requiredRole: ROLES.SCHOOL_ADMIN,
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: GraduationCap,
    requiredRole: ROLES.TEACHER,
  },
  {
    title: "Classes",
    href: "/dashboard/classes",
    icon: BookOpen,
    requiredRole: ROLES.PRINCIPAL,
  },
  {
    title: "Subjects",
    href: "/dashboard/subjects",
    icon: BookMarked,
    requiredRole: ROLES.PRINCIPAL,
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: ClipboardList,
    requiredRole: ROLES.TEACHER,
  },
  {
    title: "Grades",
    href: "/dashboard/grades",
    icon: FileText,
    requiredRole: ROLES.TEACHER,
  },
  {
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: Calendar,
    requiredRole: ROLES.TEACHER,
  },
  {
    title: "Fees",
    href: "/dashboard/fees",
    icon: CreditCard,
    requiredRole: ROLES.STAFF,
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "School Settings",
    href: "/dashboard/school-settings",
    icon: Building2,
    requiredRole: ROLES.SCHOOL_ADMIN,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredRole) return true;
    if (!user) return false;
    return hasPermission(user.role, item.requiredRole as typeof user.role);
  });

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo/School Name */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 p-2 transition-transform group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            SchoolFlow
          </span>
        </Link>
      </div>

      {/* School Info */}
      {user && (
        <div className="px-6 py-4 bg-blue-50 dark:bg-blue-950/30">
          <p className="text-sm font-medium text-foreground">{user.schoolName}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
        </div>
      )}

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
