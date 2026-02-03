'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, User, Phone, CreditCard } from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const student = useQuery(api.students.getStudentById, {
    studentId: studentId as Id<'students'>,
  });

  const feePayments = useQuery(api.feePayments.getFeePaymentsByStudentId, {
    studentId,
  });

  if (student === undefined) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (student === null) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Student not found</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Student Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-muted-foreground">{student.studentId}</p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gender</span>
            <span className="capitalize">{student.gender}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date of Birth</span>
            <span>{formatDate(student.dateOfBirth)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Class</span>
            <span>{student.className}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                student.status === 'continuing' || student.status === 'fresher'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {student.status}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Parent/Guardian Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Parent/Guardian Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{student.parentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <a
              href={`tel:${student.parentPhone}`}
              className="text-primary hover:underline"
            >
              {student.parentPhone}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <a
              href={`mailto:${student.parentEmail}`}
              className="text-primary hover:underline truncate max-w-45"
            >
              {student.parentEmail}
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Relationship</span>
            <span className="capitalize">{student.relationship}</span>
          </div>
        </CardContent>
      </Card>

      {/* Fee Payments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Fee Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!feePayments ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : feePayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payment records found
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {feePayments.map((payment, index) => (
                <AccordionItem key={payment._id} value={payment._id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {payment.receiptNumber || `Payment #${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(payment.totalAmountDue || 0)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            payment.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : payment.paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payment.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method</span>
                        <span className="capitalize">
                          {payment.paymentMethod?.replace('_', ' ')}
                        </span>
                      </div>
                      {payment.transactionReference && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference</span>
                          <span>{payment.transactionReference}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance</span>
                        <span>{formatCurrency(payment.remainingBalance || 0)}</span>
                      </div>
                      {payment.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-muted-foreground text-xs">Notes:</p>
                          <p className="text-xs">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
