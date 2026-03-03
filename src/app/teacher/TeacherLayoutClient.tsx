'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { TopHeader } from '@/components/teacher/top-header';
import { BottomNav } from '@/components/teacher/bottom-nav';
import { TeacherAppSidebar } from '@/components/teacher/app-sidebar';
import { TeacherDesktopHeader } from '@/components/teacher/desktop-header';
import { OfflineBanner } from '@/components/teacher/offline-banner';
import { SwRegister } from '@/components/teacher/sw-register';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function TeacherLayoutContent({ children }: { children: React.ReactNode }) {
  const { teacher, loading, authenticated, checkAuth } = useTeacherAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (loading) return;

    if (pathname === '/teacher/login') {
      if (authenticated) {
        router.replace('/teacher');
      }
      return;
    }

    if (!authenticated) {
      router.replace('/teacher/login');
    }
  }, [loading, authenticated, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/teacher/login') {
    return <>{children}</>;
  }

  if (!authenticated || !teacher) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="hidden md:block">
        <TeacherAppSidebar />
      </div>

      <SidebarInset className="w-full">
        <TeacherDesktopHeader />

        <div className="md:hidden">
          <TopHeader teacherId={teacher.id} />
        </div>

        <OfflineBanner />

        <main className="pt-14 pb-20 px-4 md:pt-0 md:pb-0 md:px-8 md:py-8">
          {children}
        </main>

        <div className="md:hidden">
          <BottomNav />
        </div>
      </SidebarInset>

      <SwRegister />
    </SidebarProvider>
  );
}

export function TeacherLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <TeacherLayoutContent>{children}</TeacherLayoutContent>
    </ConvexProvider>
  );
}
