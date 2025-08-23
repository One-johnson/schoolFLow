
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StructuresPage from "./structures/page";
import AssignPage from "./assign/page";
import PaymentsPage from "./payments/page";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FeesLayout() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If the base /fees page is hit, redirect to the default tab
    if (pathname === '/dashboard/fees') {
      router.replace('/dashboard/fees/structures');
    }
  }, [pathname, router]);

  const getTabValue = () => {
    if (pathname.includes('/assign')) return 'assign';
    if (pathname.includes('/payments')) return 'payments';
    if (pathname.includes('/structures')) return 'structures';
    return 'structures'; // Default tab
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          Manage fee structures, assign fees to students, and track payments.
        </p>
      </div>

      <Tabs value={getTabValue()} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structures" asChild>
            <Link href="/dashboard/fees/structures">Fee Structures</Link>
          </TabsTrigger>
          <TabsTrigger value="assign" asChild>
            <Link href="/dashboard/fees/assign">Assign Fees</Link>
          </TabsTrigger>
          <TabsTrigger value="payments" asChild>
            <Link href="/dashboard/fees/payments">Student Payments</Link>
          </TabsTrigger>
        </TabsList>
         <div className="mt-4">
            <TabsContent value="structures">
              <StructuresPage />
            </TabsContent>
            <TabsContent value="assign">
              <AssignPage />
            </TabsContent>
            <TabsContent value="payments">
              <PaymentsPage />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
