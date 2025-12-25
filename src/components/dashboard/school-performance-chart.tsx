"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, TrendingDown, Users, GraduationCap, Award, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceData {
  studentGrowth: Array<{ month: string; students: number; growth: number }>;
  departmentPerformance: Array<{ department: string; score: number; students: number }>;
  attendanceRate: Array<{ month: string; rate: number; target: number }>;
  teacherMetrics: Array<{
    metric: string;
    score: number;
    target: number;
  }>;
  subjectDistribution: Array<{ subject: string; students: number; fill: string }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

interface SchoolPerformanceChartProps {
  data: PerformanceData;
}

export function SchoolPerformanceChart({ data }: SchoolPerformanceChartProps) {
  const latestGrowth = data.studentGrowth[data.studentGrowth.length - 1];
  const growthTrend = latestGrowth.growth > 0;

  const avgAttendance =
    data.attendanceRate.reduce((sum, item) => sum + item.rate, 0) /
    data.attendanceRate.length;

  const topPerformingDept = data.departmentPerformance.reduce((max, dept) =>
    dept.score > max.score ? dept : max
  );

  return (
    <div className="space-y-4">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Growth</CardTitle>
            {growthTrend ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {growthTrend ? "+" : ""}
              {latestGrowth.growth}%
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Monthly average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Department</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformingDept.department}</div>
            <p className="text-xs text-muted-foreground">
              Score: {topPerformingDept.score}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestGrowth.students}</div>
            <p className="text-xs text-muted-foreground">Active enrollment</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Detailed insights into school performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="growth" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.studentGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Total Students"
                    />
                    <Line
                      type="monotone"
                      dataKey="growth"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Growth %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  Student Count
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  Growth Rate
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#8884d8" name="Performance Score" />
                    <Bar dataKey="students" fill="#82ca9d" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2">
                {data.departmentPerformance.map((dept, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="font-medium">{dept.department}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {dept.students} students
                      </span>
                      <Badge
                        variant={dept.score >= 80 ? "default" : "secondary"}
                        className={
                          dept.score >= 80
                            ? "bg-green-600"
                            : dept.score >= 60
                            ? "bg-yellow-600"
                            : "bg-red-600"
                        }
                      >
                        {dept.score}/100
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.attendanceRate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Actual Attendance"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Average Attendance</p>
                  <p className="text-2xl font-bold">{avgAttendance.toFixed(1)}%</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Target Achievement</p>
                  <p className="text-2xl font-bold">
                    {((avgAttendance / 95) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.teacherMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Current Score"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2">
                {data.teacherMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="font-medium">{metric.metric}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                      <Badge variant="outline">
                        {metric.score}/{metric.target}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.subjectDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="students"
                    >
                      {data.subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2">
                {data.subjectDistribution.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{subject.subject}</span>
                    </div>
                    <Badge variant="outline">{subject.students} students</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
