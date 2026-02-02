'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface AlertsCardProps {
  schoolId: string;
}

export function AlertsCard({ schoolId }: AlertsCardProps): React.JSX.Element {
  const alerts = useQuery(api.dashboard.getAlerts, { schoolId });

  if (!alerts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerts & Notices
          </CardTitle>
          <CardDescription>Important items requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string): React.JSX.Element => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Alerts & Notices
        </CardTitle>
        <CardDescription>Important items requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length > 0 ? (
          <>
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {alert.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    {alert.link && (
                      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                        <Link href={alert.link}>
                          View Details
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No alerts at this time</p>
            <p className="text-xs text-muted-foreground mt-1">
              Everything is running smoothly!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
