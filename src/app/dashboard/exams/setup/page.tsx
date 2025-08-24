
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExamSetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Setup</CardTitle>
        <CardDescription>
          Create and manage the main examination periods (e.g., Mid-Term, Final Exams).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">Exam setup functionality will be built here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
