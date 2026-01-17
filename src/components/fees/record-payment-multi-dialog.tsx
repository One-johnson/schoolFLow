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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolAdminName: string;
}

interface PaymentItem {
  id: string;
  categoryId: string;
  amountDue: string;
  amountPaid: string;
}

export function RecordPaymentMultiDialog({
  open,
  onOpenChange,
  schoolId,
  schoolAdminName,
}: RecordPaymentDialogProps): JSX.Element {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string>('');
  const [items, setItems] = useState<PaymentItem[]>([
    { id: '1', categoryId: '', amountDue: '', amountPaid: '' },
  ]);
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

  const addItem = (): void => {
    const newId = String(Date.now());
    setItems([...items, { id: newId, categoryId: '', amountDue: '', amountPaid: '' }]);
  };

  const removeItem = (id: string): void => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof PaymentItem, value: string): void => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const getTotalDue = (): number => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amountDue) || 0), 0);
  };

  const getTotalPaid = (): number => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amountPaid) || 0), 0);
  };

  const getBalance = (): number => {
    return getTotalDue() - getTotalPaid();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!studentId) {
      toast.error('Please select a student');
      return;
    }

    const validItems = items.filter(
      (item) => item.categoryId && item.amountDue && item.amountPaid
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one fee category with amounts');
      return;
    }

    if (!selectedStudent) {
      toast.error('Invalid student selection');
      return;
    }

    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    const paymentItems = validItems.map((item) => {
      const category = categories?.find((c) => c._id === item.categoryId);
      return {
        categoryId: item.categoryId as Id<'feeCategories'>,
        categoryName: category?.categoryName || '',
        amountDue: parseFloat(item.amountDue),
        amountPaid: parseFloat(item.amountPaid),
      };
    });

    setLoading(true);
    try {
      await recordPayment({
        schoolId,
        studentId: selectedStudent.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        classId: selectedStudent.classId,
        className: selectedStudent.className,
        items: paymentItems,
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
    setItems([{ id: '1', categoryId: '', amountDue: '', amountPaid: '' }]);
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
          <DialogDescription>
            Record a fee payment with multiple categories for a student
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
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
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Fee Categories</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Item {index + 1}</Label>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`category-${item.id}`}>Category *</Label>
                        <Select
                          value={item.categoryId}
                          onValueChange={(value) =>
                            updateItem(item.id, 'categoryId', value)
                          }
                        >
                          <SelectTrigger id={`category-${item.id}`}>
                            <SelectValue placeholder="Select" />
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

                      <div className="space-y-2">
                        <Label htmlFor={`amountDue-${item.id}`}>Amount Due *</Label>
                        <Input
                          id={`amountDue-${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.amountDue}
                          onChange={(e) =>
                            updateItem(item.id, 'amountDue', e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`amountPaid-${item.id}`}>Amount Paid *</Label>
                        <Input
                          id={`amountPaid-${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.amountPaid}
                          onChange={(e) =>
                            updateItem(item.id, 'amountPaid', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Due:</span>
                  <span className="font-bold">GHS {getTotalDue().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Paid:</span>
                  <span className="font-bold">GHS {getTotalPaid().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2">
                  <span className="font-semibold">Balance:</span>
                  <span
                    className={`font-bold ${
                      getBalance() > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    GHS {getBalance().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
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
          </div>
        </ScrollArea>

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
