'use client';

import { JSX } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface ViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    paymentId: string;
    receiptNumber: string;
    studentName: string;
    studentId: string;
    className: string;
    categoryName: string;
    amountDue: number;
    amountPaid: number;
    remainingBalance: number;
    paymentMethod: string;
    transactionReference?: string;
    paymentDate: string;
    paymentStatus: 'paid' | 'partial' | 'pending';
    paidBy?: string;
    collectedByName: string;
    notes?: string;
    createdAt: string;
  } | null;
}

export function ViewPaymentDialog({
  open,
  onOpenChange,
  payment,
}: ViewPaymentDialogProps): JSX.Element {
  if (!payment) return <></>;

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>;
    } else if (status === 'partial') {
      return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" />Partial</Badge>;
    } else {
      return <Badge className="bg-red-500"><XCircle className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  const formatPaymentMethod = (method: string): string => {
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Complete information about this payment record
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Receipt & Payment Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Receipt Number:</Label>
              <div className="col-span-2">
                <span className="font-mono text-sm">{payment.receiptNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Payment ID:</Label>
              <div className="col-span-2">
                <span className="font-mono text-sm">{payment.paymentId}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Status:</Label>
              <div className="col-span-2">
                {getStatusBadge(payment.paymentStatus)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Student Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Student Name:</Label>
              <div className="col-span-2">
                <span>{payment.studentName}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Student ID:</Label>
              <div className="col-span-2">
                <span className="font-mono text-sm">{payment.studentId}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Class:</Label>
              <div className="col-span-2">
                <span>{payment.className}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Fee Category:</Label>
              <div className="col-span-2">
                <span>{payment.categoryName}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Amount Due:</Label>
              <div className="col-span-2">
                <span className="font-semibold">GHS {payment.amountDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Amount Paid:</Label>
              <div className="col-span-2">
                <span className="font-semibold text-green-600">GHS {payment.amountPaid.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Balance:</Label>
              <div className="col-span-2">
                <span className={`font-semibold ${payment.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  GHS {payment.remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Payment Method:</Label>
              <div className="col-span-2">
                <span>{formatPaymentMethod(payment.paymentMethod)}</span>
              </div>
            </div>

            {payment.transactionReference && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Transaction Ref:</Label>
                <div className="col-span-2">
                  <span className="font-mono text-sm">{payment.transactionReference}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Payment Date:</Label>
              <div className="col-span-2">
                <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
              </div>
            </div>

            {payment.paidBy && (
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Paid By:</Label>
                <div className="col-span-2">
                  <span>{payment.paidBy}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 items-center gap-4">
              <Label className="font-semibold">Collected By:</Label>
              <div className="col-span-2">
                <span>{payment.collectedByName}</span>
              </div>
            </div>
          </div>

          {payment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="font-semibold">Notes:</Label>
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Record Created:</Label>
            <div className="col-span-2">
              <span className="text-sm">
                {new Date(payment.createdAt).toLocaleDateString()} at{' '}
                {new Date(payment.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
