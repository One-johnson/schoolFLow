'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DesktopHeader } from '@/components/dashboard/desktop-header';
import { MobileHeader } from '@/components/dashboard/mobile-header';
import { ClientOnly } from '@/components/dashboard/client-only';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const { authenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.role !== 'super_admin') {
        router.push('/login');
      }
    }
  }, [authenticated, loading, user, router]);

  if (loading || !authenticated || user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider className="h-svh min-h-0 min-w-0 max-w-full overflow-x-hidden overflow-y-hidden">
      <div className="hidden min-h-0 shrink-0 self-stretch md:block">
        <AppSidebar />
      </div>
      <SidebarInset className="h-full min-h-0 w-full max-w-full min-w-0 overflow-hidden">
        <ClientOnly>
          <div className="shrink-0">
            <DesktopHeader />
            <MobileHeader />
          </div>
        </ClientOnly>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
