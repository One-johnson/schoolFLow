"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertOctagon, CreditCard, LifeBuoy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolAdminHidesSubscriptionUi } from "@/hooks/useSchoolAdminHidesSubscriptionUi";

export default function SchoolAdminSuspendedPage() {
  const { user } = useAuth();
  const hidesSubscriptionUi = useSchoolAdminHidesSubscriptionUi(user?.userId);

  return (
    <div className="mx-auto w-full max-w-xl py-12">
      <Card className="border-red-200/70 bg-red-500/[0.04] shadow-sm dark:border-red-900/45 dark:bg-red-500/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-700 dark:text-red-400" />
            Admin portal locked
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {hidesSubscriptionUi
              ? "Your school account is currently suspended. The admin portal is locked until access is restored."
              : "Your school account is currently suspended (for example, due to an expired trial or subscription). The admin portal is locked until a valid subscription is active again."}
          </p>
          <div className="flex flex-wrap gap-2">
            {!hidesSubscriptionUi && (
              <Button asChild className="gap-2">
                <Link href="/school-admin/subscription">
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="gap-2">
              <Link href="mailto:support@schoolflow.com">
                <LifeBuoy className="h-4 w-4" />
                Contact support
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
