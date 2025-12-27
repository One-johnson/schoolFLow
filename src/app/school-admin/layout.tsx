'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/school-admin/app-sidebar';
import { DesktopHeader } from '@/components/school-admin/desktop-header';
import { MobileHeader } from '@/components/school-admin/mobile-header';
import { ClientOnly } from '@/components/dashboard/client-only';

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const schoolAdminEmail = localStorage.getItem('schoolAdminEmail');
    if (!schoolAdminEmail) {
      router.push('/login');
    }
  }, [router]);

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
