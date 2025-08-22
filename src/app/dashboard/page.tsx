
"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { Loader2 } from "lucide-react";

type DashboardPageProps = {
  role: 'admin' | 'teacher' | 'student' | null;
}

export default function DashboardPage({ role }: DashboardPageProps) {
    if (!role) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <p className="ml-4">No role assigned or still loading. Please contact support if this persists.</p>
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
                   <p>Invalid role. Please contact support.</p>
                </div>
            );
    }
}
