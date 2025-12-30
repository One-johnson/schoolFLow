import { Badge } from '@/components/ui/badge';
import { JSX } from 'react';

interface TicketStatusBadgeProps {
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps): JSX.Element {
  const statusConfig = {
    open: { label: 'Open', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    in_progress: { label: 'In Progress', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
    waiting_customer: { label: 'Waiting Customer', variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
    resolved: { label: 'Resolved', variant: 'outline' as const, className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
    closed: { label: 'Closed', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

interface TicketPriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps): JSX.Element {
  const priorityConfig = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
    medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
    urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  };

  const config = priorityConfig[priority];

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}

interface TicketCategoryBadgeProps {
  category: 'payment' | 'technical' | 'account' | 'general';
}

export function TicketCategoryBadge({ category }: TicketCategoryBadgeProps): JSX.Element {
  const categoryConfig = {
    payment: { label: 'Payment', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
    technical: { label: 'Technical', className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    account: { label: 'Account', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    general: { label: 'General', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  };

  const config = categoryConfig[category];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
