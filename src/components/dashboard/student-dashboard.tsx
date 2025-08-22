
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
       <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName}!
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Under Construction</CardTitle>
            <CardDescription>This student dashboard is still being built. Check back soon for updates on your classes, grades, and more!</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Here you will be able to see:</p>
            <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                <li>Your class schedule and timetable.</li>
                <li>Announcements from your teachers and the school.</li>
                <li>Your exam results and grades.</li>
                <li>Your attendance record.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
