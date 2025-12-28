'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/school-admin/app-sidebar';
import { DesktopHeader } from '@/components/school-admin/desktop-header';
import { MobileHeader } from '@/components/school-admin/mobile-header';

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const router = useRouter();
  const { authenticated, loading, user } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Get school admin data
  const schoolAdmins = useQuery(api.schoolAdmins.list);
  const schoolAdmin = schoolAdmins?.find((admin) => admin.email === user?.email);

  // Get school data if admin has created a school
  const schools = useQuery(api.schools.list);
  const school = schools?.find((s) => s.adminId === schoolAdmin?.schoolId);

  useEffect(() => {
    if (!loading && schoolAdmin !== undefined) {
      setCheckingStatus(false);
    }
  }, [loading, schoolAdmin]);

  useEffect(() => {
    if (!loading && !checkingStatus) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.role !== 'school_admin') {
        router.push('/login');
      }
    }
  }, [authenticated, loading, user, router, checkingStatus]);

  // Check school status and redirect if suspended or deleted
  useEffect(() => {
    if (school && !checkingStatus) {
      if (school.status === 'suspended') {
        router.push('/school-admin/school-suspended');
        return;
      }
      // Check if school is marked as deleted (you might have a deleted status)
      // Type-safe check for a possibly deleted school
      if ('deleted' in school && (school as any).deleted === true) {
        router.push('/school-admin/school-deleted');
        return;
      }
    }
  }, [school, router, checkingStatus]);

  if (loading || checkingStatus || !authenticated || user?.role !== 'school_admin') {
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
        <DesktopHeader />
        <MobileHeader />
        <main className="p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
