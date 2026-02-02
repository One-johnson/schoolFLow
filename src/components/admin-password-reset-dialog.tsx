'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, CheckCircle2, Key, AlertCircle } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

interface AdminPasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: Id<'schoolAdmins'> | null;
  adminName: string;
  adminEmail: string;
  onSuccess?: () => void;
}

export function AdminPasswordResetDialog({
  open,
  onOpenChange,
  adminId,
  adminName,
  adminEmail,
  onSuccess,
}: AdminPasswordResetDialogProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async (): Promise<void> => {
    if (!adminId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });

      const data = await response.json();

      if (data.success) {
        setTempPassword(data.tempPassword);
        toast.success('Password reset successfully!');
        onSuccess?.();
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!tempPassword) return;

    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const handleClose = (): void => {
    setTempPassword(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <DialogTitle>Reset Password</DialogTitle>
          </div>
          <DialogDescription>
            Generate a new temporary password for this school admin
          </DialogDescription>
        </DialogHeader>

        {!tempPassword ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Admin Name</Label>
                <p className="font-medium">{adminName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium text-sm">{adminEmail}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">This will:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Generate a new secure temporary password</li>
                  <li>Invalidate the current password</li>
                  <li>Require the admin to change password on next login</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleReset} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Temporary Password'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Password Reset Successful!
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-green-700 dark:text-green-300">
                    Temporary Password
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-3 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded font-mono text-lg font-bold text-green-900 dark:text-green-100 break-all">
                      {tempPassword}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
                    📋 Next Steps:
                  </p>
                  <ol className="list-decimal list-inside text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>Share this password securely with {adminName}</li>
                    <li>They can log in using their School ID or email</li>
                    <li>They will be required to change this password immediately</li>
                  </ol>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⚠️ This password will only be shown once. Make sure to save it before closing.
                </p>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
