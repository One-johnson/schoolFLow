'use client';

import { useParams } from 'next/navigation';
import { useParentAuth } from '@/hooks/useParentAuth';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardCheck, BookOpen, FileText, Wallet, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import { exportReportCardToPDF, exportReportCardToPDFAsBlob } from '@/lib/pdf-utils';
import { generateFeeReceipt, generateFeeReceiptAsBlob } from '@/lib/fee-exports';
import { shareOrDownloadFile } from '@/lib/share-utils';
import { exportToPDF } from '@/lib/exports';
import { toast } from 'sonner';

export default function ParentChildDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const { parent } = useParentAuth();

  const student = parent?.students?.find((s) => s.id === studentId);

  const attendanceRecords = useQuery(
    api.attendance.getStudentAttendanceHistory,
    parent && studentId ? { schoolId: parent.schoolId, studentId } : 'skip'
  );

  const marks = useQuery(
    api.marks.getStudentAllMarks,
    parent && studentId ? { schoolId: parent.schoolId, studentId } : 'skip'
  );

  const reportCards = useQuery(
    api.reportCards.getReportCardsBySchool,
    parent ? { schoolId: parent.schoolId } : 'skip'
  );

  const obligations = useQuery(
    api.feePayments.getFeeObligationsForParent,
    parent && student
      ? { schoolId: parent.schoolId, studentIds: [studentId, student.studentId] }
      : 'skip'
  );

  const payments = useQuery(
    api.feePayments.getPaymentsByStudent,
    parent && student
      ? { schoolId: parent.schoolId, studentId: student.studentId }
      : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    parent?.schoolId ? { schoolId: parent.schoolId } : 'skip'
  );

  const studentReportCards = reportCards?.filter(
    (r) => (r.studentId === studentId || (student && r.studentId === student.studentId)) && r.status === 'published'
  ) ?? [];

  function safeParseItems(items: string | undefined): Array<{ categoryName: string; amountDue: number; amountPaid: number }> {
    if (!items) return [];
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }

  const handleReportCardDownload = (r: (typeof studentReportCards)[0]) => {
    const enriched = {
      ...r,
      academicYearName: r.academicYearName ?? 'N/A',
      termName: r.termName ?? 'N/A',
    };
    exportReportCardToPDF(enriched);
    toast.success('Report card downloaded');
  };

  const handleReportCardShare = async (r: (typeof studentReportCards)[0]) => {
    const enriched = {
      ...r,
      academicYearName: r.academicYearName ?? 'N/A',
      termName: r.termName ?? 'N/A',
    };
    const blob = exportReportCardToPDFAsBlob(enriched);
    const shared = await shareOrDownloadFile(
      blob,
      `report-card-${r.termName ?? r.reportCode}-${student?.firstName}-${student?.lastName}.pdf`,
      `${student?.firstName} ${student?.lastName} - ${r.termName ?? 'Report'}`
    );
    toast.success(shared ? 'Report card shared' : 'Report card downloaded');
  };

  const handleMarksDownload = () => {
    if (!marks || marks.length === 0) {
      toast.error('No marks to export');
      return;
    }
    const rows = marks.map((m) => ({
      Subject: m.subjectName,
      'Class Score': m.classScore,
      'Exam Score': m.examScore,
      'Total': m.totalScore,
      'Max': m.maxMarks,
      'Percentage': `${m.percentage}%`,
      Grade: m.grade,
      Remarks: m.remarks,
    }));
    exportToPDF(rows, 'exam-results', `${student?.firstName} ${student?.lastName} - Exam Results`);
    toast.success('Exam results downloaded');
  };

  const handleReceiptDownload = (payment: NonNullable<typeof payments>[0]) => {
    if (!school) {
      toast.error('School information not available');
      return;
    }
    const items = safeParseItems(payment.items);
    generateFeeReceipt({
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      studentName: payment.studentName,
      studentId: payment.studentId,
      className: payment.className,
      items,
      totalAmountDue: payment.totalAmountDue,
      totalAmountPaid: payment.totalAmountPaid,
      remainingBalance: payment.totalBalance,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      paidBy: payment.paidBy,
      collectedByName: payment.collectedByName,
      schoolName: school.name,
      schoolAddress: school.address ?? '',
      schoolPhone: school.phone ?? '',
    });
    toast.success('Receipt downloaded');
  };

  const handleReceiptShare = async (payment: NonNullable<typeof payments>[0]) => {
    if (!school) {
      toast.error('School information not available');
      return;
    }
    const items = safeParseItems(payment.items);
    const blob = generateFeeReceiptAsBlob({
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      studentName: payment.studentName,
      studentId: payment.studentId,
      className: payment.className,
      items,
      totalAmountDue: payment.totalAmountDue,
      totalAmountPaid: payment.totalAmountPaid,
      remainingBalance: payment.totalBalance,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      paidBy: payment.paidBy,
      collectedByName: payment.collectedByName,
      schoolName: school.name,
      schoolAddress: school.address ?? '',
      schoolPhone: school.phone ?? '',
    });
    const shared = await shareOrDownloadFile(
      blob,
      `receipt_${payment.receiptNumber}.pdf`,
      `Fee Receipt ${payment.receiptNumber}`
    );
    toast.success(shared ? 'Receipt shared' : 'Receipt downloaded');
  };

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6 py-4">
        <Link href="/parent/children" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to children
        </Link>
        <p className="text-muted-foreground">Student not found or you do not have access.</p>
      </div>
    );
  }

  const presentCount = attendanceRecords?.filter((r) => r.status === 'present').length ?? 0;
  const totalCount = attendanceRecords?.length ?? 0;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <Link href="/parent/children" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-muted-foreground">{student.className} • {student.studentId}</p>
      </div>

      {/* Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords === undefined ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Attendance rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Present / Total days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Exam Results
          </CardTitle>
          {marks && marks.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarksDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {marks === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : marks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No marks recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {marks.map((m) => (
                <div key={m._id} className="flex justify-between py-2 border-b last:border-0">
                  <span className="font-medium">{m.subjectName}</span>
                  <span>{m.totalScore}/{m.maxMarks} ({m.percentage}%) - {m.grade}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportCards === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : studentReportCards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No published report cards yet.</p>
          ) : (
            <div className="space-y-2">
              {studentReportCards.map((r) => (
                <div key={r._id} className="flex justify-between items-center py-2 border-b last:border-0 gap-2">
                  <div className="flex-1 min-w-0">
                    <span>{r.termName ?? 'Report'}</span>
                    <span className="font-medium ml-2">{r.overallGrade} ({r.percentage}%)</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleReportCardDownload(r)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReportCardShare(r)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Fee Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obligations === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : obligations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fee obligations on record.</p>
          ) : (
            <div className="space-y-2">
              {obligations.map((o) => (
                <div key={o._id} className="flex justify-between py-2 border-b last:border-0">
                  <span>{o.termId ? 'Term fees' : 'Fees'}</span>
                  <span className={o.totalBalance > 0 ? 'text-destructive font-medium' : 'text-emerald-600'}>
                    {o.totalBalance > 0 ? `Balance: GHS ${o.totalBalance}` : 'Paid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Receipts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fee Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fee payment receipts yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p._id} className="flex justify-between items-center py-2 border-b last:border-0 gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{p.receiptNumber}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {new Date(p.paymentDate).toLocaleDateString()} • GHS {p.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleReceiptDownload(p)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleReceiptShare(p)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
