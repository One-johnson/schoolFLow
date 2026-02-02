'use client';

import { useState, useEffect, JSX } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface FeePaymentItem {
  categoryId: string;
  categoryName: string;
  amountDue: number;
  amountPaid: number;
}

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    _id: string;
    items?: string;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  } | null;
  adminId: string;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  adminId,
}: EditPaymentDialogProps): React.JSX.Element {
  const [items, setItems] = useState<FeePaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const updatePayment = useMutation(api.feePayments.updatePayment);

  // Initialize form when dialog opens
  useEffect(() => {
    if (payment && open) {
      if (payment.items) {
        setItems(JSON.parse(payment.items));
      }
      setPaymentMethod(payment.paymentMethod);
      setTransactionRef(payment.transactionReference || '');
      setNotes(payment.notes || '');
    }
  }, [payment, open]);

  const handleItemChange = (index: number, field: 'amountPaid', value: number): void => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!payment) return;

    setLoading(true);

    try {
      await updatePayment({
        paymentId: payment._id as Id<'feePayments'>,
        updatedBy: adminId,
        items: items,
        paymentMethod: paymentMethod as 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other',
        transactionReference: transactionRef || undefined,
        notes: notes || undefined,
      });

      toast.success('Payment updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return <></>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details and amounts
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fee Categories */}
          <div className="space-y-3">
            <Label className="font-semibold">Fee Categories</Label>
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="font-medium">{item.categoryName}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount Due</Label>
                    <Input
                      type="number"
                      value={item.amountDue}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Amount Paid *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.amountDue}
                      value={item.amountPaid}
                      onChange={(e) => handleItemChange(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Balance: GHS {(item.amountDue - item.amountPaid).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
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

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
            <Input
              id="transactionRef"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="Enter transaction reference"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
