'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, FileText, PlayCircle } from 'lucide-react';

type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';

interface ExamStatusBadgeProps {
  status: ExamStatus;
}

export function ExamStatusBadge({ status }: ExamStatusBadgeProps) {
  const config: Record<ExamStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    draft: {
      label: 'Draft',
      variant: 'outline',
      icon: <FileText className="h-3 w-3 mr-1" />,
    },
    scheduled: {
      label: 'Scheduled',
      variant: 'secondary',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    ongoing: {
      label: 'Ongoing',
      variant: 'default',
      icon: <PlayCircle className="h-3 w-3 mr-1" />,
    },
    completed: {
      label: 'Completed',
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
    published: {
      label: 'Published',
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
  };

  const { label, variant, icon } = config[status];

  return (
    <Badge variant={variant} className="flex items-center w-fit">
      {icon}
      {label}
    </Badge>
  );
}
