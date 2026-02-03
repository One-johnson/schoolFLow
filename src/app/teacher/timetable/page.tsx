'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Calendar, BookOpen, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
const DAYS: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};

export default function TeacherTimetablePage() {
  const { teacher } = useTeacherAuth();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('grid');

  // Get teacher's classes
  const classes = useQuery(
    api.classes.getClassesByIds,
    teacher?.classIds ? { classIds: teacher.classIds } : 'skip'
  );

  // Get teacher's timetable assignments
  const assignments = useQuery(
    api.timetableAssignments.getAssignmentsByTeacher,
    teacher ? { schoolId: teacher.schoolId, teacherId: teacher.teacherId } : 'skip'
  );

  // Filter assignments by selected class
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (selectedClass === 'all') return assignments;
    return assignments.filter((a) => a.classId === selectedClass);
  }, [assignments, selectedClass]);

  // Group assignments by day
  const assignmentsByDay = useMemo(() => {
    const grouped: Record<Day, typeof assignments> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    if (!filteredAssignments) return grouped;

    filteredAssignments.forEach((assignment) => {
      const day = assignment.day as Day;
      if (grouped[day]) {
        grouped[day]?.push(assignment);
      }
    });

    // Sort each day by start time
    DAYS.forEach((day) => {
      grouped[day]?.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [filteredAssignments]);

  // Get unique time slots for grid view
  const timeSlots = useMemo(() => {
    if (!filteredAssignments || filteredAssignments.length === 0) return [];

    const slots = new Set<string>();
    filteredAssignments.forEach((a) => {
      slots.add(`${a.startTime}-${a.endTime}`);
    });

    return Array.from(slots).sort((a, b) => {
      const aStart = a.split('-')[0];
      const bStart = b.split('-')[0];
      return aStart.localeCompare(bStart);
    });
  }, [filteredAssignments]);

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as Day;
  const todayAssignments = assignmentsByDay[today] || [];

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-muted-foreground text-sm">
            Your weekly class schedule
          </p>
        </div>

        {/* Class Filter */}
        <div className="w-full sm:w-48">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by class" />
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredAssignments?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Classes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayAssignments.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(filteredAssignments?.map((a) => a.classId)).size}
              </p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(filteredAssignments?.map((a) => a.subjectName)).size}
              </p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable View Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {!assignments ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No classes assigned yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground border-b w-20">
                          Time
                        </th>
                        {DAYS.map((day) => (
                          <th
                            key={day}
                            className={`p-2 text-center text-xs font-medium border-b ${
                              day === today
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {DAY_LABELS[day]}
                            {day === today && (
                              <Badge variant="secondary" className="ml-1 text-[10px]">
                                Today
                              </Badge>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot) => {
                        const [startTime, endTime] = slot.split('-');
                        return (
                          <tr key={slot}>
                            <td className="p-2 text-xs text-muted-foreground border-b align-top">
                              <div className="font-medium">{startTime}</div>
                              <div>{endTime}</div>
                            </td>
                            {DAYS.map((day) => {
                              const dayAssignments = assignmentsByDay[day]?.filter(
                                (a) =>
                                  a.startTime === startTime && a.endTime === endTime
                              );
                              return (
                                <td
                                  key={day}
                                  className={`p-1 border-b align-top ${
                                    day === today ? 'bg-primary/5' : ''
                                  }`}
                                >
                                  {dayAssignments?.map((assignment) => (
                                    <div
                                      key={assignment._id}
                                      className="p-2 bg-primary/10 rounded-md mb-1"
                                    >
                                      <p className="font-medium text-xs truncate">
                                        {assignment.subjectName}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {assignment.className}
                                      </p>
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4 space-y-4">
          {DAYS.map((day) => {
            const dayAssignments = assignmentsByDay[day];
            if (!dayAssignments || dayAssignments.length === 0) return null;

            return (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {DAY_LABELS[day]}
                    {day === today && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {dayAssignments.length} classes
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayAssignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-center">
                          <p className="text-sm font-medium">{assignment.startTime}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.endTime}
                          </p>
                        </div>
                        <div className="border-l pl-3">
                          <p className="font-medium text-sm">{assignment.subjectName}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.className}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {assignment.className}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {filteredAssignments.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No classes assigned yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Today's Classes */}
      {todayAssignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today&apos;s Classes ({DAY_LABELS[today]})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="w-20 text-center p-2 bg-primary/10 rounded">
                    <p className="text-sm font-bold">{assignment.startTime}</p>
                    <p className="text-xs text-muted-foreground">{assignment.endTime}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{assignment.subjectName}</p>
                    <p className="text-sm text-muted-foreground">{assignment.className}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
