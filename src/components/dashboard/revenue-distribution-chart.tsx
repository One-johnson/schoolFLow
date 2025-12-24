"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RevenueDistributionData {
  tier: string;
  revenue: number;
  schools: number;
}

interface RevenueDistributionChartProps {
  data: RevenueDistributionData[];
}

export function RevenueDistributionChart({ data }: RevenueDistributionChartProps) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
        <CardDescription>
          Revenue breakdown by subscription tier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="tier"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              yAxisId="left"
              orientation="left"
              label={{ value: "Revenue ($)", angle: -90, position: "insideLeft" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              yAxisId="right"
              orientation="right"
              label={{ value: "Schools", angle: 90, position: "insideRight" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value, name) => {
                if (typeof value === "number" && name === "Revenue") {
                  return [`$${value.toLocaleString()}`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              name="Revenue"
              yAxisId="left"
            />
            <Bar
              dataKey="schools"
              fill="#06b6d4"
              radius={[8, 8, 0, 0]}
              name="Schools"
              yAxisId="right"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
