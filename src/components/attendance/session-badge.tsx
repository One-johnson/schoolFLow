import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Clock } from 'lucide-react';

interface SessionBadgeProps {
  session: 'morning' | 'afternoon' | 'full_day';
}

export function SessionBadge({ session }: SessionBadgeProps): JSX.Element {
  const config: Record<string, { label: string; icon: JSX.Element; className: string }> = {
    morning: { 
      label: 'Morning', 
      icon: <Sun className="h-3 w-3 mr-1" />,
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-100'
    },
    afternoon: { 
      label: 'Afternoon', 
      icon: <Moon className="h-3 w-3 mr-1" />,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    },
    full_day: { 
      label: 'Full Day', 
      icon: <Clock className="h-3 w-3 mr-1" />,
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100'
    },
  };

  const { label, icon, className } = config[session as keyof typeof config] || config.full_day;

  return (
    <Badge variant="outline" className={className}>
      {icon}
      {label}
    </Badge>
  );
}
