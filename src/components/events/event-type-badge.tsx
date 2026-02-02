'use client';

import { Badge } from '@/components/ui/badge';
import { getEventTypeColor, getEventTypeLabel } from '@/lib/event-utils';
import { JSX } from 'react';

interface EventTypeBadgeProps {
  eventType: string;
  color?: string;
}

export function EventTypeBadge({ eventType, color }: EventTypeBadgeProps): React.JSX.Element {
  const bgColor = color || getEventTypeColor(eventType);
  const label = getEventTypeLabel(eventType);

  return (
    <Badge style={{ backgroundColor: bgColor }} className="text-white text-xs">
      {label}
    </Badge>
  );
}
