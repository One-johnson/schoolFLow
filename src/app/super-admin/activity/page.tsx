'use client';

import { useState, useMemo, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader } from'../../../components/ui/data-table';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  CheckCircle, 
  XCircle,
  Power,
  AlertTriangle,
  Activity as ActivityIcon,
  Shield
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface LoginHistoryEntry {
  _id: Id<'loginHistory'>;
  userId: string;
  userRole: 'super_admin' | 'school_admin' | 'teacher';
  loginTime: string;
  logoutTime?: string;
  status: 'success' | 'failed';
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  failureReason?: string;
  sessionId?: string;
}

interface SessionEntry {
  _id: Id<'sessions'>;
  userId: string;
  userRole: 'super_admin' | 'school_admin' | 'teacher';
  sessionToken: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  createdAt: string;
  expiresAt: number;
  lastActivity: string;
  isActive: boolean;
}

export default function ActivityPage(): React.JSX.Element {
  const loginHistory = useQuery(api.loginHistory.list, { limit: 100 });
  const loginStats = useQuery(api.loginHistory.getStats, {});
  const activeSessions = useQuery(api.sessions.listActive, {});
  const sessionStats = useQuery(api.sessions.getStats, {});
  
  const revokeSession = useMutation(api.sessions.revoke);
  const revokeAllExcept = useMutation(api.sessions.revokeAllExcept);

  const [selectedSession, setSelectedSession] = useState<SessionEntry | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const getDeviceIcon = (deviceType: string): React.JSX.Element => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleRevokeSession = async (): Promise<void> => {
    if (!selectedSession) return;

    setIsRevoking(true);
    try {
      await revokeSession({ id: selectedSession._id });
      toast.success('Session revoked successfully');
      setShowRevokeDialog(false);
      setSelectedSession(null);
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeAllSessions = async (): Promise<void> => {
    setIsRevoking(true);
    try {
      // Get current session from cookie/storage if needed
      const count = await revokeAllExcept({
        userId: 'current_user_id', // This should come from auth context
        currentSessionToken: 'current_token', // This should come from auth context
      });
      toast.success(`${count} session(s) revoked successfully`);
      setShowRevokeAllDialog(false);
    } catch (error) {
      toast.error('Failed to revoke sessions');
    } finally {
      setIsRevoking(false);
    }
  };

  // Login History Columns
  const loginColumns: ColumnDef<LoginHistoryEntry>[] = useMemo(
    () => [
      {
        accessorKey: 'loginTime',
        header: createSortableHeader('Time'),
        cell: ({ row }) => {
          const date = new Date(row.original.loginTime);
          return (
            <div>
              <p className="font-medium">{date.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'success' ? 'default' : 'destructive'}>
            {row.original.status === 'success' ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'device',
        header: 'Device',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getDeviceIcon(row.original.deviceType)}
            <div>
              <p className="text-sm font-medium">{row.original.browser}</p>
              <p className="text-xs text-muted-foreground">{row.original.os}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ipAddress}</span>
        ),
      },
      {
        accessorKey: 'userRole',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.userRole.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'failureReason',
        header: 'Details',
        cell: ({ row }) => {
          if (row.original.status === 'failed' && row.original.failureReason) {
            return (
              <span className="text-xs text-red-600 dark:text-red-400">
                {row.original.failureReason}
              </span>
            );
          }
          if (row.original.logoutTime) {
            return (
              <span className="text-xs text-muted-foreground">
                Logged out at {new Date(row.original.logoutTime).toLocaleTimeString()}
              </span>
            );
          }
          return <span className="text-xs text-muted-foreground">Active session</span>;
        },
      },
    ],
    []
  );

  // Sessions Columns
  const sessionColumns: ColumnDef<SessionEntry>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: createSortableHeader('Created'),
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div>
              <p className="font-medium">{date.toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'device',
        header: 'Device',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getDeviceIcon(row.original.deviceType)}
            <div>
              <p className="text-sm font-medium">{row.original.browser}</p>
              <p className="text-xs text-muted-foreground">{row.original.os}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ipAddress}</span>
        ),
      },
      {
        accessorKey: 'lastActivity',
        header: 'Last Activity',
        cell: ({ row }) => {
          const date = new Date(row.original.lastActivity);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
          
          return (
            <div>
              <p className="text-sm">{date.toLocaleTimeString()}</p>
              <p className="text-xs text-muted-foreground">
                {diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isExpired = row.original.expiresAt < Date.now();
          return (
            <Badge variant={row.original.isActive && !isExpired ? 'default' : 'outline'}>
              {row.original.isActive && !isExpired ? 'Active' : 'Expired'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedSession(row.original);
              setShowRevokeDialog(true);
            }}
            className="gap-1"
          >
            <Power className="h-3 w-3" />
            Revoke
          </Button>
        ),
      },
    ],
    []
  );

  if (!loginHistory || !activeSessions) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity & Sessions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor login history and manage active sessions
        </p>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="activity" className="gap-2">
            <ActivityIcon className="h-4 w-4" />
            Login History
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Shield className="h-4 w-4" />
            Active Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Logins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loginStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-green-600 dark:text-green-400">
                  Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {loginStats?.successful || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Login attempts</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-red-600 dark:text-red-400">
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {loginStats?.failed || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Login attempts</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loginStats?.todayLogins || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Logins today</p>
              </CardContent>
            </Card>
          </div>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Desktop</p>
                    <p className="text-xl font-bold">{loginStats?.deviceBreakdown.desktop || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Mobile</p>
                    <p className="text-xl font-bold">{loginStats?.deviceBreakdown.mobile || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tablet className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Tablet</p>
                    <p className="text-xl font-bold">{loginStats?.deviceBreakdown.tablet || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Unknown</p>
                    <p className="text-xl font-bold">{loginStats?.deviceBreakdown.unknown || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity ({loginHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={loginColumns}
                data={loginHistory}
                searchKey="ipAddress"
                searchPlaceholder="Search by IP address..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          {/* Session Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.active || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Desktop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.deviceBreakdown.desktop || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-green-600 dark:text-green-400">
                  Mobile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessionStats?.deviceBreakdown.mobile || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active sessions</p>
              </CardContent>
            </Card>
          </div>

          {/* Session Management Actions */}
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div>
              <p className="text-sm font-medium">Session Management</p>
              <p className="text-xs text-muted-foreground mt-1">
                Revoke sessions to log out users from all devices
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowRevokeAllDialog(true)}
              className="gap-2"
            >
              <Power className="h-4 w-4" />
              Revoke All Sessions
            </Button>
          </div>

          {/* Active Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions ({activeSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={sessionColumns}
                data={activeSessions}
                searchKey="ipAddress"
                searchPlaceholder="Search by IP address..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revoke Session Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The user will be logged out from this device immediately.
              {selectedSession && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-sm"><strong>Device:</strong> {selectedSession.device}</p>
                  <p className="text-sm"><strong>IP:</strong> {selectedSession.ipAddress}</p>
                  <p className="text-sm"><strong>Created:</strong> {new Date(selectedSession.createdAt).toLocaleString()}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke all active sessions except your current one? 
              All other users will be logged out immediately from all their devices.
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-900 dark:text-red-100">
                  <strong>Warning:</strong> This action affects all active sessions ({sessionStats?.active || 0} sessions).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllSessions}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? 'Revoking...' : 'Revoke All Sessions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
