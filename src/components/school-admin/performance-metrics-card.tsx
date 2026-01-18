'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { JSX } from 'react';

interface PerformanceMetricsCardProps {
  schoolId: string;
}

export function PerformanceMetricsCard({ schoolId }: PerformanceMetricsCardProps): JSX.Element {
  const metrics = useQuery(api.dashboard.getPerformanceMetrics, { schoolId });

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Key efficiency indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>Key efficiency indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teacher Utilization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Teacher Utilization</span>
            <span className="text-sm font-bold">{metrics.teacherUtilization} classes/teacher</span>
          </div>
          <Progress 
            value={Math.min(((Number(metrics.teacherUtilization) || 0) / 8) * 100, 100)}
            className="h-2" 
          />
          <p className="text-xs text-muted-foreground">
            Average teaching load per teacher
          </p>
        </div>

        <Separator />

        {/* Class Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Class Capacity</span>
            <span className="text-sm font-bold">{metrics.classCapacity} students/class</span>
          </div>
          <Progress 
            value={Math.min(((Number(metrics.classCapacity) || 0) / 40) * 100, 100)} 
            className="h-2" 
          />
          <p className="text-xs text-muted-foreground">
            Average students per class
          </p>
        </div>

        <Separator />

        {/* Event Engagement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Event Engagement</span>
            <span className="text-sm font-bold">{metrics.eventEngagement}%</span>
          </div>
          <Progress value={metrics.eventEngagement} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Average RSVP rate for events
          </p>
        </div>

        <Separator />

        {/* Fee Collection Efficiency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Collection Efficiency</span>
            <span className="text-sm font-bold">{metrics.collectionEfficiency}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">
              Average time to payment completion
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
