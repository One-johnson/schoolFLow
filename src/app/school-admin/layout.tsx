'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
}): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, loading, user } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Pages a suspended/inactive admin is still allowed to visit
  const ALLOWED_WHEN_SUSPENDED = [
    '/school-admin/access-blocked',
    '/school-admin/school-suspended',
    '/school-admin/school-deleted',
    '/school-admin/subscription',
    '/school-admin/payment',
  ];

  // Get school admin data using more efficient query
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  // Get school data if admin has created a school
  const schools = useQuery(api.schools.list);
  const school = schools?.find((s) => s.adminId === schoolAdmin?.schoolId);

  useEffect(() => {
    if (!loading && schoolAdmin !== undefined) {
       
      setCheckingStatus(false);
    }
  }, [loading, schoolAdmin]);

  // Only perform auth checks after both loading states are complete
  useEffect(() => {
    // Don't redirect while still loading
    if (loading || checkingStatus) {
      return;
    }

    // Now we've finished loading, check authentication
    if (!authenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user has correct role
    if (user?.role !== 'school_admin') {
      console.log('User is not school admin, redirecting to login');
      router.push('/login');
      return;
    }
  }, [authenticated, loading, user, router, checkingStatus]);

  // Check school status and redirect if suspended or deleted
  useEffect(() => {
    if (school && !checkingStatus) {
      if (school.status === 'suspended') {
        router.push('/school-admin/school-suspended');
        return;
      }
      // Check if school is marked as deleted (also handles legacy "deleted" property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((school as any).deleted === true) {
        router.push('/school-admin/school-deleted');
        return;
      }
    }
  }, [school, router, checkingStatus]);

  // Block suspended or inactive admins from accessing protected pages.
  // This is the primary guard — it catches trial expiry even when no school has been created yet.
  useEffect(() => {
    if (checkingStatus || !schoolAdmin) return;

    if (
      (schoolAdmin.status === 'suspended' || schoolAdmin.status === 'inactive') &&
      !ALLOWED_WHEN_SUSPENDED.includes(pathname)
    ) {
      const reason =
        schoolAdmin.status === 'suspended'
          ? 'Your trial has expired and your account has been suspended. Please subscribe to continue.'
          : 'Your account has been deactivated.';
      router.push(
        `/school-admin/access-blocked?status=${schoolAdmin.status}&reason=${encodeURIComponent(reason)}`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolAdmin, checkingStatus, pathname, router]);

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
