"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentTopHeader } from "@/components/student/top-header";
import { StudentBottomNav } from "@/components/student/bottom-nav";
import { StudentMobileChromeProvider } from "@/components/student/student-mobile-chrome-context";
import { StudentAppSidebar } from "@/components/student/app-sidebar";
import { StudentDesktopHeader } from "@/components/student/desktop-header";
import { OfflineBanner } from "@/components/teacher/offline-banner";
import { SwRegister } from "@/components/teacher/sw-register";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { student, loading, authenticated, checkAuth } = useStudentAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (!mounted || loading) return;

    if (pathname === "/student/login") {
      if (authenticated) {
        router.replace("/student");
      }
      return;
    }

    if (!authenticated) {
      router.replace("/student/login");
    }
  }, [mounted, loading, authenticated, pathname, router]);

  const isLoginRoute = pathname === "/student/login";

  // Before mount, match server output to client first paint (avoids hydration mismatch).
  if (!mounted) {
    if (isLoginRoute) {
      return <>{children}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-blue-600"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50/50 dark:bg-blue-950/20">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 animate-pulse rounded-full bg-blue-400/20 blur-md dark:bg-blue-500/15" />
            <div className="relative h-16 w-16 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Loading your space…</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !student) {
    return null;
  }

  return (
    <SidebarProvider>
      <StudentAppSidebar />

      <SidebarInset className="min-h-svh w-full bg-blue-50/40 dark:bg-blue-950/15">
        <StudentMobileChromeProvider>
          <StudentDesktopHeader />

          <div className="md:hidden">
            <StudentTopHeader subtitle={student.className} />
          </div>

          <OfflineBanner />

          <main className="px-4 pb-24 pt-14 md:px-8 md:py-10">
            {children}
          </main>

          <div className="md:hidden">
            <StudentBottomNav />
          </div>
        </StudentMobileChromeProvider>
      </SidebarInset>

      <SwRegister />
    </SidebarProvider>
  );
}

export function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </ConvexProvider>
  );
}
