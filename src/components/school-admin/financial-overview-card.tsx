'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { JSX } from 'react';

interface FinancialOverviewCardProps {
  schoolId: string;
}

export function FinancialOverviewCard({ schoolId }: FinancialOverviewCardProps): React.JSX.Element {
  const financialData = useQuery(api.dashboard.getFinancialSummary, { schoolId });

  if (!financialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
          <CardDescription>Fee collection and outstanding payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Overview
        </CardTitle>
        <CardDescription>Fee collection and outstanding payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collection Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Collected This Month</span>
            <span className="font-bold text-lg text-green-600">
              ${financialData.thisMonthCollected.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Collected This Year</span>
            <span className="font-bold text-lg">
              ${financialData.thisYearCollected.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Outstanding Payments</span>
            <span className="font-bold text-lg text-orange-600">
              ${financialData.outstandingTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <Separator />

        {/* Collection Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Collection Rate</span>
            <span className="text-sm font-bold">{financialData.collectionRate}%</span>
          </div>
          <Progress value={financialData.collectionRate} className="h-2" />
        </div>

        <Separator />

        {/* Top Debtors */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Outstanding Payments
          </h4>
          {financialData.topDebtors.length > 0 ? (
            <div className="space-y-2">
              {financialData.topDebtors.map((debtor) => (
                <div
                  key={debtor.studentId}
                  className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{debtor.studentName}</p>
                    <p className="text-xs text-muted-foreground">{debtor.studentClass}</p>
                  </div>
                  <span className="font-bold text-orange-600 ml-2">
                    ${debtor.outstandingAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No outstanding payments
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <Button asChild className="w-full">
            <Link href="/school-admin/fees">
              Record Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/school-admin/fees">
              View All Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
