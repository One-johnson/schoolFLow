"use client";

import { usePathname } from "next/navigation";
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
} from "lucide-react";

export function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    {
      path: "/dashboard",
      icon: LayoutGrid,
      label: "Dashboard",
    },
    {
      path: "/dashboard/students",
      icon: Users,
      label: "Students",
    },
    {
      path: "/dashboard/teachers",
      icon: UserCheck,
      label: "Teachers",
    },
    {
      path: "/dashboard/announcements",
      icon: Megaphone,
      label: "Announcements",
    },
    {
      path: "/dashboard/summarize",
      icon: Sparkles,
      label: "AI Summarizer",
    },
  ];

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
              <Link href={item.path}>
                <SidebarMenuButton
                  isActive={isActive(item.path)}
                  tooltip={item.label}
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
             <Link href="/">
              <SidebarMenuButton tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
