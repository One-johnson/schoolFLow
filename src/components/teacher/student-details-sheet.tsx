'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  User,
  Phone,
  Mail,

  MapPin,
  CreditCard,
  Users,
  AlertCircle,
  Heart,
} from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface StudentDetailsSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailsSheet({
  studentId,
  open,
  onOpenChange,
}: StudentDetailsSheetProps) {
  const student = useQuery(
    api.students.getStudentById,
    studentId ? { studentId: studentId as Id<'students'> } : 'skip'
  );

  const feePayments = useQuery(
    api.feePayments.getFeePaymentsByStudentId,
    studentId ? { studentId } : 'skip'
  );

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'continuing':
      case 'fresher':
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl overflow-y-auto">
        {student === undefined ? (
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : student === null ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Student not found</p>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {student.photoUrl && (
                    <AvatarImage
                      src={student.photoUrl}
                      alt={`${student.firstName} ${student.lastName}`}
                    />
                  )}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-left">
                    {student.firstName} {student.lastName}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">{student.studentId}</p>
                  <Badge className={`mt-1 ${getStatusColor(student.status)}`}>
                    {student.status}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="capitalize">{student.gender}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span>{formatDate(student.dateOfBirth)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <span>{student.className}</span>
                  </div>
                  {student.rollNumber && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Roll Number</span>
                        <span>{student.rollNumber}</span>
                      </div>
                    </>
                  )}
                  {student.admissionNumber && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admission No.</span>
                        <span>{student.admissionNumber}</span>
                      </div>
                    </>
                  )}
                  {student.admissionDate && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admission Date</span>
                        <span>{formatDate(student.admissionDate)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {(student.email || student.phone || student.address) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    {student.email && (
                      <>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${student.email}`}
                            className="text-primary hover:underline truncate"
                          >
                            {student.email}
                          </a>
                        </div>
                        <Separator />
                      </>
                    )}
                    {student.phone && (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${student.phone}`}
                            className="text-primary hover:underline"
                          >
                            {student.phone}
                          </a>
                        </div>
                        <Separator />
                      </>
                    )}
                    {student.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parent/Guardian Contact */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parent/Guardian
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{student.parentName}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relationship</span>
                    <span className="capitalize">{student.relationship}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <a
                      href={`tel:${student.parentPhone}`}
                      className="text-primary hover:underline"
                    >
                      {student.parentPhone}
                    </a>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <a
                      href={`mailto:${student.parentEmail}`}
                      className="text-primary hover:underline truncate max-w-45"
                    >
                      {student.parentEmail}
                    </a>
                  </div>
                  {student.parentOccupation && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Occupation</span>
                        <span>{student.parentOccupation}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {student.emergencyContactName && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Emergency Contact
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span>{student.emergencyContactName}</span>
                    </div>
                    {student.emergencyContactPhone && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <a
                            href={`tel:${student.emergencyContactPhone}`}
                            className="text-primary hover:underline"
                          >
                            {student.emergencyContactPhone}
                          </a>
                        </div>
                      </>
                    )}
                    {student.emergencyContactRelationship && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Relationship</span>
                          <span className="capitalize">{student.emergencyContactRelationship}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Information */}
              {(student.allergies || student.medicalConditions) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Medical Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    {student.allergies && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Allergies</span>
                        <p className="bg-red-50 text-red-700 p-2 rounded text-sm">
                          {student.allergies}
                        </p>
                      </div>
                    )}
                    {student.medicalConditions && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Medical Conditions</span>
                        <p className="bg-yellow-50 text-yellow-700 p-2 rounded text-sm">
                          {student.medicalConditions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fee Payments */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Fee Payments
                </h3>
                {!feePayments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : feePayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                    No payment records found
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {feePayments.slice(0, 5).map((payment, index) => (
                      <AccordionItem key={payment._id} value={payment._id}>
                        <AccordionTrigger className="hover:no-underline py-2">
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
                              <p className="font-semibold text-sm">
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
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
