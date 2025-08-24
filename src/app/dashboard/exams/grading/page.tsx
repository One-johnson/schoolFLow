
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GradingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Grading</CardTitle>
        <CardDescription>
          Enter and manage scores for students in your assigned subjects.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">Grading portal functionality will be built here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
