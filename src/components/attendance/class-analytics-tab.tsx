'use client';

import { JSX, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ClassAnalyticsTabProps {
  schoolId: string;
}

export function ClassAnalyticsTab({ schoolId }: ClassAnalyticsTabProps): JSX.Element {
  const [selectedClass, setSelectedClass] = useState<string>('all');


  const classes = useQuery(api.classes.getClassesBySchool, { schoolId });

  const attendance = useQuery(
    api.attendance.getAttendanceBySchool,
    { schoolId }
  );
  

  const filteredAttendance = attendance?.filter((record) => {
    if (selectedClass === 'all') return true;
    return record.classId === selectedClass;
  });

  const classStats = filteredAttendance?.reduce((acc, record) => {
    if (!acc[record.classId]) {
      acc[record.classId] = {
        className: record.className,
        totalSessions: 0,
        totalStudents: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalExcused: 0,
      };
    }
    const stats = acc[record.classId];
    if (stats) {
      stats.totalSessions++;
      stats.totalStudents += record.totalStudents;
      stats.totalPresent += record.presentCount;
      stats.totalAbsent += record.absentCount;
      stats.totalLate += record.lateCount;
      stats.totalExcused += record.excusedCount;
    }
    return acc;
  }, {} as Record<string, {
    className: string;
    totalSessions: number;
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalExcused: number;
  }>);

  const classStatsArray = classStats ? Object.values(classStats) : [];
  classStatsArray.sort((a, b) => {
    const aRate = a.totalStudents > 0 ? (a.totalPresent / a.totalStudents) * 100 : 0;
    const bRate = b.totalStudents > 0 ? (b.totalPresent / b.totalStudents) * 100 : 0;
    return bRate - aRate;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Analytics</CardTitle>
        <CardDescription>
          Compare attendance performance across classes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Class Selection */}
        <div className="space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((cls) => (
                <SelectItem key={cls._id} value={cls._id}>
                  {cls.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class Comparison */}
        {classStatsArray.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Class Performance Comparison</h3>
            {classStatsArray.map((stats, index) => {
              const attendanceRate = stats.totalStudents > 0 
                ? Math.round((stats.totalPresent / stats.totalStudents) * 100)
                : 0;

              let trendIcon = <Minus className="h-4 w-4 text-gray-500" />;
              if (attendanceRate >= 90) trendIcon = <TrendingUp className="h-4 w-4 text-green-600" />;
              else if (attendanceRate < 75) trendIcon = <TrendingDown className="h-4 w-4 text-red-600" />;

              return (
                <Card key={stats.className}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg">{stats.className}</div>
                        {trendIcon}
                      </div>
                      <div className="text-2xl font-bold">
                        {attendanceRate}%
                      </div>
                    </div>

                    <Progress value={attendanceRate} className="h-2 mb-4" />

                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sessions</div>
                        <div className="font-medium">{stats.totalSessions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Present</div>
                        <div className="font-medium text-green-600">{stats.totalPresent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Absent</div>
                        <div className="font-medium text-red-600">{stats.totalAbsent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Late</div>
                        <div className="font-medium text-yellow-600">{stats.totalLate}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Excused</div>
                        <div className="font-medium text-blue-600">{stats.totalExcused}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No attendance data available yet</p>
            <p className="text-sm mt-2">Start marking attendance to see analytics</p>
          </div>
        )}

        {/* Best/Worst Performers */}
        {classStatsArray.length >= 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {classStatsArray[0]?.className}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {classStatsArray[0]?.totalStudents && Math.round((classStatsArray[0].totalPresent / classStatsArray[0].totalStudents) * 100)}% attendance rate
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800">Needs Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {classStatsArray[classStatsArray.length - 1]?.className}
                </div>
                <div className="text-sm text-orange-700 mt-1">
                  {classStatsArray[classStatsArray.length - 1]?.totalStudents && Math.round((classStatsArray[classStatsArray.length - 1].totalPresent / classStatsArray[classStatsArray.length - 1].totalStudents) * 100)}% attendance rate
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
