'use client';

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
import { AlertTriangle } from 'lucide-react';

interface TrialCheckConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function TrialCheckConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: TrialCheckConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDialogTitle>Run Trial Check Manually?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <div>This will immediately execute the trial expiry check process:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Check all active trial subscriptions</li>
              <li>Send notifications where needed (7-day, 3-day, 1-day warnings)</li>
              <li>Process grace period reminders</li>
              <li>Suspend expired accounts past grace period</li>
              <li>Create audit log entries</li>
            </ul>
            <div className="text-sm font-medium pt-2">
              Note: The automated job already runs daily at 2:00 AM UTC.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Running Check...' : 'Run Check Now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
