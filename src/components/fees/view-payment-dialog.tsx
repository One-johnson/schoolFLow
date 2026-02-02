'use client';

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
import { JSX } from 'react';

interface FeePaymentItem {
  categoryName: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
}

interface ViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    paymentId: string;
    receiptNumber: string;
    studentName: string;
    studentId: string;
    className: string;
    categoryName?: string;
    amountDue?: number;
    amountPaid?: number;
    remainingBalance?: number;
    version?: number;
    items?: string;
    totalAmountDue?: number;
    totalAmountPaid?: number;
    totalBalance?: number;
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
}: ViewPaymentDialogProps): React.JSX.Element {
  if (!payment) return <></>;

  // Check if this is a v2 payment (multi-category)
  const isV2 = payment.version === 2 && payment.items;
  const items: FeePaymentItem[] = isV2 ? JSON.parse(payment.items as string) : [];

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
          {isV2 ? (
            <div className="space-y-3">
              <Label className="font-semibold">Fee Categories:</Label>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">Category</th>
                      <th className="p-2 text-right font-medium">Amount Due</th>
                      <th className="p-2 text-right font-medium">Amount Paid</th>
                      <th className="p-2 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: FeePaymentItem, index: number) => {
                      const amountDue = item.amountDue || 0;
                      const amountPaid = item.amountPaid || 0;
                      const balance = item.balance !== undefined ? item.balance : (amountDue - amountPaid);
                      
                      return (
                        <tr key={index} className="border-b last:border-0">
                          <td className="p-2">{item.categoryName || 'N/A'}</td>
                          <td className="p-2 text-right">GHS {amountDue.toFixed(2)}</td>
                          <td className="p-2 text-right text-green-600">GHS {amountPaid.toFixed(2)}</td>
                          <td className={`p-2 text-right ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            GHS {balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-3 items-center gap-4 pt-2">
                <Label className="font-semibold">Total Amount Due:</Label>
                <div className="col-span-2">
                  <span className="font-semibold">GHS {(payment.totalAmountDue || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Total Amount Paid:</Label>
                <div className="col-span-2">
                  <span className="font-semibold text-green-600">GHS {(payment.totalAmountPaid || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Total Balance:</Label>
                <div className="col-span-2">
                  <span className={`font-semibold ${(payment.totalBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    GHS {(payment.totalBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Fee Category:</Label>
                <div className="col-span-2">
                  <span>{payment.categoryName || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Amount Due:</Label>
                <div className="col-span-2">
                  <span className="font-semibold">GHS {(payment.amountDue || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Amount Paid:</Label>
                <div className="col-span-2">
                  <span className="font-semibold text-green-600">GHS {(payment.amountPaid || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="font-semibold">Balance:</Label>
                <div className="col-span-2">
                  <span className={`font-semibold ${(payment.remainingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    GHS {(payment.remainingBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
