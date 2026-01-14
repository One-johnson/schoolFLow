'use client';

import { useState, useCallback, JSX } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Send, Bell, Mail, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SendRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
}

export function SendRemindersDialog({
  open,
  onOpenChange,
  schoolId,
}: SendRemindersDialogProps): JSX.Element {
  const [reminderType, setReminderType] = useState<'payment_due' | 'installment_due' | 'overdue'>('payment_due');
  const [method, setMethod] = useState<'notification' | 'email' | 'sms'>('notification');
  const [minAmount, setMinAmount] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const studentsWithFees = useQuery(
    api.feeReminders.getStudentsWithOutstandingFees,
    { 
      schoolId,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
    }
  );

  const sendReminders = useMutation(api.feeReminders.sendBulkReminders);

  const handleSelectAll = useCallback((checked: boolean): void => {
    setSelectAll(checked);
    if (checked && studentsWithFees) {
      setSelectedStudents(new Set(studentsWithFees.map((s) => s.studentId)));
    } else {
      setSelectedStudents(new Set());
    }
  }, [studentsWithFees]);

  const handleStudentToggle = useCallback((studentId: string, checked: boolean): void => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      const result = await sendReminders({
        schoolId,
        studentIds: Array.from(selectedStudents),
        reminderType,
        method,
      });

      toast.success(`Sent ${result.successCount} reminders successfully`);

      if (result.failCount > 0) {
        toast.error(`Failed to send ${result.failCount} reminders`);
      }

      // Reset form
      setSelectedStudents(new Set());
      setSelectAll(false);

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to send reminders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedStudents,
    schoolId,
    reminderType,
    method,
    sendReminders,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Payment Reminders</DialogTitle>
          <DialogDescription>
            Send reminders to students with outstanding fees
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reminder Type & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminderType">Reminder Type *</Label>
              <Select value={reminderType} onValueChange={(value) => setReminderType(value as typeof reminderType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_due">Payment Due</SelectItem>
                  <SelectItem value="installment_due">Installment Due</SelectItem>
                  <SelectItem value="overdue">Overdue Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method *</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as typeof method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      In-App Notification
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email (Coming Soon)
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS (Coming Soon)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Min Amount Filter */}
          <div className="space-y-2">
            <Label htmlFor="minAmount">Minimum Outstanding Amount (Optional)</Label>
            <Input
              id="minAmount"
              type="number"
              step="0.01"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="e.g., 500"
            />
            <p className="text-sm text-muted-foreground">
              Only show students with outstanding fees above this amount
            </p>
          </div>

          {/* Student Selection */}
          {studentsWithFees && studentsWithFees.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Students *</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    id="select-all-reminders"
                  />
                  <label htmlFor="select-all-reminders" className="text-sm cursor-pointer">
                    Select All ({studentsWithFees.length})
                  </label>
                </div>
              </div>

              <div className="border rounded-lg max-h-64 overflow-y-auto p-4 space-y-2">
                {studentsWithFees.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between gap-2 p-2 hover:bg-muted rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={selectedStudents.has(student.studentId)}
                        onCheckedChange={(checked) => handleStudentToggle(student.studentId, checked as boolean)}
                        id={student.studentId}
                      />
                      <label htmlFor={student.studentId} className="flex-1 text-sm cursor-pointer">
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.studentId} - {student.className}
                        </div>
                      </label>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        GHS {student.totalOutstanding.toFixed(2)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {student.paymentCount} payment(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedStudents.size} of {studentsWithFees.length} students selected
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students with outstanding fees</h3>
              <p className="text-muted-foreground">
                {minAmount ? 'Try adjusting the minimum amount filter' : 'All fees are paid!'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedStudents.size === 0}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Sending...' : `Send ${selectedStudents.size} Reminders`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
