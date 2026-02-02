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
  const { teacher, loading, authenticated } = useTeacherAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) return;

    // Allow access to login page without authentication
    if (pathname === '/teacher/login') {
      if (authenticated) {
        router.replace('/teacher');
      }
      return;
    }

    // Redirect to login if not authenticated
    if (!authenticated) {
      router.replace('/teacher/login');
    }
  }, [loading, authenticated, pathname, router]);

  // Show loading state
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

  // Login page - render without shell
  if (pathname === '/teacher/login') {
    return <>{children}</>;
  }

  // Not authenticated - show nothing while redirecting
  if (!authenticated || !teacher) {
    return null;
  }

  // Authenticated - render responsive shell
  return (
    <SidebarProvider>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <TeacherAppSidebar />
      </div>

      <SidebarInset className="w-full">
        {/* Desktop Header - hidden on mobile */}
        <TeacherDesktopHeader />

        {/* Mobile Header - hidden on desktop */}
        <div className="md:hidden">
          <TopHeader teacherId={teacher.id} />
        </div>

        <OfflineBanner />

        {/* Main content - different padding for mobile vs desktop */}
        <main className="pt-14 pb-20 px-4 max-w-lg mx-auto md:pt-0 md:pb-0 md:px-8 md:max-w-none md:py-8">
          {children}
        </main>

        {/* Mobile Bottom Nav - hidden on desktop */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </SidebarInset>

      <SwRegister />
    </SidebarProvider>
  );
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SchoolFlow Teacher" />
      </head>
      <TeacherLayoutContent>{children}</TeacherLayoutContent>
    </ConvexProvider>
  );
}
