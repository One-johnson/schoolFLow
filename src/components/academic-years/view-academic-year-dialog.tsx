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
import { Calendar, CheckCircle } from 'lucide-react';
import { JSX } from 'react';

interface AcademicYear {
  _id: Id<'academicYears'>;
  yearCode: string;
  yearName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'active' | 'upcoming' | 'completed' | 'archived';
  isCurrentYear: boolean;
  createdAt: string;
}

interface ViewAcademicYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYear: AcademicYear;
}

export function ViewAcademicYearDialog({
  open,
  onOpenChange,
  academicYear,
}: ViewAcademicYearDialogProps): React.JSX.Element {
  const getStatusBadge = (status: string): React.JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-500">Archived</Badge>;
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
          <DialogTitle>Academic Year Details</DialogTitle>
          <DialogDescription>
            View complete information about this academic year
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Year Name:</span>
              <span className="font-semibold">{academicYear.yearName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Year Code:</span>
              <span className="font-mono text-sm">{academicYear.yearCode}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              {getStatusBadge(academicYear.status)}
            </div>

            {academicYear.isCurrentYear && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Current Year:</span>
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
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(academicYear.startDate)} - {formatDate(academicYear.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {academicYear.description && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{academicYear.description}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">{formatDate(academicYear.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
