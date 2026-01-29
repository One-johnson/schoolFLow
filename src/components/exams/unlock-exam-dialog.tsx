'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Unlock, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Id } from '../../../convex/_generated/dataModel';

interface UnlockExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  examName: string;
  examStatus: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';
  adminId: string;
  adminName: string;
  isUnlocked?: boolean;
}

export function UnlockExamDialog({
  open,
  onOpenChange,
  examId,
  examName,
  examStatus,
  adminId,
  adminName,
  isUnlocked,
}: UnlockExamDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const unlockExam = useMutation(api.exams.unlockExam);
  const lockExam = useMutation(api.exams.lockExam);

  const handleUnlock = async (): Promise<void> => {
    if (!reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for unlocking this exam',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await unlockExam({
        examId,
        adminId,
        adminName,
        reason: reason.trim(),
      });

      toast({
        title: 'Exam Unlocked',
        description: `${examName} has been unlocked for corrections. You can now edit marks and exam details.`,
      });

      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlock exam',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await lockExam({
        examId,
        adminId,
        adminName,
      });

      toast({
        title: 'Exam Locked',
        description: `${examName} has been locked. Edits are now restricted.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to lock exam',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (examStatus !== 'completed' && examStatus !== 'published') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Unlock Exam</DialogTitle>
            <DialogDescription>
              Only completed or published exams can be unlocked for corrections.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This exam has status: <span className="font-semibold">{examStatus}</span>. 
              Change the status to completed or published first.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUnlocked ? 'Lock Exam' : 'Unlock Exam for Corrections'}
          </DialogTitle>
          <DialogDescription>
            {isUnlocked 
              ? `Lock "${examName}" to prevent further edits.`
              : `Unlock "${examName}" to make corrections to exam details or marks.`
            }
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This exam is {examStatus}. Unlocking will allow you to edit marks and exam details.
                All changes will be logged for audit purposes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="unlock-reason">
                Reason for Unlocking <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="unlock-reason"
                placeholder="e.g., Correcting marking errors, Parent dispute, Data entry mistake..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be recorded in the audit log.
              </p>
            </div>
          </>
        )}

        {isUnlocked && (
          <Alert>
            <AlertDescription>
              This exam is currently unlocked. Lock it to prevent further edits and
              maintain data integrity.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {isUnlocked ? (
            <Button onClick={handleLock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lock Exam
            </Button>
          ) : (
            <Button onClick={handleUnlock} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Unlock className="mr-2 h-4 w-4" />
              Unlock for Corrections
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
