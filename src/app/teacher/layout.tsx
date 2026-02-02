'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { TopHeader } from '@/components/teacher/top-header';
import { BottomNav } from '@/components/teacher/bottom-nav';
import { OfflineBanner } from '@/components/teacher/offline-banner';
import { SwRegister } from '@/components/teacher/sw-register';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  // Authenticated - render full shell
  return (
    <div className="min-h-screen bg-background">
      <TopHeader teacherId={teacher.id} />
      <OfflineBanner />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
      <SwRegister />
    </div>
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
