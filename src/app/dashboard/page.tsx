
"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { role } = useAuth();
    
    if (!role) {
      // This can briefly show while the useAuth hook is initializing
       return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="ml-4">Loading dashboard...</p>
            </div>
        );
    }
    
    switch (role) {
        case 'admin':
            return <AdminDashboard />;
        case 'teacher':
            return <TeacherDashboard />;
        case 'student':
            return <StudentDashboard />;
        default:
             return (
                <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                   <p>Invalid role detected. Please contact support.</p>
                </div>
            );
    }
}
