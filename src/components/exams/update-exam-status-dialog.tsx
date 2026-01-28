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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface UpdateExamStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id<'exams'>;
  examName: string;
  currentStatus: 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published';
}

export function UpdateExamStatusDialog({
  open,
  onOpenChange,
  examId,
  examName,
  currentStatus,
}: UpdateExamStatusDialogProps) {
  const { toast } = useToast();
  const updateExam = useMutation(api.exams.updateExam);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>(currentStatus);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateExam({
        examId,
        status: newStatus as 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'published',
      });

      toast({
        title: 'Success',
        description: `Exam status updated to ${newStatus}`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exam status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDescription = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'Exam is being planned and not yet finalized';
      case 'scheduled':
        return 'Exam is scheduled and ready to begin';
      case 'ongoing':
        return 'Exam is currently in progress';
      case 'completed':
        return 'Exam is finished and marks can be analyzed';
      case 'published':
        return 'Exam results are published and visible to students';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Exam Status</DialogTitle>
          <DialogDescription>
            Change the status of "{examName}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Current Status</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium capitalize">
              {currentStatus.replace('_', ' ')}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus} required>
              <SelectTrigger id="newStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getStatusDescription(newStatus)}
            </p>
          </div>

          <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">💡 Tip</p>
            <p className="text-xs">
              Set status to "Completed" to view analytics for this exam
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || newStatus === currentStatus}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
