'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { CheckCircle, Loader2, Users, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  status: 'active' | 'inactive' | 'fresher' | 'continuing' | 'transferred' | 'graduated';
}

interface BulkStatusChangeDialogProps {
  students: Student[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged?: () => void;
}

export function BulkStatusChangeDialog({
  students,
  open,
  onOpenChange,
  onStatusChanged,
}: BulkStatusChangeDialogProps): JSX.Element {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const bulkUpdateStatus = useMutation(api.students.bulkUpdateStudentStatus);

  const handleBulkStatusChange = async (): Promise<void> => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await bulkUpdateStatus({
        studentIds: students.map((s) => s._id as Id<'students'>),
        status: selectedStatus as 'active' | 'inactive' | 'fresher' | 'continuing' | 'transferred' | 'graduated',
        updatedBy: user?.email || 'unknown',
      });

      if (result.successCount > 0) {
        toast.success(
          `Successfully updated status for ${result.successCount} student${result.successCount > 1 ? 's' : ''}`
        );
      }

      if (result.failCount > 0) {
        toast.error(`Failed to update ${result.failCount} student${result.failCount > 1 ? 's' : ''}`);
      }

      onOpenChange(false);
      setSelectedStatus('');
      onStatusChanged?.();
    } catch (error) {
      toast.error('Failed to update student status');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'fresher':
        return <Badge className="bg-blue-500">Fresher</Badge>;
      case 'continuing':
        return <Badge className="bg-purple-500">Continuing</Badge>;
      case 'transferred':
        return <Badge className="bg-orange-500">Transferred</Badge>;
      case 'graduated':
        return <Badge className="bg-yellow-500">Graduated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Group students by current status
  const studentsByStatus = students.reduce((acc: Record<string, Student[]>, student) => {
    if (!acc[student.status]) {
      acc[student.status] = [];
    }
    acc[student.status].push(student);
    return acc;
  }, {});

  const isGraduatedStatus = selectedStatus === 'graduated';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Change Student Status</DialogTitle>
          <DialogDescription>
            Update status for {students.length} student{students.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Students Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                Selected Students ({students.length})
              </h3>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {Object.entries(studentsByStatus).map(([status, statusStudents]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                      <span className="text-xs text-muted-foreground">
                        ({statusStudents.length} student{statusStudents.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {statusStudents.map((student) => (
                        <div key={student._id} className="text-sm">
                          {student.firstName} {student.lastName}
                          <span className="text-muted-foreground ml-2">
                            ({student.className})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="newStatus">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="fresher">Fresher</SelectItem>
                <SelectItem value="continuing">Continuing</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Graduated Status Warning */}
          {isGraduatedStatus && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">
                  Graduated Status
                </h3>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Setting students to &quot;Graduated&quot; indicates they have completed their education
                at this school. Graduated students will remain in the system for record-keeping
                but won&apos;t count towards active student statistics.
              </p>
            </div>
          )}

          {/* General Info */}
          {selectedStatus && !isGraduatedStatus && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
              <p>
                All {students.length} selected student{students.length > 1 ? 's' : ''} will have
                their status changed to <strong>{selectedStatus}</strong>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedStatus('');
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleBulkStatusChange} disabled={!selectedStatus || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
