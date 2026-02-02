'use client';

import { useState, useMemo, JSX } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, HelpCircle, Clock, Download } from 'lucide-react';
import { RSVPList } from './rsvp-list';
import { RSVPAnalytics } from './rsvp-analytics';

interface RSVPManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<'events'> | null;
  eventTitle?: string;
  requiresRSVP?: boolean;
}

export function RSVPManagementDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  requiresRSVP,
}: RSVPManagementDialogProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch RSVPs
  const rsvps = useQuery(
    api.eventRSVPs.getRSVPsByEvent,
    eventId ? { eventId } : 'skip'
  );

  const rsvpStats = useQuery(
    api.eventRSVPs.getRSVPStats,
    eventId ? { eventId } : 'skip'
  );

  // Group RSVPs by status
  const rsvpsByStatus = useMemo(() => {
    if (!rsvps) return { attending: [], notAttending: [], maybe: [], pending: [] };

    return {
      attending: rsvps.filter((r) => r.rsvpStatus === 'attending'),
      notAttending: rsvps.filter((r) => r.rsvpStatus === 'not_attending'),
      maybe: rsvps.filter((r) => r.rsvpStatus === 'maybe'),
      pending: rsvps.filter((r) => r.rsvpStatus === 'pending'),
    };
  }, [rsvps]);

  // Export RSVPs to CSV
  const handleExportCSV = (): void => {
    if (!rsvps) return;

    const csvHeader = 'Name,Type,Email,Status,Guests,Notes,Responded At\n';
    const csvRows = rsvps.map((rsvp) => {
      return [
        rsvp.respondentName,
        rsvp.respondentType,
        rsvp.respondentEmail || 'N/A',
        rsvp.rsvpStatus,
        rsvp.numberOfGuests || 0,
        rsvp.notes || '',
        rsvp.respondedAt || 'Not responded',
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvp-${eventTitle?.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!requiresRSVP) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>RSVP Not Required</DialogTitle>
            <DialogDescription>
              This event does not require RSVP responses.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]  max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RSVP Management - {eventTitle}</DialogTitle>
          <DialogDescription>
            View and manage all RSVP responses for this event
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rsvpStats?.totalResponses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Response Rate: {rsvpStats?.responseRate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attending</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{rsvpStats?.attending || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{rsvpStats?.totalGuests || 0} guests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Attending</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rsvpStats?.notAttending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{rsvpStats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">
                Maybe: {rsvpStats?.maybe || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attending">
                Attending
                <Badge variant="secondary" className="ml-2">
                  {rsvpsByStatus.attending.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="not_attending">
                Not Attending
                <Badge variant="secondary" className="ml-2">
                  {rsvpsByStatus.notAttending.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <Badge variant="secondary" className="ml-2">
                  {rsvpsByStatus.pending.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <RSVPAnalytics 
              rsvps={rsvps || []} 
              stats={rsvpStats}
            />
            <Card>
              <CardHeader>
                <CardTitle>All Responses</CardTitle>
                <CardDescription>Complete list of all RSVP responses</CardDescription>
              </CardHeader>
              <CardContent>
                <RSVPList rsvps={rsvps || []} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attending Tab */}
          <TabsContent value="attending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Attending ({rsvpsByStatus.attending.length})
                </CardTitle>
                <CardDescription>People who confirmed they will attend</CardDescription>
              </CardHeader>
              <CardContent>
                <RSVPList rsvps={rsvpsByStatus.attending} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Not Attending Tab */}
          <TabsContent value="not_attending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  Not Attending ({rsvpsByStatus.notAttending.length})
                </CardTitle>
                <CardDescription>People who declined attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <RSVPList rsvps={rsvpsByStatus.notAttending} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-amber-600" />
                  Pending Responses ({rsvpsByStatus.pending.length})
                </CardTitle>
                <CardDescription>
                  People who haven&apos;t responded yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RSVPList rsvps={rsvpsByStatus.pending} showReminder />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
