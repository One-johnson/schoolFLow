
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import StructuresPage from "./structures/page";
import AssignPage from "./assign/page";
import PaymentsPage from "./payments/page";
import MyFeesPage from "./my-fees/page";
import ClassFeesPage from "./class-fees/page"; // Import the new page
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function FeesLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    // Redirect to the appropriate default tab based on role
    if (pathname === '/dashboard/fees' || pathname === '/dashboard/fees/') {
      if (role === 'admin') {
        router.replace('/dashboard/fees/structures');
      } else if (role === 'teacher') {
        router.replace('/dashboard/fees/class-fees');
      } else if (role === 'student') {
        router.replace('/dashboard/fees/my-fees');
      }
    }
  }, [pathname, router, role]);

  const getTabValue = () => {
    if (pathname.includes('/assign')) return 'assign';
    if (pathname.includes('/payments')) return 'payments';
    if (pathname.includes('/my-fees')) return 'my-fees';
    if (pathname.includes('/class-fees')) return 'class-fees';
    if (pathname.includes('/structures')) return 'structures';
    
    // Default tab logic based on role
    if (role === 'student') return 'my-fees';
    if (role === 'teacher') return 'class-fees';
    return 'structures'; 
  }
  
  const currentTab = getTabValue();
  
  const getGridColsClass = () => {
    if (role === 'admin') return 'grid-cols-3';
    if (role === 'teacher') return 'grid-cols-1';
    if (role === 'student') return 'grid-cols-1';
    return 'grid-cols-1';
  }

  // Render nothing until role is determined and redirection has a chance to occur
  if (!role || (pathname === '/dashboard/fees' && currentTab)) {
      return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          {role === 'admin' && "Manage fee structures, assign fees to students, and track payments."}
          {role === 'teacher' && "Monitor fee payments for students in your classes."}
          {role === 'student' && "View your fee statements and payment history."}
        </p>
      </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList className={`grid w-full ${getGridColsClass()}`}>
          {role === 'admin' && (
            <>
              <TabsTrigger value="structures" asChild>
                <Link href="/dashboard/fees/structures">Fee Structures</Link>
              </TabsTrigger>
              <TabsTrigger value="assign" asChild>
                <Link href="/dashboard/fees/assign">Assign Fees</Link>
              </TabsTrigger>
              <TabsTrigger value="payments" asChild>
                <Link href="/dashboard/fees/payments">Student Payments</Link>
              </TabsTrigger>
            </>
          )}
          {role === 'teacher' && (
            <TabsTrigger value="class-fees" asChild>
              <Link href="/dashboard/fees/class-fees">Class Fees</Link>
            </TabsTrigger>
          )}
          {role === 'student' && (
            <TabsTrigger value="my-fees" asChild>
                <Link href="/dashboard/fees/my-fees">My Fees</Link>
            </TabsTrigger>
          )}
        </TabsList>
         <div className="mt-4">
            {role === 'admin' && (
              <>
                <TabsContent value="structures">
                  <StructuresPage />
                </TabsContent>
                <TabsContent value="assign">
                  <AssignPage />
                </TabsContent>
                <TabsContent value="payments">
                  <PaymentsPage />
                </TabsContent>
              </>
            )}
             {role === 'teacher' && (
               <TabsContent value="class-fees">
                  <ClassFeesPage />
                </TabsContent>
            )}
            {role === 'student' && (
               <TabsContent value="my-fees">
                  <MyFeesPage />
                </TabsContent>
            )}
        </div>
      </Tabs>
    </div>
  );
}
