'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Users,
  AlertCircle,
  Heart,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const studentId = params.studentId as string;

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!student) return;

    const csvData = [
      ['Field', 'Value'],
      ['Student ID', student.studentId],
      ['First Name', student.firstName],
      ['Last Name', student.lastName],
      ['Gender', student.gender],
      ['Date of Birth', student.dateOfBirth],
      ['Class', student.className || ''],
      ['Status', student.status],
      ['Email', student.email || ''],
      ['Phone', student.phone || ''],
      ['Address', student.address || ''],
      ['Parent Name', student.parentName],
      ['Parent Phone', student.parentPhone],
      ['Parent Email', student.parentEmail],
      ['Relationship', student.relationship],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_${student.studentId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (student === undefined) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (student === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Student not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 print:py-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Student Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {student.photoUrl && (
                <AvatarImage
                  src={student.photoUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                />
              )}
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {student.firstName[0]}
                {student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-muted-foreground">{student.studentId}</p>
              <Badge className={`mt-2 ${getStatusColor(student.status)}`}>
                {student.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
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
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {student.email && (
              <>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${student.email}`} className="text-primary hover:underline truncate">
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
                  <a href={`tel:${student.phone}`} className="text-primary hover:underline">
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
            {!student.email && !student.phone && !student.address && (
              <p className="text-muted-foreground text-center py-4">No contact information available</p>
            )}
          </CardContent>
        </Card>

        {/* Parent/Guardian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parent/Guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
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
              <a href={`tel:${student.parentPhone}`} className="text-primary hover:underline">
                {student.parentPhone}
              </a>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${student.parentEmail}`} className="text-primary hover:underline truncate max-w-45">
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
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {student.emergencyContactName && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{student.emergencyContactName}</span>
              </div>
              {student.emergencyContactPhone && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <a href={`tel:${student.emergencyContactPhone}`} className="text-primary hover:underline">
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
            </CardContent>
          </Card>
        )}

        {/* Medical Information */}
        {(student.allergies || student.medicalConditions) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {student.allergies && (
                <div>
                  <span className="text-muted-foreground text-sm block mb-1">Allergies</span>
                  <p className="bg-red-50 text-red-700 p-3 rounded text-sm">
                    {student.allergies}
                  </p>
                </div>
              )}
              {student.medicalConditions && (
                <div>
                  <span className="text-muted-foreground text-sm block mb-1">Medical Conditions</span>
                  <p className="bg-yellow-50 text-yellow-700 p-3 rounded text-sm">
                    {student.medicalConditions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fee Payments */}
      <Card>
        <CardHeader>
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
            <p className="text-sm text-muted-foreground text-center py-6 bg-muted/50 rounded-lg">
              No payment records found
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {feePayments.map((payment, index) => (
                <AccordionItem key={payment._id} value={payment._id}>
                  <AccordionTrigger className="hover:no-underline py-3">
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
                        <span className="capitalize">{payment.paymentMethod?.replace('_', ' ')}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}
