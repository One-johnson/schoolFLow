'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ClipboardCheck, BarChart3 } from 'lucide-react';

interface AttendanceTrendPoint {
  week: string;
  attendanceRate: number;
  present: number;
  total: number;
}

interface PerformanceByTermPoint {
  term: string;
  percentage: number;
  count: number;
}

interface ParentDashboardChartsProps {
  attendanceTrend: AttendanceTrendPoint[];
  performanceByTerm: PerformanceByTermPoint[];
  loading?: boolean;
}

const CHART_COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  accent: '#8b5cf6',
  amber: '#f59e0b',
};

export function ParentDashboardCharts({
  attendanceTrend,
  performanceByTerm,
  loading = false,
}: ParentDashboardChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Attendance Trend
            </CardTitle>
            <CardDescription>Weekly attendance over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance by Term
            </CardTitle>
            <CardDescription>Average percentage across report cards</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAttendance = attendanceTrend.some((d) => d.total > 0);
  const hasPerformance = performanceByTerm.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Attendance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            Attendance Trend
          </CardTitle>
          <CardDescription>
            Weekly attendance rate over the last 8 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasAttendance ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.split(' - ')[0]}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Attendance']}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.week ?? ''
                  }
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-medium">{d.week}</p>
                          <p className="text-sm text-muted-foreground">
                            {d.attendanceRate}% ({d.present}/{d.total} days)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No attendance data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance by Term */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance by Term
          </CardTitle>
          <CardDescription>
            Average percentage from report cards by term
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPerformance ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={performanceByTerm}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="term"
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Average']}
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-sm font-medium">{d.term}</p>
                          <p className="text-sm text-muted-foreground">
                            {d.percentage}% ({d.count} report card{d.count !== 1 ? 's' : ''})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" name="Average %" radius={[4, 4, 0, 0]}>
                  {performanceByTerm.map((entry, index) => (
                    <Cell
                      key={entry.term}
                      fill={
                        entry.percentage >= 80
                          ? CHART_COLORS.primary
                          : entry.percentage >= 60
                            ? CHART_COLORS.secondary
                            : entry.percentage >= 50
                              ? CHART_COLORS.amber
                              : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              No report cards published yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
