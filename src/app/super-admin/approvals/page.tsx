'use client';

import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, FileText, School, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { JSX } from 'react';

function PaymentScreenshot({ storageId }: { storageId: string }): JSX.Element {
  const fileUrl = useQuery(api.paymentProofs.getFileUrl, { storageId });

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center py-8 bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Payment Proof Screenshot
      </p>
      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={fileUrl}
          alt="Payment proof"
          className="rounded-lg border max-h-64 object-contain hover:opacity-90 transition-opacity cursor-pointer"
        />
      </a>
      <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
    </div>
  );
}

interface PaymentProof {
  _id: Id<'paymentProofs'>;
  subscriptionRequestId: string;
  schoolAdminEmail: string;
  paymentMethod: 'mobile_money' | 'bank_transfer';
  transactionId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  screenshotStorageId?: string;
  status: string;
  createdAt: string;
}

interface SchoolCreationRequest {
  _id: Id<'schoolCreationRequests'>;
  schoolAdminEmail: string;
  schoolName: string;
  email: string;
  phone: string;
  address: string;
  studentCount: number;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage(): JSX.Element {
  const pendingPayments = useQuery(api.paymentProofs.getPending) as PaymentProof[] | undefined;
  const pendingSchools = useQuery(api.schoolCreationRequests.getPending) as SchoolCreationRequest[] | undefined;

  const approvePayment = useMutation(api.paymentProofs.approve);
  const rejectPayment = useMutation(api.paymentProofs.reject);
  const approveSchool = useMutation(api.schoolCreationRequests.approve);
  const rejectSchool = useMutation(api.schoolCreationRequests.reject);

  const [selectedPayment, setSelectedPayment] = React.useState<PaymentProof | null>(null);
  const [selectedSchool, setSelectedSchool] = React.useState<SchoolCreationRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState<boolean>(false);
  const [rejectReason, setRejectReason] = React.useState<string>('');
  const [rejectType, setRejectType] = React.useState<'payment' | 'school' | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

  const handleApprovePayment = async (payment: PaymentProof): Promise<void> => {
    setIsProcessing(true);
    try {
      await approvePayment({
        id: payment._id,
        reviewedBy: 'Super Admin',
        reviewNotes: 'Payment verified and approved',
      });
      toast.success('Payment approved successfully');
    } catch (error) {
      toast.error('Failed to approve payment');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async (): Promise<void> => {
    if (!selectedPayment || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectPayment({
        id: selectedPayment._id,
        reviewedBy: 'Super Admin',
        reviewNotes: rejectReason,
      });
      toast.success('Payment rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedPayment(null);
    } catch (error) {
      toast.error('Failed to reject payment');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveSchool = async (school: SchoolCreationRequest): Promise<void> => {
    setIsProcessing(true);
    try {
      await approveSchool({
        id: school._id,
        approvedBy: 'Super Admin',
      });
      toast.success('School approved successfully');
    } catch (error) {
      toast.error('Failed to approve school');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSchool = async (): Promise<void> => {
    if (!selectedSchool || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectSchool({
        id: selectedSchool._id,
        reason: rejectReason,
      });
      toast.success('School request rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedSchool(null);
    } catch (error) {
      toast.error('Failed to reject school');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (type: 'payment' | 'school', item: PaymentProof | SchoolCreationRequest): void => {
    setRejectType(type);
    if (type === 'payment') {
      setSelectedPayment(item as PaymentProof);
    } else {
      setSelectedSchool(item as SchoolCreationRequest);
    }
    setRejectDialogOpen(true);
  };

  const handleReject = async (): Promise<void> => {
    if (rejectType === 'payment') {
      await handleRejectPayment();
    } else {
      await handleRejectSchool();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve pending payment proofs and school creation requests
        </p>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">
            <FileText className="mr-2 h-4 w-4" />
            Payment Approvals
            {pendingPayments && pendingPayments.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schools">
            <School className="mr-2 h-4 w-4" />
            School Approvals
            {pendingSchools && pendingSchools.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingSchools.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {!pendingPayments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending payment approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingPayments.map((payment: PaymentProof) => (
                <Card key={payment._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{payment.schoolAdminEmail}</CardTitle>
                        <CardDescription>
                          Submitted {format(new Date(payment.createdAt), 'PPp')}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {payment.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                        <p className="text-sm font-mono">{payment.transactionId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold">₵{payment.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                        <p className="text-sm">{format(new Date(payment.paymentDate), 'PP')}</p>
                      </div>
                    </div>

                    {payment.notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm bg-muted p-3 rounded-md">{payment.notes}</p>
                      </div>
                    )}

                    {payment.screenshotStorageId && (
                      <PaymentScreenshot storageId={payment.screenshotStorageId} />
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprovePayment(payment)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve Payment
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openRejectDialog('payment', payment)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          {!pendingSchools ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingSchools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending school approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSchools.map((school: SchoolCreationRequest) => (
                <Card key={school._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{school.schoolName}</CardTitle>
                        <CardDescription>
                          Submitted by {school.schoolAdminEmail}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{school.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-sm">{school.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                        <p className="text-sm">{school.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Student Count</p>
                        <p className="text-sm font-semibold">{school.studentCount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                        <p className="text-sm">{format(new Date(school.createdAt), 'PP')}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApproveSchool(school)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve School
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openRejectDialog('school', school)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectType === 'payment' ? 'Payment' : 'School Request'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this {rejectType === 'payment' ? 'payment proof' : 'school creation request'}.
              The school admin will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
