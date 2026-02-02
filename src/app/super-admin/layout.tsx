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
    <SidebarProvider>
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <SidebarInset className="w-full">
        <ClientOnly>
          <DesktopHeader />
          <MobileHeader />
        </ClientOnly>
        <main className="p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
