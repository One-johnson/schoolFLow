"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function TeacherSuspendedPage(): React.ReactNode {
  return (
    <div className="mx-auto w-full max-w-xl py-12">
      <Card className="border-amber-200/70 bg-amber-500/[0.04] shadow-sm dark:border-amber-900/45 dark:bg-amber-500/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            School access is temporarily unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your school account is currently suspended (for example, due to an expired trial or
            subscription). The teacher portal is locked until the school is reactivated.
          </p>
          <p>Please contact your school administrator or office for assistance.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/teacher/login">Go to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

