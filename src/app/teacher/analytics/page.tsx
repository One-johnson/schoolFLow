'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  AlertTriangle,
  BookOpen,
  Target,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function AnalyticsPage() {
  const { teacher } = useTeacherAuth();
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const classId = teacher?.classIds?.[0];

  // Queries
  const exams = useQuery(
    api.exams.getExamsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const students = useQuery(
    api.students.getStudentsByClassId,
    classId ? { classId } : 'skip'
  );

  const distribution = useQuery(
    api.marks.getClassPerformanceDistribution,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          examId: selectedExamId ? (selectedExamId as Id<'exams'>) : undefined,
        }
      : 'skip'
  );

  const subjectPerformance = useQuery(
    api.marks.getSubjectPerformance,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          examId: selectedExamId ? (selectedExamId as Id<'exams'>) : undefined,
        }
      : 'skip'
  );

  const studentTrends = useQuery(
    api.marks.getStudentPerformanceTrends,
    teacher && selectedStudentId
      ? {
          schoolId: teacher.schoolId,
          studentId: selectedStudentId,
        }
      : 'skip'
  );

  const classSummary = useQuery(
    api.marks.getClassGradeSummary,
    teacher && classId
      ? {
          schoolId: teacher.schoolId,
          classId,
          examId: selectedExamId ? (selectedExamId as Id<'exams'>) : undefined,
        }
      : 'skip'
  );

  const activeExams = exams?.filter(
    (e) => e.status === 'scheduled' || e.status === 'ongoing' || e.status === 'completed' || e.status === 'published'
  );

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Performance Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track and analyze student performance for {teacher.classNames?.join(', ')}
        </p>
      </div>

      {/* Exam Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Exam:</label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="w-62.5">
                <SelectValue placeholder="All exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Exams</SelectItem>
                {activeExams?.map((exam) => (
                  <SelectItem key={exam._id} value={exam._id}>
                    {exam.examName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{distribution?.totalStudents ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getPerformanceColor(distribution?.classAverage ?? 0)}`}>
                    {distribution ? Math.round(distribution.classAverage) : '-'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Class Average</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {distribution ? Math.round(distribution.highestScore) : '-'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Highest Score</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {distribution ? Math.round(distribution.lowestScore) : '-'}%
                  </p>
                  <p className="text-xs text-muted-foreground">Lowest Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!distribution ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pie Chart */}
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excellent (80-100%)', value: distribution.distribution.excellent, color: '#22c55e' },
                          { name: 'Very Good (70-79%)', value: distribution.distribution.veryGood, color: '#3b82f6' },
                          { name: 'Good (60-69%)', value: distribution.distribution.good, color: '#06b6d4' },
                          { name: 'Average (50-59%)', value: distribution.distribution.average, color: '#f59e0b' },
                          { name: 'Below Avg (40-49%)', value: distribution.distribution.belowAverage, color: '#f97316' },
                          { name: 'Poor (<40%)', value: distribution.distribution.poor, color: '#ef4444' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({  value }) => `${value}`}
                        labelLine={false}
                      >
                        {[
                          { name: 'Excellent', value: distribution.distribution.excellent, color: '#22c55e' },
                          { name: 'Very Good', value: distribution.distribution.veryGood, color: '#3b82f6' },
                          { name: 'Good', value: distribution.distribution.good, color: '#06b6d4' },
                          { name: 'Average', value: distribution.distribution.average, color: '#f59e0b' },
                          { name: 'Below Avg', value: distribution.distribution.belowAverage, color: '#f97316' },
                          { name: 'Poor', value: distribution.distribution.poor, color: '#ef4444' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} students`, '']} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Excellent: {distribution.distribution.excellent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Very Good: {distribution.distribution.veryGood}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span>Good: {distribution.distribution.good}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>Average: {distribution.distribution.average}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Below Avg: {distribution.distribution.belowAverage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Poor: {distribution.distribution.poor}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />
                Top 5 Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!classSummary ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : classSummary.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classSummary.slice(0, 5).map((student, index) => (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                            ? 'bg-gray-200 text-gray-700'
                            : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.studentName}</p>
                        <Progress value={student.average} className="h-2 mt-1" />
                      </div>
                      <span className={`text-lg font-bold ${getPerformanceColor(student.average)}`}>
                        {Math.round(student.average)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          {/* Subject Performance Bar Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Subject Average Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subjectPerformance ? (
                <Skeleton className="h-64 w-full" />
              ) : subjectPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No subject data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={subjectPerformance.map(s => ({
                      name: s.subjectName.length > 10 ? s.subjectName.slice(0, 10) + '...' : s.subjectName,
                      fullName: s.subjectName,
                      average: Math.round(s.average),
                      highest: Math.round(s.highest),
                      lowest: Math.round(s.lowest),
                      passRate: Math.round(s.passRate),
                    }))}
                    margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name === 'average' ? 'Average' : name === 'passRate' ? 'Pass Rate' : name]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="average" name="Average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="passRate" name="Pass Rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Subject Details Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subjectPerformance ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : subjectPerformance.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-3">
                  {subjectPerformance.map((subject) => (
                    <div key={subject.subjectId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{subject.subjectName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {subject.studentCount} students
                          </p>
                        </div>
                        <span className={`text-lg font-bold ${getPerformanceColor(subject.average)}`}>
                          {Math.round(subject.average)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-green-50 rounded">
                          <p className="font-bold text-green-600">{Math.round(subject.highest)}%</p>
                          <p className="text-muted-foreground">Highest</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <p className="font-bold text-red-600">{Math.round(subject.lowest)}%</p>
                          <p className="text-muted-foreground">Lowest</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="font-bold text-blue-600">{Math.round(subject.passRate)}%</p>
                          <p className="text-muted-foreground">Pass Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {/* Student Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Student Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Student Trend Chart */}
          {selectedStudentId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!studentTrends ? (
                  <div className="space-y-3">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : studentTrends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No exam data for this student</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Line Chart */}
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={studentTrends.map((exam) => ({
                          name: exam.examName.length > 12 ? exam.examName.slice(0, 12) + '...' : exam.examName,
                          fullName: exam.examName,
                          average: Math.round(exam.average),
                          date: new Date(exam.date).toLocaleDateString(),
                        }))}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'Score']}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#2563eb' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    {/* Trend indicator */}
                    {studentTrends.length >= 2 && (
                      <div className="flex items-center justify-center gap-2 pt-2 border-t">
                        {studentTrends[studentTrends.length - 1].average >
                        studentTrends[studentTrends.length - 2].average ? (
                          <>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              Improving by{' '}
                              {Math.round(
                                studentTrends[studentTrends.length - 1].average -
                                  studentTrends[studentTrends.length - 2].average
                              )}
                              %
                            </span>
                          </>
                        ) : studentTrends[studentTrends.length - 1].average <
                          studentTrends[studentTrends.length - 2].average ? (
                          <>
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">
                              Declining by{' '}
                              {Math.round(
                                studentTrends[studentTrends.length - 2].average -
                                  studentTrends[studentTrends.length - 1].average
                              )}
                              %
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Stable performance</span>
                        )}
                      </div>
                    )}

                    {/* Exam details */}
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {studentTrends.map((exam) => (
                          <div key={exam.examId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <p className="font-medium text-sm">{exam.examName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(exam.date).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getProgressColor(exam.average).replace('bg-', 'bg-opacity-20 ')}>
                                {Math.round(exam.average)}%
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {exam.subjects.length} subjects | Total: {exam.totalScore}/{exam.maxScore}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedStudentId && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Select a student to view their performance trends
                </p>
              </CardContent>
            </Card>
          )}

          {/* At Risk Students */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Students Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!classSummary ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-3">
                  {classSummary
                    .filter((s) => s.average < 50)
                    .slice(0, 5)
                    .map((student) => (
                      <div
                        key={student.studentId}
                        className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                      >
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{student.studentName}</p>
                          <Progress value={student.average} className="h-2 mt-1 [&>div]:bg-red-500" />
                        </div>
                        <span className="text-lg font-bold text-red-600">
                          {Math.round(student.average)}%
                        </span>
                      </div>
                    ))}
                  {classSummary.filter((s) => s.average < 50).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Award className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-green-600">All students are performing above 50%</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
