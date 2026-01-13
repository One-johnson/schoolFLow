'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { JSX } from 'react';

interface Conflict {
  type: 'teacher_double_booking' | 'teacher_consecutive' | 'teacher_overload' | 'subject_clustering';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details: {
    teacherId?: string;
    teacherName?: string;
    day?: string;
    periods?: string[];
    classNames?: string[];
    subjectName?: string;
  };
}

interface ConflictBadgeProps {
  conflicts: Conflict[];
}

export function ConflictBadge({ conflicts }: ConflictBadgeProps): JSX.Element | null {
  if (conflicts.length === 0) return null;

  // Get highest severity
  const hasError = conflicts.some(c => c.severity === 'error');
  const hasWarning = conflicts.some(c => c.severity === 'warning');

  const severity = hasError ? 'error' : hasWarning ? 'warning' : 'info';
  const variant = severity === 'error' ? 'destructive' : 'secondary';

  const Icon = severity === 'error' ? AlertCircle : 
               severity === 'warning' ? AlertTriangle : Info;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="gap-1 cursor-help">
            <Icon className="h-3 w-3" />
            {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {conflicts.slice(0, 3).map((conflict, index) => (
              <div key={index} className="text-xs">
                • {conflict.message}
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{conflicts.length - 3} more...
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
