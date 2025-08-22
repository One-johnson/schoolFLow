
"use client";

import type { ReactNode } from "react";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || !role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Verifying authentication...</p>
      </div>
    );
  }

  // Pass role to children
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { role });
    }
    return child;
  });


  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <Sidebar>
          <DashboardSidebar role={role} />
        </Sidebar>
        <SidebarInset>
          <DashboardHeader />
          <main className="p-4 lg:p-6">{childrenWithProps}</main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
