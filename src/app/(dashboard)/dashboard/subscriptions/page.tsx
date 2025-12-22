"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, DollarSign, Users, ArrowUpDown } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatsSkeleton } from "@/components/loading-skeletons";


export const dynamic = 'force-dynamic';

type School = {
  _id: Id<"schools">;
  name: string;
  userCount: number;
  subscriptionPlan: string;
  createdAt: number;
};

export default function SubscriptionsPage() {
  const schools = useQuery(api.platform.getAllSchools);

  const planRevenue: Record<string, number> = {
    free: 0,
    basic: 29,
    premium: 99,
    enterprise: 299,
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      premium: "bg-purple-500",
      enterprise: "bg-amber-500",
    };
    return <Badge className={colors[plan] || "bg-gray-500"}>{plan.toUpperCase()}</Badge>;
  };

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            School Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Current Plan",
      cell: ({ row }) => getPlanBadge(row.getValue("subscriptionPlan") || "free"),
    },
    {
      accessorKey: "userCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Users
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: "monthlyCost",
      header: "Monthly Cost",
      cell: ({ row }) => {
        const plan = row.getValue("subscriptionPlan") as string || "free";
        return `$${planRevenue[plan] || 0}/mo`;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Member Since",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
  ];

  if (schools === undefined) {
    return <StatsSkeleton />;
  }

  const planStats = schools.reduce((acc: Record<string, number>, school) => {
    const plan = school.subscriptionPlan || "free";
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const totalMRR = schools.reduce((sum, school) => {
    const plan = school.subscriptionPlan || "free";
    return sum + (planRevenue[plan] || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage school subscription plans and billing
          </p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMRR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              MRR across all schools
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Plan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planStats.free || 0}</div>
            <p className="text-xs text-muted-foreground">
              Schools on free plan
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(planStats.basic || 0) + (planStats.premium || 0) + (planStats.enterprise || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.length > 0
                ? Math.round(
                    (((planStats.basic || 0) + (planStats.premium || 0) + (planStats.enterprise || 0)) /
                      schools.length) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Free to paid conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Schools by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Free Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{planStats.free || 0}</span>
                  <span className="text-xs text-muted-foreground">schools</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Basic Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{planStats.basic || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ${((planStats.basic || 0) * 29).toLocaleString()}/mo
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Premium Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{planStats.premium || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ${((planStats.premium || 0) * 99).toLocaleString()}/mo
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Enterprise Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{planStats.enterprise || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ${((planStats.enterprise || 0) * 299).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Projected annual revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${totalMRR.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${(totalMRR * 12).toLocaleString()}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Based on current subscription distribution
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schools by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>School Subscriptions</CardTitle>
          <CardDescription>Detailed subscription information for all schools</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={schools.map(s => ({
              ...s,
              subscriptionPlan: s.subscriptionPlan ?? ""
            }))}
            searchKey="name"
            searchPlaceholder="Search schools..."
          
          />
        </CardContent>
      </Card>
    </div>
  );
}
