"use client";

import { GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { StudentNotificationBell } from "@/components/student/student-notification-bell";

interface StudentTopHeaderProps {
  /** Shown next to the logo (e.g. class name). */
  subtitle?: string;
}

export function StudentTopHeader({ subtitle = "SchoolFlow" }: StudentTopHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-blue-200/60 bg-background/90 backdrop-blur-xl dark:border-blue-900/50">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between pl-2 pr-2">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-blue-800 dark:text-blue-300"
            onClick={() => toggleSidebar()}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm dark:bg-blue-500">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="truncate text-sm font-bold text-blue-900 dark:text-blue-100">{subtitle}</span>
        </div>
        <StudentNotificationBell />
      </div>
    </header>
  );
}
