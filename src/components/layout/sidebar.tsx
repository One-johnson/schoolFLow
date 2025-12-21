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
  TrendingUp,
  Shield,
  Database,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string;
}

// Platform-level navigation for super_admin
const platformNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Schools",
    href: "/dashboard/schools",
    icon: Building2,
  },
  {
    title: "Platform Users",
    href: "/dashboard/platform-users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: Database,
  },
  {
    title: "Platform Settings",
    href: "/dashboard/platform-settings",
    icon: Shield,
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

// School-level navigation for school roles
const schoolNavItems: NavItem[] = [
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

  // Determine which navigation to show based on role
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  
  const visibleNavItems = isSuperAdmin
    ? platformNavItems
    : schoolNavItems.filter((item) => {
        if (!item.requiredRole) return true;
        if (!user) return false;
        return hasPermission(user.role, item.requiredRole as typeof user.role);
      });

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo/School Name */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <div className={cn(
            "rounded-lg p-2 transition-transform group-hover:scale-110",
            isSuperAdmin 
              ? "bg-gradient-to-br from-purple-600 to-pink-600" 
              : "bg-gradient-to-br from-blue-600 to-cyan-600"
          )}>
            {isSuperAdmin ? (
              <Shield className="h-5 w-5 text-white" />
            ) : (
              <GraduationCap className="h-5 w-5 text-white" />
            )}
          </div>
          <span className={cn(
            "text-lg font-bold bg-clip-text text-transparent",
            isSuperAdmin
              ? "bg-gradient-to-r from-purple-600 to-pink-600"
              : "bg-gradient-to-r from-blue-600 to-cyan-600"
          )}>
            SchoolFlow
          </span>
        </Link>
      </div>

      {/* School/Platform Info */}
      {user && (
        <div className={cn(
          "px-6 py-4",
          isSuperAdmin 
            ? "bg-purple-50 dark:bg-purple-950/30" 
            : "bg-blue-50 dark:bg-blue-950/30"
        )}>
          <p className="text-sm font-medium text-foreground">
            {isSuperAdmin ? "Platform Administration" : user.schoolName}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {user.role.replace("_", " ")}
          </p>
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
                    isActive && isSuperAdmin && "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300",
                    isActive && !isSuperAdmin && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
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
