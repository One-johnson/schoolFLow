"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StudentPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Warmer layout for younger learners (e.g. quizzes). */
  variant?: "default" | "playful";
}

export function StudentPageHeader({
  icon: Icon,
  title,
  subtitle,
  variant = "default",
}: StudentPageHeaderProps) {
  const isPlayful = variant === "playful";

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 shadow-sm",
        isPlayful
          ? "border-violet-300 bg-gradient-to-br from-violet-50/90 via-amber-50/50 to-sky-50/70 dark:border-violet-800 dark:from-violet-950/50 dark:via-amber-950/20 dark:to-sky-950/30"
          : "border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/40",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl text-white shadow-md",
            isPlayful ? "h-14 w-14 bg-gradient-to-br from-violet-500 to-amber-500 sm:h-16 sm:w-16" : "h-11 w-11 rounded-xl bg-blue-600 dark:bg-blue-500",
          )}
        >
          <Icon className={cn(isPlayful ? "h-7 w-7 sm:h-8 sm:w-8" : "h-5 w-5")} />
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "font-bold tracking-tight",
              isPlayful
                ? "text-2xl text-violet-950 dark:text-violet-100 sm:text-3xl"
                : "text-xl text-blue-900 dark:text-blue-100 sm:text-2xl",
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "mt-2 text-base leading-relaxed sm:text-lg",
                isPlayful
                  ? "text-violet-900/85 dark:text-violet-100/90"
                  : "text-blue-900/80 dark:text-blue-100/90",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
