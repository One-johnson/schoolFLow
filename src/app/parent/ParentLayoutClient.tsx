'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useParentAuth } from '@/hooks/useParentAuth';
import { ParentTopHeader } from '@/components/parent/top-header';
import { ParentBottomNav } from '@/components/parent/bottom-nav';
import { ParentAppSidebar } from '@/components/parent/app-sidebar';
import { ParentDesktopHeader } from '@/components/parent/desktop-header';
import { OfflineBanner } from '@/components/teacher/offline-banner';
import { SwRegister } from '@/components/teacher/sw-register';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ParentLayoutContent({ children }: { children: React.ReactNode }) {
  const { parent, loading, authenticated, checkAuth } = useParentAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (loading) return;

    if (pathname === '/parent/login' || pathname === '/parent/register') {
      if (authenticated) {
        router.replace('/parent');
      }
      return;
    }

    if (!authenticated) {
      router.replace('/parent/login');
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

  if (pathname === '/parent/login' || pathname === '/parent/register') {
    return <>{children}</>;
  }

  if (!authenticated || !parent) {
    return null;
  }

  return (
    <SidebarProvider>
      <ParentAppSidebar />

      <SidebarInset className="w-full">
        <ParentDesktopHeader />

        <div className="md:hidden">
          <ParentTopHeader parentId={parent.id} />
        </div>

        <OfflineBanner />

        <main className="pt-14 pb-20 px-4 md:pt-0 md:pb-0 md:px-8 md:py-8">
          {children}
        </main>

        <div className="md:hidden">
          <ParentBottomNav />
        </div>
      </SidebarInset>

      <SwRegister />
    </SidebarProvider>
  );
}

export function ParentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </ConvexProvider>
  );
}
