"use client";

import type { LucideIcon } from "lucide-react";

interface StudentPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function StudentPageHeader({ icon: Icon, title, subtitle }: StudentPageHeaderProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/40">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:bg-blue-500">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-100 sm:text-2xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
