'use client';

import { JSX, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Id } from '../../../convex/_generated/dataModel';

interface RSVP {
  _id: Id<'eventRSVPs'>;
  respondentType: 'student' | 'parent' | 'teacher';
  rsvpStatus: 'attending' | 'not_attending' | 'maybe' | 'pending';
  numberOfGuests?: number;
}

interface RSVPStats {
  totalResponses: number;
  attending: number;
  notAttending: number;
  maybe: number;
  pending: number;
  totalGuests: number;
  responseRate: number;
}

interface RSVPAnalyticsProps {
  rsvps: RSVP[];
  stats?: RSVPStats;
}

export function RSVPAnalytics({ rsvps, stats }: RSVPAnalyticsProps): JSX.Element {
  // Prepare data for pie chart
  const pieData = useMemo(() => {
    if (!stats) return [];

    return [
      { name: 'Attending', value: stats.attending, color: '#10b981' },
      { name: 'Not Attending', value: stats.notAttending, color: '#ef4444' },
      { name: 'Maybe', value: stats.maybe, color: '#f59e0b' },
      { name: 'Pending', value: stats.pending, color: '#6b7280' },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Calculate breakdown by respondent type
  const typeBreakdown = useMemo(() => {
    const breakdown = {
      student: 0,
      parent: 0,
      teacher: 0,
    };

    rsvps.forEach((rsvp) => {
      if (rsvp.rsvpStatus === 'attending') {
        breakdown[rsvp.respondentType]++;
      }
    });

    return breakdown;
  }, [rsvps]);

  const totalAttending = typeBreakdown.student + typeBreakdown.parent + typeBreakdown.teacher;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Response Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Response Distribution</CardTitle>
          <CardDescription>Breakdown of all RSVP responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No RSVP data yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance by Type</CardTitle>
          <CardDescription>Who&apos;s attending the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Students</span>
              <span className="text-muted-foreground">
                {typeBreakdown.student} / {totalAttending}
              </span>
            </div>
            <Progress 
              value={totalAttending > 0 ? (typeBreakdown.student / totalAttending) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Parents</span>
              <span className="text-muted-foreground">
                {typeBreakdown.parent} / {totalAttending}
              </span>
            </div>
            <Progress 
              value={totalAttending > 0 ? (typeBreakdown.parent / totalAttending) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Teachers</span>
              <span className="text-muted-foreground">
                {typeBreakdown.teacher} / {totalAttending}
              </span>
            </div>
            <Progress 
              value={totalAttending > 0 ? (typeBreakdown.teacher / totalAttending) * 100 : 0} 
              className="h-2"
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Attending</span>
              <span className="text-2xl font-bold text-green-600">{totalAttending}</span>
            </div>
            {stats && stats.totalGuests > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Plus {stats.totalGuests} additional guests
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
