'use client';

import { JSX, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Phone, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Id } from '../../../convex/_generated/dataModel';

interface RSVP {
  _id: Id<'eventRSVPs'>;
  _creationTime: number;
  schoolId: string;
  eventId: Id<'events'>;
  eventCode: string;
  eventTitle: string;
  respondentType: 'student' | 'parent' | 'teacher';
  respondentId: string;
  respondentName: string;
  respondentEmail?: string;
  rsvpStatus: 'attending' | 'not_attending' | 'maybe' | 'pending';
  numberOfGuests?: number;
  notes?: string;
  respondedAt?: string;
  createdAt: string;
}

interface RSVPListProps {
  rsvps: RSVP[];
  showReminder?: boolean;
}

export function RSVPList({ rsvps, showReminder = false }: RSVPListProps): JSX.Element {
  const sortedRSVPs = useMemo(() => {
    return [...rsvps].sort((a, b) => {
      // Sort by responded date (most recent first), then by name
      if (a.respondedAt && b.respondedAt) {
        return new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime();
      }
      return a.respondentName.localeCompare(b.respondentName);
    });
  }, [rsvps]);

  const getStatusBadge = (status: RSVP['rsvpStatus']): JSX.Element => {
    const variants: Record<RSVP['rsvpStatus'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      attending: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      not_attending: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      maybe: { variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
      pending: { variant: 'outline', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeBadge = (type: RSVP['respondentType']): JSX.Element => {
    const colors: Record<RSVP['respondentType'], string> = {
      student: 'bg-blue-100 text-blue-800',
      parent: 'bg-purple-100 text-purple-800',
      teacher: 'bg-indigo-100 text-indigo-800',
    };

    return (
      <Badge variant="outline" className={colors[type]}>
        {type}
      </Badge>
    );
  };

  const handleSendReminder = (rsvp: RSVP): void => {
    // TODO: Implement send reminder functionality
    console.log('Send reminder to:', rsvp.respondentName);
  };

  if (rsvps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No RSVP responses yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Responded</TableHead>
            {showReminder && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRSVPs.map((rsvp) => (
            <TableRow key={rsvp._id}>
              <TableCell>
                <div>
                  <p className="font-medium">{rsvp.respondentName}</p>
                  {rsvp.notes && (
                    <div className="flex items-start gap-1 mt-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {rsvp.notes}
                      </p>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(rsvp.respondentType)}</TableCell>
              <TableCell>{getStatusBadge(rsvp.rsvpStatus)}</TableCell>
              <TableCell>
                {rsvp.numberOfGuests ? (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{rsvp.numberOfGuests}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {rsvp.respondentEmail ? (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{rsvp.respondentEmail}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No email</span>
                )}
              </TableCell>
              <TableCell>
                {rsvp.respondedAt ? (
                  <span className="text-sm">
                    {format(new Date(rsvp.respondedAt), 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not responded</span>
                )}
              </TableCell>
              {showReminder && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendReminder(rsvp)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
