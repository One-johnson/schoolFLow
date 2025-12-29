'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle2, Clock, PlayCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { TrialCheckConfirmationDialog } from '@/components/trial-check-confirmation-dialog';
import { TrialCheckResultsDialog } from '@/components/trial-check-results-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

interface TrialCheckResult {
  trialsChecked: number;
  warningsSent: number;
  expiryNoticesSent: number;
  accountsSuspended: number;
  executionTime?: number;
}

export default function TrialManagementPage() {
  const { user } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [results, setResults] = useState<TrialCheckResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const manualTrialCheck = useMutation(api.trialManagement.manualTrialCheck);

  const handleManualCheck = (): void => {
    setShowConfirmDialog(true);
  };

  const executeTrialCheck = async (): Promise<void> => {
    if (!user?.userId) {
      toast.error('Authentication required', {
        description: 'You must be logged in to run the trial check.',
      });
      return;
    }

    setIsRunning(true);
    setShowConfirmDialog(false);

    try {
      toast.info('Running trial check...', {
        description: 'Checking all active trials and processing notifications.',
      });

      const result = await manualTrialCheck({
        triggeredBy: user.userId,
      });

      setResults(result);
      setShowResultsDialog(true);

      toast.success('Trial check completed', {
        description: `Checked ${result.trialsChecked} trials. ${result.warningsSent + result.expiryNoticesSent + result.accountsSuspended} actions taken.`,
      });
    } catch (error) {
      console.error('Error running trial check:', error);
      toast.error('Trial check failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage trial subscriptions across the platform
          </p>
        </div>
        <Button
          onClick={handleManualCheck}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          {isRunning ? 'Running Check...' : 'Run Manual Check'}
        </Button>
      </div>

      {/* Dialogs */}
      <TrialCheckConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={executeTrialCheck}
        isLoading={isRunning}
      />
      
      <TrialCheckResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        results={results}
      />

      {/* Notice Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Automated Trial Management System</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            The automated trial expiry system is now active and runs daily at 2:00 AM UTC. 
            Trial statistics and active trial lists will be displayed here once Convex is deployed and generating the API types.
          </p>
        </CardContent>
      </Card>

      {/* Statistics Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Active Trials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-600 mt-1">Currently active trial subscriptions</p>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-600 mt-1">Expiring within 7 days</p>
          </CardContent>
        </Card>

        {/* In Grace Period */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grace Period</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-600 mt-1">Expired, 3-day grace period</p>
          </CardContent>
        </Card>

        {/* Expired & Suspended */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-gray-600 mt-1">Past grace period, suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Trial Management</CardTitle>
          <CardDescription>
            How the automated trial expiry system works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">7 Days</Badge>
              <div>
                <p className="font-medium">First Warning</p>
                <p className="text-sm text-gray-600">
                  School admins receive a notification 7 days before trial expiry
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3 Days</Badge>
              <div>
                <p className="font-medium">Second Warning</p>
                <p className="text-sm text-gray-600">
                  Another reminder 3 days before expiry with action required
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1 Day</Badge>
              <div>
                <p className="font-medium">Final Warning</p>
                <p className="text-sm text-gray-600">
                  Last chance notification 1 day before trial expires
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1 bg-orange-100">Expiry</Badge>
              <div>
                <p className="font-medium">Grace Period Begins</p>
                <p className="text-sm text-gray-600">
                  3-day grace period starts with daily reminders to purchase subscription
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1 bg-red-100">+3 Days</Badge>
              <div>
                <p className="font-medium">Auto-Suspension</p>
                <p className="text-sm text-gray-600">
                  After grace period, school admin and school are automatically suspended
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Automated Schedule:</strong> The trial expiry check runs automatically every day at 2:00 AM UTC.
              Super admins receive notifications for all trial events.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-600">
              <strong>Implementation Details:</strong> The system uses Convex scheduled functions (cron jobs) 
              defined in <code className="px-1 py-0.5 bg-gray-100 rounded">convex/crons.ts</code> and 
              <code className="px-1 py-0.5 bg-gray-100 rounded ml-1">convex/trialManagement.ts</code> to 
              automatically check all active trials and send notifications at appropriate intervals.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backend Implementation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Implementation</CardTitle>
          <CardDescription>
            Trial management system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">convex/crons.ts</p>
                <p className="text-xs text-gray-600 mt-1">
                  Configures the daily cron job to run at 2:00 AM UTC
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">convex/trialManagement.ts</p>
                <p className="text-xs text-gray-600 mt-1">
                  Contains the logic for checking trials, sending warnings, and auto-suspending accounts
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">Grace Period System</p>
                <p className="text-xs text-gray-600 mt-1">
                  3-day grace period with daily reminders before final suspension
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Configured</Badge>
            </div>
          </div>

          <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After deploying the Convex functions, the cron job will automatically start running. 
              You can monitor its execution in the Convex dashboard logs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
