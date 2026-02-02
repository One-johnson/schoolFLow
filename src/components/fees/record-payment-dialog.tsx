'use client';

import { useState, useEffect, JSX } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolAdminName: string;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  schoolId,
  schoolAdminName,
}: RecordPaymentDialogProps): React.JSX.Element {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amountDue, setAmountDue] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);

  const students = useQuery(
    api.students.getStudentsBySchool,
    { schoolId }
  );

  const categories = useQuery(
    api.feeCategories.getActiveCategoriesBySchool,
    { schoolId }
  );

  const recordPayment = useMutation(api.feePayments.recordPayment);

  const selectedStudent = students?.find((s) => s._id === studentId);
  const selectedCategory = categories?.find((c) => c._id === categoryId);

  const handleSubmit = async (): Promise<void> => {
    if (!studentId || !categoryId || !amountDue || !amountPaid) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedStudent || !selectedCategory) {
      toast.error('Invalid student or category selection');
      return;
    }

    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    const amountDueNum = parseFloat(amountDue);
    const amountPaidNum = parseFloat(amountPaid);

    if (isNaN(amountDueNum) || isNaN(amountPaidNum)) {
      toast.error('Invalid amount values');
      return;
    }

    if (amountPaidNum < 0 || amountDueNum < 0) {
      toast.error('Amounts cannot be negative');
      return;
    }

    setLoading(true);
    try {
      await recordPayment({
        schoolId,
        studentId: selectedStudent.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        classId: selectedStudent.classId,
        className: selectedStudent.className || '',
        items: [
          {
            categoryId: selectedCategory._id,
            categoryName: selectedCategory.categoryName,
            amountDue: amountDueNum,
            amountPaid: amountPaidNum,
          },
        ],
        paymentMethod: paymentMethod as 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other',
        transactionReference: transactionRef || undefined,
        paymentDate,
        notes: notes || undefined,
        paidBy: paidBy || undefined,
        collectedBy: user.email,
        collectedByName: schoolAdminName,
      });

      toast.success('Payment recorded successfully');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setStudentId('');
    setCategoryId('');
    setAmountDue('');
    setAmountPaid('');
    setPaymentMethod('cash');
    setTransactionRef('');
    setPaidBy('');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
          <DialogDescription>
            Record a fee payment for a student
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.className})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Fee Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount Due (GHS) *</Label>
              <Input
                id="amountDue"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid (GHS) *</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference</Label>
              <Input
                id="transactionRef"
                placeholder="Transaction ID or reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Input
                id="paidBy"
                placeholder="Name of person who paid"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
