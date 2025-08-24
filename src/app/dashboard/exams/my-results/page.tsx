
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyResultsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Exam Results</CardTitle>
        <CardDescription>
          View your scores and grades for past examinations.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">Your exam results will be displayed here once published.</p>
        </div>
      </CardContent>
    </Card>
  );
}
