'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  Wallet,
  FileText,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface ParentQuickActionsProps {
  firstChildId?: string;
}

export function ParentQuickActions({
  firstChildId,
}: ParentQuickActionsProps): React.JSX.Element {
  const actions = [
    {
      icon: Users,
      label: 'View Children',
      description: 'See progress and details',
      href: '/parent/children',
      color: 'text-blue-600',
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      description: 'Contact the school',
      href: '/parent/messages',
      color: 'text-purple-600',
    },
    {
      icon: Wallet,
      label: 'Fee Status',
      description: 'View and pay fees',
      href: '/parent/fees',
      color: 'text-green-600',
    },
    {
      icon: FileText,
      label: 'Report Cards',
      description: 'Download and share',
      href: firstChildId
        ? `/parent/children/${firstChildId}`
        : '/parent/children',
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
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
