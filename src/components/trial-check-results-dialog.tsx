'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Bell, XCircle } from 'lucide-react';

interface TrialCheckResult {
  trialsChecked: number;
  warningsSent: number;
  expiryNoticesSent: number;
  accountsSuspended: number;
  executionTime?: number;
}

interface TrialCheckResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: TrialCheckResult | null;
}

export function TrialCheckResultsDialog({
  open,
  onOpenChange,
  results,
}: TrialCheckResultsDialogProps) {
  // Don't early return - let the dialog render even if results is null
  const hasActions = results
    ? results.warningsSent > 0 || 
      results.expiryNoticesSent > 0 || 
      results.accountsSuspended > 0
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <DialogTitle>Trial Check Complete</DialogTitle>
          </div>
          <DialogDescription>
            Manual trial expiry check executed successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Trials Checked</p>
                    <p className="text-2xl font-bold">{results?.trialsChecked ?? 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Warnings Sent</p>
                    <p className="text-2xl font-bold">{results?.warningsSent ?? 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expiry Notices</p>
                    <p className="text-2xl font-bold">{results?.expiryNoticesSent ?? 0}</p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Accounts Suspended</p>
                    <p className="text-2xl font-bold">{results?.accountsSuspended ?? 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card className={hasActions ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  {hasActions ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Actions Taken</h3>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">All Clear</h3>
                    </>
                  )}
                </div>

                {hasActions && results ? (
                  <ul className="space-y-2 text-sm text-blue-800">
                    {results.warningsSent > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <span>
                          Sent {results.warningsSent} warning notification{results.warningsSent !== 1 ? 's' : ''} 
                          {' '}(7-day, 3-day, or 1-day reminders)
                        </span>
                      </li>
                    )}
                    {results.expiryNoticesSent > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <span>
                          Sent {results.expiryNoticesSent} expiry notice{results.expiryNoticesSent !== 1 ? 's' : ''} 
                          {' '}(trial expired, grace period started)
                        </span>
                      </li>
                    )}
                    {results.accountsSuspended > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <span>
                          Suspended {results.accountsSuspended} account{results.accountsSuspended !== 1 ? 's' : ''} 
                          {' '}(grace period ended)
                        </span>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-green-800">
                    No actions required. All active trials are not due for warnings, expiry notices, or suspensions at this time.
                  </p>
                )}

                {results?.executionTime && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-700">
                      Completed in {results.executionTime.toFixed(2)} seconds
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              Audit logs have been created for this manual check
            </Badge>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
