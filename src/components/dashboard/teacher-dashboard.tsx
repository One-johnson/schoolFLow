
"use client"

import { useAuth } from "@/hooks/use-auth"
import AttendancePage from "@/app/dashboard/attendance/page";

export function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}!
        </p>
      </div>
      <AttendancePage />
    </div>
  );
}
