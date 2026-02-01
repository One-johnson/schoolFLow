'use client';

import { JSX, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    _id: string;
    receiptNumber: string;
    studentName: string;
  } | null;
  adminId: string;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  payment,
  adminId,
}: DeletePaymentDialogProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const deletePayment = useMutation(api.feePayments.deletePayment);

  const handleDelete = async (): Promise<void> => {
    if (!payment) return;

    setLoading(true);

    try {
      await deletePayment({
        paymentId: payment._id as Id<'feePayments'>,
        deletedBy: adminId,
      });

      toast.success('Payment deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!payment) return <></>;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the payment record for:
            <div className="mt-2 p-3 bg-muted rounded-md">
              <div><strong>Receipt:</strong> {payment.receiptNumber}</div>
              <div><strong>Student:</strong> {payment.studentName}</div>
            </div>
            <div className="mt-2 text-red-600 font-medium">
              This action cannot be undone.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete Payment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
