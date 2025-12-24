"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { percent } from "framer-motion";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface SchoolStatusData {
  status: string;
  count: number;
}

interface SchoolStatusChartProps {
  data: SchoolStatusData[];
}

const COLORS = {
  Active: "#10b981",
  Inactive: "#ef4444",
  Trial: "#f59e0b",
  Suspended: "#6b7280",
};

export function SchoolStatusChart({ data }: SchoolStatusChartProps) {
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle>School Status Distribution</CardTitle>
        <CardDescription>
          Breakdown of schools by current status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${percent ? (percent * 100).toFixed(0) : "0"}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status as keyof typeof COLORS] || "#8b5cf6"} 
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
