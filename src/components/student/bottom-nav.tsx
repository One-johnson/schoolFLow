"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudentMobileChrome } from "@/components/student/student-mobile-chrome-context";

const navItems = [
  { href: "/student", icon: Home, label: "Home" },
  { href: "/student/timetable", icon: Clock, label: "Schedule" },
  { href: "/student/homework", icon: BookOpen, label: "Work" },
  { href: "/student/profile", icon: User, label: "You" },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const { notificationSheetOpen } = useStudentMobileChrome();

  const active = (href: string): boolean => {
    if (href === "/student") return pathname === "/student";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const iconsOnly = notificationSheetOpen;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-blue-200/60 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 dark:border-blue-900/50 transition-[height] duration-200 ease-out",
        iconsOnly ? "pb-[max(0.25rem,env(safe-area-inset-bottom))]" : "",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-lg items-center justify-around px-1 transition-[height] duration-200 ease-out",
          iconsOnly ? "h-12" : "h-16",
        )}
      >
        {navItems.map((item) => {
          const isActive = active(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center rounded-xl px-1 transition-colors duration-200",
                iconsOnly ? "py-1" : "py-1.5",
                isActive
                  ? "bg-blue-100 text-blue-800 shadow-sm dark:bg-blue-950/80 dark:text-blue-200"
                  : "text-muted-foreground hover:text-blue-700 dark:hover:text-blue-300",
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span
                className={cn(
                  "font-semibold tracking-tight transition-all duration-200",
                  iconsOnly ? "sr-only" : "mt-0.5 text-[10px]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
