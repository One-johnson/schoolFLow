"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface StudentEnrollmentData {
  month: string;
  enrolled: number;
  graduated: number;
}

interface StudentEnrollmentChartProps {
  data: StudentEnrollmentData[];
}

export function StudentEnrollmentChart({ data }: StudentEnrollmentChartProps) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>Student Enrollment Trends</CardTitle>
        <CardDescription>
          Monthly enrollment and graduation statistics
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
              dataKey="month"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar
              dataKey="enrolled"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              name="Enrolled"
            />
            <Bar
              dataKey="graduated"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              name="Graduated"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
