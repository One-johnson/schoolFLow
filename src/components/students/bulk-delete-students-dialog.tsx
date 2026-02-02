'use client';

import { JSX, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
}

interface BulkDeleteStudentsDialogProps {
  students: Student[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function BulkDeleteStudentsDialog({
  students,
  open,
  onOpenChange,
  onDeleted,
}: BulkDeleteStudentsDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteStudent = useMutation(api.students.deleteStudent);

  const handleBulkDelete = async (): Promise<void> => {
    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const student of students) {
        try {
          await deleteStudent({ studentId: student._id as Id<'students'>, deletedBy: user?.userId || "" });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete student ${student.studentId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} student${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} student${failCount > 1 ? 's' : ''}`);
      }

      if (successCount > 0) {
        onDeleted?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to delete students');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {students.length} Student{students.length > 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The following students will be permanently deleted:
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: This will permanently delete {students.length} student{students.length > 1 ? 's' : ''} and all associated records.
          </AlertDescription>
        </Alert>

        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
          {students.map((student) => (
            <div key={student._id} className="text-sm">
              <span className="font-medium">{student.studentId}</span> - {student.firstName} {student.lastName} ({student.className})
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${students.length} Student${students.length > 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
