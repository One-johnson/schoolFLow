'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { exportReportCardToPDF } from '@/lib/pdf.utils';
import type { Id } from '../../../convex/_generated/dataModel';

interface GradingScaleDisplayProps {
  gradingScaleId?: Id<'gradingScales'>;
  gradingScaleName?: string;
}

function GradingScaleDisplay({ gradingScaleId, gradingScaleName }: GradingScaleDisplayProps) {
  const gradingScale = useQuery(
    api.grading.getGradingScaleById,
    gradingScaleId ? { scaleId: gradingScaleId } : 'skip'
  );

  // Parse grades from grading scale
  const grades = gradingScale?.grades ? JSON.parse(gradingScale.grades) : null;

  if (!grades || grades.length === 0) {
    // Fallback to default grading scale
    return (
      <div className="border-2 border-black p-3">
        <h3 className="font-bold text-sm mb-2">GRADING SCALE</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>80-100: Grade 1 - Excellent</div>
          <div>70-79: Grade 2 - Very Good</div>
          <div>65-69: Grade 3 - Good</div>
          <div>60-64: Grade 4 - High Average</div>
          <div>55-59: Grade 5 - Average</div>
          <div>50-54: Grade 6 - Low Average</div>
          <div>45-49: Grade 7 - Pass</div>
          <div>40-44: Grade 8 - Pass</div>
          <div>0-39: Grade 9 - Fail</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-black p-3">
      <h3 className="font-bold text-sm mb-2">
        GRADING SCALE {gradingScaleName && `(${gradingScaleName})`}
      </h3>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {grades.map((grade: { grade: string | number; minPercent: number; maxPercent: number; remark: string }, index: number) => (
          <div key={index}>
            {grade.minPercent}-{grade.maxPercent}: Grade {grade.grade} - {grade.remark}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReportCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCardId: Id<'reportCards'>;
}

export function ReportCardSheet({ open, onOpenChange, reportCardId }: ReportCardSheetProps) {
  const reportCard = useQuery(api.reportCards.getReportCardById, { reportId: reportCardId });

  if (!reportCard) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <div className="text-center p-8">Loading report card...</div>
        </SheetContent>
      </Sheet>
    );
  }

  const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
  const attendance = reportCard.attendance ? JSON.parse(reportCard.attendance) : null;

  const handleDownload = (): void => {
    exportReportCardToPDF(reportCard);
  };

  const handlePrint = (): void => {
    exportReportCardToPDF(reportCard);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Report Card Preview</SheetTitle>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 bg-white text-black p-6 border-2 border-black">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-6 mb-6">
            <h1 className="text-2xl font-bold">{reportCard.schoolName || 'SCHOOL NAME'}</h1>
            <p className="text-sm">{reportCard.schoolAddress || 'Address not available'}</p>
            <p className="text-sm">Tel: {reportCard.schoolPhone || 'N/A'}</p>
            <h2 className="text-xl font-bold mt-4">PUPILS TERMLY REPORT</h2>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p><span className="font-semibold">Name:</span> {reportCard.studentName}</p>
              <p><span className="font-semibold">Class:</span> {reportCard.className}</p>
            </div>
            <div>
              <p><span className="font-semibold">Year:</span> {reportCard.academicYearName || reportCard.academicYearId || 'N/A'}</p>
              <p><span className="font-semibold">Term:</span> {reportCard.termName || reportCard.termId || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p><span className="font-semibold">Raw Score:</span> {reportCard.rawScore.toFixed(1)}</p>
              <p><span className="font-semibold">Total Score:</span> {reportCard.totalScore.toFixed(1)}</p>
            </div>
            <div>
              <p><span className="font-semibold">Overall Percentage:</span> {reportCard.percentage.toFixed(1)}%</p>
              <p><span className="font-semibold">Overall Grade:</span> {reportCard.overallGrade}</p>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="border-2 border-black mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100">
                  <th className="border-r border-black p-2 text-left">SUBJECT</th>
                  <th className="border-r border-black p-2">CLASS SCORE (%)</th>
                  <th className="border-r border-black p-2">EXAMS SCORE (%)</th>
                  <th className="border-r border-black p-2">TOTAL SCORE (%)</th>
                  <th className="border-r border-black p-2">POSITION</th>
                  <th className="border-r border-black p-2">GRADE</th>
                  <th className="p-2">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject: {
                  subjectName: string;
                  classScore: number;
                  examScore: number;
                  totalScore: number;
                  position: number;
                  grade: string;
                  remarks: string;
                }, index: number) => (
                  <tr key={index} className="border-b border-black">
                    <td className="border-r border-black p-2">{subject.subjectName}</td>
                    <td className="border-r border-black p-2 text-center">{subject.classScore}</td>
                    <td className="border-r border-black p-2 text-center">{subject.examScore}</td>
                    <td className="border-r border-black p-2 text-center font-semibold">{subject.totalScore}</td>
                    <td className="border-r border-black p-2 text-center">{subject.position}</td>
                    <td className="border-r border-black p-2 text-center font-semibold">{subject.grade}</td>
                    <td className="p-2 text-center">{subject.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grading Scale */}
          <div className="mb-6">
            <GradingScaleDisplay
              gradingScaleId={reportCard.gradingScaleId}
              gradingScaleName={reportCard.gradingScaleName}
            />
          </div>

          {/* Student Details */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div className="space-y-2">
              {attendance && (
                <p><span className="font-semibold">Attendance:</span> {attendance.present} / {attendance.total}</p>
              )}
              {reportCard.promotionStatus && (
                <p><span className="font-semibold">Promoted To:</span> {reportCard.promotionStatus}</p>
              )}
              {reportCard.position && (
                <p><span className="font-semibold">Position:</span> {reportCard.position} / {reportCard.totalStudents}</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4 mb-8">
            {reportCard.classTeacherComment && (
              <div className="border border-black p-3">
                <p className="font-semibold text-sm mb-1">Class Teacher's Remarks:</p>
                <p className="text-sm">{reportCard.classTeacherComment}</p>
              </div>
            )}

            {reportCard.headmasterComment && (
              <div className="border border-black p-3">
                <p className="font-semibold text-sm mb-1">Headmaster's Remarks:</p>
                <p className="text-sm">{reportCard.headmasterComment}</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="border-t border-black pt-2 mt-8">Class Teacher's Sign</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2 mt-8">Headmaster's Sign</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
