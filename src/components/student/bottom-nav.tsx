"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/student", icon: Home, label: "Home" },
  { href: "/student/timetable", icon: Clock, label: "Schedule" },
  { href: "/student/homework", icon: BookOpen, label: "Work" },
  { href: "/student/profile", icon: User, label: "You" },
];

export function StudentBottomNav() {
  const pathname = usePathname();

  const active = (href: string): boolean => {
    if (href === "/student") return pathname === "/student";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-200/60 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 dark:border-blue-900/50">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = active(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors duration-200",
                isActive
                  ? "bg-blue-100 text-blue-800 shadow-sm dark:bg-blue-950/80 dark:text-blue-200"
                  : "text-muted-foreground hover:text-blue-700 dark:hover:text-blue-300",
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="mt-0.5 text-[10px] font-semibold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
