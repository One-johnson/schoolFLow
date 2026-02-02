'use client';

import type { Id } from '@/../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Sun } from 'lucide-react';
import { JSX } from 'react';

interface Term {
  _id: Id<'terms'>;
  termCode: string;
  termName: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  holidayStart?: string;
  holidayEnd?: string;
  description?: string;
  status: 'active' | 'upcoming' | 'completed';
  isCurrentTerm: boolean;
  academicYearName: string;
  createdAt: string;
}

interface ViewTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: Term;
}

export function ViewTermDialog({
  open,
  onOpenChange,
  term,
}: ViewTermDialogProps): React.JSX.Element {
  const getStatusBadge = (status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Term Details</DialogTitle>
          <DialogDescription>
            View complete information about this term
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Term Name:</span>
              <span className="font-semibold">{term.termName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Term Code:</span>
              <span className="font-mono text-sm">{term.termCode}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Academic Year:</span>
              <span className="font-medium">{term.academicYearName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Term Number:</span>
              <span className="font-medium">{term.termNumber}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              {getStatusBadge(term.status)}
            </div>

            {term.isCurrentTerm && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Term:</span>
                <Badge className="bg-blue-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Yes
                </Badge>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Term Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(term.startDate)} - {formatDate(term.endDate)}
                    </p>
                  </div>
                </div>

                {term.holidayStart && term.holidayEnd && (
                  <div className="flex items-start gap-2">
                    <Sun className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Holiday Period</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(term.holidayStart)} - {formatDate(term.holidayEnd)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {term.description && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{term.description}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">{formatDate(term.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
