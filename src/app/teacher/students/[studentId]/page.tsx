'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    student && student.studentId ? { studentId: student.studentId } : 'skip'
  );

  const feeObligations = useQuery(
    api.feePayments.getFeeObligationsForParent,
    teacher && student
      ? { schoolId: teacher.schoolId, studentIds: [student._id, student.studentId] }
      : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `GHS ${amount.toFixed(2)}`;
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

  const handleExportPDF = () => {
    if (!student) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // School header - name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(school?.name || 'SCHOOL NAME', pageWidth / 2, yPos, {
      align: 'center',
    });

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // School address (wrapped)
    if (school?.address) {
      const addressLines = doc.splitTextToSize(String(school.address), contentWidth);
      doc.text(addressLines, pageWidth / 2, yPos, {
        align: 'center',
      });
      yPos += addressLines.length * 5;
    }

    // School phone
    if (school?.phone) {
      doc.text(`Tel: ${school.phone}`, pageWidth / 2, yPos, {
        align: 'center',
      });
      yPos += 6;
    } else {
      yPos += 4;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT PROFILE', pageWidth / 2, yPos, { align: 'center' });

    // Reserve a fixed header block for photo + summary so nothing overlaps it
    const headerBlockTop = yPos;
    const headerBlockHeight = 40;
    const leftX = margin;

    yPos += 8;

    // Optional student photo (top-right inside header block)
    const photoSize = 30;
    const photoX = pageWidth - margin - photoSize;
    const photoY = headerBlockTop + 6;

    if (student.photoUrl) {
      try {
        doc.addImage(student.photoUrl, 'JPEG', photoX, photoY, photoSize, photoSize);
      } catch {
        // Ignore photo errors
      }
    }

    // Student basic info in the header block
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    let infoY = headerBlockTop + 12;
    doc.text('Name:', leftX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student.firstName} ${student.lastName}`, leftX + 22, infoY);

    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Student ID:', leftX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(student.studentId, leftX + 22, infoY);

    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', leftX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(student.className || '', leftX + 22, infoY);

    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', leftX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(student.status, leftX + 22, infoY);

    // Move below header block so following sections never overlap photo/summary
    yPos = headerBlockTop + headerBlockHeight + 4;

    // Personal information (table)
    const personalRows: string[][] = [
      ['Gender', student.gender ?? ''],
      ['Date of Birth', formatDate(student.dateOfBirth)],
      ['Class', student.className || ''],
      ['Roll Number', student.rollNumber ? String(student.rollNumber) : ''],
      [
        'Admission No.',
        student.admissionNumber ? String(student.admissionNumber) : '',
      ],
      [
        'Admission Date',
        student.admissionDate ? formatDate(student.admissionDate) : '',
      ],
    ].filter(([, value]) => value);

    if (personalRows.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Personal Information', leftX, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: personalRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // Contact information (table)
    const contactRows: string[][] = [];
    if (student.email) contactRows.push(['Email', student.email]);
    if (student.phone) contactRows.push(['Phone', student.phone]);
    if (student.address) contactRows.push(['Address', student.address]);

    if (contactRows.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Contact Information', leftX, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: contactRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // Parent/Guardian (table)
    const parentRows: string[][] = [
      ['Name', student.parentName],
      ['Relationship', student.relationship],
      ['Phone', student.parentPhone],
    ];
    if (student.parentEmail) {
      parentRows.push(['Email', student.parentEmail]);
    }
    if (student.parentOccupation) {
      parentRows.push(['Occupation', student.parentOccupation]);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Parent / Guardian', leftX, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: parentRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      margin: { left: margin, right: margin },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 6;

    // Emergency contact (table)
    if (student.emergencyContactName) {
      const emergencyRows: string[][] = [['Name', student.emergencyContactName]];
      if (student.emergencyContactPhone) {
        emergencyRows.push(['Phone', student.emergencyContactPhone]);
      }
      if (student.emergencyContactRelationship) {
        emergencyRows.push([
          'Relationship',
          student.emergencyContactRelationship,
        ]);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Emergency Contact', leftX, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: emergencyRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // Medical information (table)
    if (student.allergies || student.medicalConditions) {
      const medicalRows: string[][] = [];
      if (student.allergies) {
        const value: string = Array.isArray(student.allergies)
          ? student.allergies.join(', ')
          : String(student.allergies);
        medicalRows.push(['Allergies', value]);
      }
      if (student.medicalConditions) {
        const value: string = Array.isArray(student.medicalConditions)
          ? student.medicalConditions.join(', ')
          : String(student.medicalConditions);
        medicalRows.push(['Medical Conditions', value]);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Medical Information', leftX, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Details']],
        body: medicalRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    // Fee summary (table) - use obligations as source of truth
    if (feeObligations && feeObligations.length > 0) {
      let totalDue = 0;
      let totalPaid = 0;
      let totalBalance = 0;

      for (const o of feeObligations) {
        const due = o.totalAmountDue ?? 0;
        const paid = o.totalAmountPaid ?? 0;
        const balance = o.totalBalance ?? Math.max(due - paid, 0);
        totalDue += due;
        totalPaid += paid;
        totalBalance += balance;
      }

      let lastPaymentDate = 'No payments yet';
      let statusLabel = totalBalance <= 0 ? 'Paid' : 'Pending';

      if (feePayments && feePayments.length > 0) {
        const sortedPayments = [...feePayments].sort(
          (a, b) =>
            new Date(a.paymentDate).getTime() -
            new Date(b.paymentDate).getTime()
        );
        const latest = sortedPayments[sortedPayments.length - 1];
        lastPaymentDate = formatDate(latest.paymentDate);
        statusLabel = latest.paymentStatus
          ? latest.paymentStatus.charAt(0).toUpperCase() +
            latest.paymentStatus.slice(1)
          : totalBalance <= 0
            ? 'Paid'
            : 'Partial';
      }

      const feeRows: string[][] = [
        ['Total Fees (Current)', formatCurrency(totalDue)],
        ['Total Paid', formatCurrency(totalPaid)],
        ['Outstanding Balance', formatCurrency(totalBalance)],
        ['Last Payment Date', lastPaymentDate],
        ['Last Payment Status', statusLabel],
      ];

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Fee Summary', leftX, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: feeRows,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        margin: { left: margin, right: margin },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPos = (doc as any).lastAutoTable.finalY + 6;
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
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
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
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
          ) : (
            <>
              {/* Fee summary from fee obligations / fee structure */}
              {feeObligations && feeObligations.length > 0 && (
                <div className="mb-4 grid gap-2 sm:grid-cols-3 text-sm">
                  {(() => {
                    let totalDue = 0;
                    let totalPaid = 0;
                    let totalBalance = 0;

                    for (const o of feeObligations) {
                      const due = o.totalAmountDue ?? 0;
                      const paid = o.totalAmountPaid ?? 0;
                      const balance = o.totalBalance ?? Math.max(due - paid, 0);
                      totalDue += due;
                      totalPaid += paid;
                      totalBalance += balance;
                    }

                    return (
                      <>
                        <div className="flex flex-col rounded border bg-muted/40 px-3 py-2">
                          <span className="text-xs text-muted-foreground">
                            Total Fees (Current)
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(totalDue)}
                          </span>
                        </div>
                        <div className="flex flex-col rounded border bg-muted/40 px-3 py-2">
                          <span className="text-xs text-muted-foreground">
                            Total Paid
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(totalPaid)}
                          </span>
                        </div>
                        <div className="flex flex-col rounded border bg-muted/40 px-3 py-2">
                          <span className="text-xs text-muted-foreground">
                            Outstanding Balance
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(totalBalance)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {feePayments.length === 0 ? (
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
                              {formatCurrency(payment.amount || 0)}
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
                              <span className="text-muted-foreground">
                                Reference
                              </span>
                              <span>{payment.transactionReference}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance</span>
                            <span>
                              {formatCurrency(payment.remainingBalance || 0)}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
