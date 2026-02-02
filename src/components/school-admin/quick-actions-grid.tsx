'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  GraduationCap, 
  FileText,
  CalendarDays,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface QuickActionsGridProps {
  hasCreatedSchool: boolean;
}

export function QuickActionsGrid({ hasCreatedSchool }: QuickActionsGridProps): React.JSX.Element {
  if (!hasCreatedSchool) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Complete school setup to access quick actions
          </p>
        </CardContent>
      </Card>
    );
  }

  const actions = [
    {
      icon: Users,
      label: 'Add Student',
      description: 'Enroll new student',
      href: '/school-admin/students',
      color: 'text-blue-600',
    },
    {
      icon: GraduationCap,
      label: 'Add Teacher',
      description: 'Register new teacher',
      href: '/school-admin/teachers',
      color: 'text-purple-600',
    },
    {
      icon: DollarSign,
      label: 'Record Payment',
      description: 'Log fee payment',
      href: '/school-admin/fees',
      color: 'text-green-600',
    },
    {
      icon: Calendar,
      label: 'Create Event',
      description: 'Schedule new event',
      href: '/school-admin/events',
      color: 'text-orange-600',
    },
    {
      icon: CalendarDays,
      label: 'View Timetable',
      description: 'Manage schedules',
      href: '/school-admin/timetable',
      color: 'text-pink-600',
    },
    {
      icon: FileText,
      label: 'Generate Report',
      description: 'Export data',
      href: '/school-admin/fees',
      color: 'text-cyan-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
            >
              <Link href={action.href}>
                <div className="flex items-center gap-2 w-full">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
                <div className="text-left w-full">
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
