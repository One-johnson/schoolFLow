'use client';

import { useState, useEffect, JSX } from 'react';
import { useQuery, useMutation } from 'convex/react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Id } from '@/../convex/_generated/dataModel';

interface EditAttendanceDialogProps {
  attendanceId: Id<'attendance'>;
  schoolId: string;
  adminId: string;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAttendanceDialog({
  attendanceId,
  schoolId,
  adminId,
  adminName,
  open,
  onOpenChange,
}: EditAttendanceDialogProps): React.JSX.Element {
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [studentChanges, setStudentChanges] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const records = useQuery(
    api.attendance.getAttendanceRecords,
    attendanceId ? { attendanceId } : 'skip'
  );

  const adminOverride = useMutation(api.attendance.adminOverrideAttendance);

  const handleStatusChange = (recordId: string, newStatus: string): void => {
    setStudentChanges((prev) => ({
      ...prev,
      [recordId]: newStatus,
    }));
  };

  const handleSave = async (): Promise<void> => {
    const changesCount = Object.keys(studentChanges).length;
    if (changesCount === 0) {
      toast.error('No changes to save');
      return;
    }

    if (!overrideReason.trim()) {
      toast.error('Please provide a reason for the changes');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [recordId, newStatus] of Object.entries(studentChanges)) {
        await adminOverride({
          recordId: recordId as Id<'attendanceRecords'>,
          newStatus: newStatus as 'present' | 'absent' | 'late' | 'excused',
          overriddenBy: adminId,
          overriddenByName: adminName,
          overrideReason,
        });
      }

      toast.success(`Updated ${changesCount} student records`);
      onOpenChange(false);
      setOverrideReason('');
      setStudentChanges({});
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>
            Make corrections to attendance records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Student Records */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-4 space-y-2">
              {records && records.length > 0 ? (
                records.map((record) => {
                  const currentStatus = studentChanges[record._id] || record.status;
                  return (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{record.studentName}</div>
                        {record.overriddenBy && (
                          <div className="text-xs text-orange-600">
                            Previously overridden
                          </div>
                        )}
                      </div>
                      <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={currentStatus === 'present' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange(record._id, 'present')}
                                className={currentStatus !== 'present' ? 'hover:bg-green-600 hover:text-white transition-colors' : ''}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Present</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => handleStatusChange(record._id, 'absent')}
                                className={currentStatus !== 'absent' ? 'hover:bg-red-600 hover:text-white transition-colors' : ''}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Absent</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={currentStatus === 'late' ? 'secondary' : 'outline'}
                                onClick={() => handleStatusChange(record._id, 'late')}
                                className={currentStatus !== 'late' ? 'hover:bg-yellow-600 hover:text-white transition-colors' : ''}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Late</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant={currentStatus === 'excused' ? 'secondary' : 'outline'}
                                onClick={() => handleStatusChange(record._id, 'excused')}
                                className={currentStatus !== 'excused' ? 'hover:bg-blue-600 hover:text-white transition-colors' : ''}
                              >
                                <AlertCircle className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Excused</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No records found
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Changes Summary */}
          {Object.keys(studentChanges).length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                {Object.keys(studentChanges).length} student(s) will be updated
              </div>
            </div>
          )}

          {/* Override Reason */}
          <div className="space-y-2">
            <Label>Reason for Changes *</Label>
            <Textarea
              value={overrideReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOverrideReason(e.target.value)}
              placeholder="Explain why these changes are being made..."
              rows={3}
              required={true}
            />
            <p className="text-xs text-muted-foreground">
              This will be logged in the audit trail
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || Object.keys(studentChanges).length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
