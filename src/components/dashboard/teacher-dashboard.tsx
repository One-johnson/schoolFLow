
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
      <Card>
        <CardHeader>
            <CardTitle>Teacher Portal</CardTitle>
            <CardDescription>This is your central hub for managing your classes and students.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>From here you will be able to:</p>
            <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                <li>Take daily attendance for your assigned classes.</li>
                <li>View your class schedule and timetable.</li>
                <li>Post announcements for your students.</li>
                <li>Manage exam scores and grades.</li>
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
