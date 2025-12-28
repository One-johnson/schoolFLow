'use client';

import { JSX, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/school-admin/app-sidebar';
import { DesktopHeader } from '@/components/school-admin/desktop-header';
import { MobileHeader } from '@/components/school-admin/mobile-header';
import { ClientOnly } from '@/components/dashboard/client-only';
import { Loader2 } from 'lucide-react';

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Get email from localStorage on mount
  useEffect(() => {
    const schoolAdminEmail = localStorage.getItem('schoolAdminEmail');
    if (!schoolAdminEmail) {
      router.push('/login');
    } else {
      setEmail(schoolAdminEmail);
    }
    setIsChecking(false);
  }, [router]);

  // Query admin data to check status
  const admin = useQuery(
    api.schoolAdmins.getByEmail,
    email ? { email } : 'skip'
  );

  // Query school data to check school status
  const school = useQuery(
    api.schools.getByAdminId,
    admin && admin.schoolId ? { adminId: admin.schoolId } : 'skip'
  );

  // Check account status and enforce access control
  useEffect(() => {
    if (isChecking || !email) return;

    // Skip check on access-blocked and school status pages
    if (
      pathname === '/school-admin/access-blocked' ||
      pathname === '/school-admin/school-suspended' ||
      pathname === '/school-admin/school-deleted'
    ) {
      return;
    }

    // If query is still loading, wait
    if (admin === undefined) return;

    // Account doesn't exist (deleted)
    if (admin === null) {
      router.push('/school-admin/access-blocked?status=deleted&reason=Your account has been deleted from the system.');
      return;
    }

    // Account is suspended
    if (admin.status === 'suspended') {
      router.push('/school-admin/access-blocked?status=suspended&reason=Your account has been suspended. Please contact support for assistance.');
      return;
    }

    // Account is inactive
    if (admin.status === 'inactive') {
      router.push('/school-admin/access-blocked?status=inactive&reason=Your account has been deactivated. Please contact support to reactivate your account.');
      return;
    }

    // Check school status if school query is ready
    if (school !== undefined && school !== null) {
      // School is suspended
      if (school.status === 'suspended') {
        router.push('/school-admin/school-suspended');
        return;
      }
    }

    // If admin has created school but school doesn't exist (deleted)
    if (admin.hasCreatedSchool && school === null && school !== undefined) {
      router.push('/school-admin/school-deleted');
      return;
    }
  }, [admin, school, email, router, pathname, isChecking]);

  // Show loader while checking authentication
  if (isChecking || !email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show loader while fetching admin data
  if (admin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If on status pages, render children without layout
  if (
    pathname === '/school-admin/access-blocked' ||
    pathname === '/school-admin/school-suspended' ||
    pathname === '/school-admin/school-deleted'
  ) {
    return <>{children}</>;
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
