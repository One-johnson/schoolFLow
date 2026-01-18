'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  GraduationCap, 
  TrendingUp,
  ArrowRight 
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { JSX } from 'react';

interface ActivityFeedCardProps {
  schoolId: string;
}

export function ActivityFeedCard({ schoolId }: ActivityFeedCardProps): JSX.Element {
  const activities = useQuery(api.dashboard.getRecentActivity, { schoolId, limit: 10 });

  if (!activities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates across all modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'student':
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        );
      case 'payment':
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
        );
      case 'event':
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
        );
      case 'teacher':
        return (
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  };

  const getActivityLink = (type: string): string => {
    switch (type) {
      case 'student':
        return '/school-admin/students';
      case 'payment':
        return '/school-admin/fees';
      case 'event':
        return '/school-admin/events';
      case 'teacher':
        return '/school-admin/teachers';
      default:
        return '/school-admin';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates across all modules</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            <>
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Link href={getActivityLink(activity.type)}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your activity will appear here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
