
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

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
            <CardTitle>Your Portal</CardTitle>
            <CardDescription>This is your central hub for all your school information.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <p>Here you will be able to see:</p>
                <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                    <li>Your class schedule and timetable.</li>
                    <li>Announcements from your teachers and the school.</li>
                    <li>Your exam results and grades.</li>
                    <li>Your attendance record.</li>
                </ul>
                <Button asChild>
                    <Link href="/dashboard/attendance">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        View My Attendance
                    </Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    