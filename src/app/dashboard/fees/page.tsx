"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FeesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getTabValue = () => {
    if (pathname.includes('/assign')) return 'assign';
    if (pathname.includes('/payments')) return 'payments';
    return 'structures';
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
            {children}
        </div>
      </Tabs>
    </div>
  );
}
