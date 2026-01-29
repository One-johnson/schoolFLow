import { Badge } from '@/components/ui/badge';
import { JSX } from 'react';

interface AttendanceStatusBadgeProps {
  status: 'present' | 'absent' | 'late' | 'excused';
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps): JSX.Element {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    present: { label: 'Present', variant: 'default' },
    absent: { label: 'Absent', variant: 'destructive' },
    late: { label: 'Late', variant: 'secondary' },
    excused: { label: 'Excused', variant: 'outline' },
  };

  const { label, variant } = config[status as keyof typeof config] || config.present;

  return <Badge variant={variant}>{label}</Badge>;
}
