'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Award, 
  BookOpen, 
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsData {
  examId: string;
  examName: string;
  examCode: string;
  overall: {
    totalStudents: number;
    totalMarksEntered: number;
    averagePercentage: number;
    passedCount: number;
    failedCount: number;
    absentCount: number;
    passRate: number;
  };
  gradeDistribution: Array<{ grade: number; count: number }>;
  subjectStats: Array<{
    subjectName: string;
    averagePercentage: number;
    studentCount: number;
    passCount: number;
    failCount: number;
    highestScore: number;
    lowestScore: number;
  }>;
  classStats: Array<{
    className: string;
    studentCount: number;
    averagePercentage: number;
    passCount: number;
    failCount: number;
    absentCount: number;
    topScore: number;
  }>;
  topStudents: Array<{
    studentName: string;
    className: string;
    percentage: number;
    subjectCount: number;
  }>;
  topClasses: Array<{
    className: string;
    averagePercentage: number;
    passCount: number;
    failCount: number;
  }>;
}

interface PerformanceAnalyticsDashboardProps {
  data: AnalyticsData;
}

const GRADE_COLORS = [
  '#22c55e', // Grade 1 - Green
  '#84cc16', // Grade 2 - Lime
  '#eab308', // Grade 3 - Yellow
  '#f59e0b', // Grade 4 - Amber
  '#f97316', // Grade 5 - Orange
  '#ef4444', // Grade 6 - Red
  '#dc2626', // Grade 7 - Dark Red
  '#b91c1c', // Grade 8 - Darker Red
  '#7f1d1d', // Grade 9 - Darkest Red
];

const GRADE_LABELS: Record<number, string> = {
  1: 'Excellent',
  2: 'Very Good',
  3: 'Good',
  4: 'High Average',
  5: 'Average',
  6: 'Low Average',
  7: 'Pass',
  8: 'Pass',
  9: 'Fail',
};

export function PerformanceAnalyticsDashboard({ data }: PerformanceAnalyticsDashboardProps) {
  const chartConfig = {
    percentage: {
      label: 'Percentage',
      color: '#3b82f6',
    },
    students: {
      label: 'Students',
      color: '#10b981',
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.averagePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.overall.totalStudents} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            {data.overall.passRate >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overall.passRate.toFixed(1)}%
            </div>
            <Progress value={data.overall.passRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {data.overall.passedCount} passed, {data.overall.failedCount} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overall.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {data.overall.absentCount} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Covered</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.subjectStats.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.overall.totalMarksEntered} marks entered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="classes">Class Performance</TabsTrigger>
          <TabsTrigger value="distribution">Grade Distribution</TabsTrigger>
          <TabsTrigger value="top">Top Performers</TabsTrigger>
        </TabsList>

        {/* Subject Performance Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Average Scores by Subject
              </CardTitle>
              <CardDescription>
                Performance breakdown across all subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subjectName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="averagePercentage" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown of each subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.subjectStats.map((subject, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{subject.subjectName}</h4>
                      <Badge variant={subject.averagePercentage >= 50 ? 'default' : 'destructive'}>
                        {subject.averagePercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Students</p>
                        <p className="font-medium">{subject.studentCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passed</p>
                        <p className="font-medium text-green-600">{subject.passCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-medium text-red-600">{subject.failCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pass Rate</p>
                        <p className="font-medium">
                          {((subject.passCount / subject.studentCount) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Performance Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Class Performance Comparison
              </CardTitle>
              <CardDescription>
                Average performance across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.classStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="averagePercentage" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Class Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.classStats.map((classData, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{classData.className}</CardTitle>
                  <CardDescription>
                    {classData.studentCount} students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Average Score</span>
                        <span className="text-sm font-bold">
                          {classData.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={classData.averagePercentage} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-muted-foreground">Passed</p>
                        <p className="font-bold text-green-600">{classData.passCount}</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-bold text-red-600">{classData.failCount}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-muted-foreground">Absent</p>
                        <p className="font-bold">{classData.absentCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Grade Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Grade Distribution
                </CardTitle>
                <CardDescription>
                  How students are distributed across grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.gradeDistribution}
                        dataKey="count"
                        nameKey="grade"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `Grade ${entry.grade}: ${entry.count}`}
                      >
                        {data.gradeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={GRADE_COLORS[entry.grade - 1]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Breakdown</CardTitle>
                <CardDescription>
                  Number of students in each grade category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.gradeDistribution.map((grade) => (
                    <div key={grade.grade} className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: GRADE_COLORS[grade.grade - 1] }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            Grade {grade.grade} - {GRADE_LABELS[grade.grade]}
                          </span>
                          <span className="text-sm font-bold">{grade.count}</span>
                        </div>
                        <Progress 
                          value={(grade.count / data.overall.totalStudents) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="top" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Performing Students
                </CardTitle>
                <CardDescription>
                  Best overall performance across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topStudents.map((student, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.className} • {student.subjectCount} subjects
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{student.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Best Performing Classes
                </CardTitle>
                <CardDescription>
                  Classes with highest average scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topClasses.map((classData, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{classData.className}</p>
                        <p className="text-sm text-muted-foreground">
                          {classData.passCount} passed • {classData.failCount} failed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {classData.averagePercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
