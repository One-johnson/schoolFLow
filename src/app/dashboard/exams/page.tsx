
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import ExamSetupPage from "./setup/page";
import GradingPage from "./grading/page";
import MyResultsPage from "./my-results/page";
import { FileText } from "lucide-react";

export default function ExamsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    // Redirect to the appropriate default tab based on role
    if (pathname === '/dashboard/exams' || pathname === '/dashboard/exams/') {
      if (role === 'admin') {
        router.replace('/dashboard/exams/setup');
      } else if (role === 'teacher') {
        router.replace('/dashboard/exams/grading');
      } else if (role === 'student') {
        router.replace('/dashboard/exams/my-results');
      }
    }
  }, [pathname, router, role]);

  const getTabValue = () => {
    if (pathname.includes('/setup')) return 'setup';
    if (pathname.includes('/grading')) return 'grading';
    if (pathname.includes('/my-results')) return 'my-results';
    
    // Default tab logic based on role
    if (role === 'student') return 'my-results';
    if (role === 'teacher') return 'grading';
    return 'setup'; 
  }
  
  const currentTab = getTabValue();
  
  const getGridColsClass = () => {
    if (role === 'admin') return 'grid-cols-1'; // Initially just one tab for admin
    if (role === 'teacher') return 'grid-cols-1';
    if (role === 'student') return 'grid-cols-1';
    return 'grid-cols-1';
  }

  // Render nothing until role is determined and redirection has a chance to occur
  if (!role || (pathname === '/dashboard/exams' && currentTab)) {
      return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Examinations</h1>
        <p className="text-muted-foreground">
          {role === 'admin' && "Manage examination setup, scheduling, and results."}
          {role === 'teacher' && "Manage grading and view exam schedules."}
          {role === 'student' && "View your exam schedule and results."}
        </p>
      </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList className={`grid w-full ${getGridColsClass()}`}>
          {role === 'admin' && (
            <>
              <TabsTrigger value="setup" asChild>
                <Link href="/dashboard/exams/setup">Exam Setup</Link>
              </TabsTrigger>
              {/* Other admin tabs will be added here */}
            </>
          )}
          {role === 'teacher' && (
            <TabsTrigger value="grading" asChild>
              <Link href="/dashboard/exams/grading">Grading</Link>
            </TabsTrigger>
          )}
          {role === 'student' && (
            <TabsTrigger value="my-results" asChild>
                <Link href="/dashboard/exams/my-results">My Results</Link>
            </TabsTrigger>
          )}
        </TabsList>
         <div className="mt-4">
            {role === 'admin' && (
              <>
                <TabsContent value="setup">
                  <ExamSetupPage />
                </TabsContent>
              </>
            )}
             {role === 'teacher' && (
               <TabsContent value="grading">
                  <GradingPage />
                </TabsContent>
            )}
            {role === 'student' && (
               <TabsContent value="my-results">
                  <MyResultsPage />
                </TabsContent>
            )}
        </div>
      </Tabs>
    </div>
  );
}
