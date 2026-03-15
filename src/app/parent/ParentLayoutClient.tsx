'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useParentAuth } from '@/hooks/useParentAuth';
import { ParentTopHeader } from '@/components/parent/top-header';
import { ParentBottomNav } from '@/components/parent/bottom-nav';
import { ParentAppSidebar } from '@/components/parent/app-sidebar';
import { ParentDesktopHeader } from '@/components/parent/desktop-header';
import { OfflineBanner } from '@/components/teacher/offline-banner';
import { SwRegister } from '@/components/teacher/sw-register';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { ParentOnboardingSheet } from '@/components/parent/parent-onboarding-sheet';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ParentLayoutContent({ children }: { children: React.ReactNode }) {
  const { parent, loading, authenticated, checkAuth } = useParentAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const parentRecord = useQuery(
    api.parents.getParentById,
    parent?.id
      ? { parentId: parent.id as import('@/../convex/_generated/dataModel').Id<'parents'> }
      : 'skip',
  );
  const markOnboardingSeen = useMutation(api.parents.markOnboardingSeen);

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

  useEffect(() => {
    if (!parentRecord) return;
    if (parentRecord.hasSeenOnboarding !== true) {
      setShowOnboarding(true);
    }
  }, [parentRecord]);

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

  const handleCompleteOnboarding = async () => {
    if (!parent?.id) {
      setShowOnboarding(false);
      return;
    }
    try {
      await markOnboardingSeen({
        parentId: parent.id as import('@/../convex/_generated/dataModel').Id<'parents'>,
      });
    } catch (error) {
      console.error('Failed to mark parent onboarding as seen:', error);
    } finally {
      setShowOnboarding(false);
    }
  };

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

        <ParentOnboardingSheet
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
          onComplete={handleCompleteOnboarding}
        />
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

