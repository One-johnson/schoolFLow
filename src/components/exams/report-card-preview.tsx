'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface ReportCardPreviewProps {
  reportCardId: Id<'reportCards'>;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function ReportCardPreview({ reportCardId, onDownload, onPrint }: ReportCardPreviewProps) {
  const reportCard = useQuery(api.reportCards.getReportCardById, { reportId: reportCardId });

  if (!reportCard) {
    return <div className="text-center p-8">Loading report card...</div>;
  }

  const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
  const attendance = reportCard.attendance ? JSON.parse(reportCard.attendance) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {onDownload && (
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
        {onPrint && (
          <Button onClick={onPrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>

      <Card className="max-w-4xl mx-auto bg-white text-black print:shadow-none">
        <CardHeader className="text-center border-b-2 border-black pb-6">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">SCHOOL NAME</CardTitle>
            <p className="text-sm">P.O. Box 123, Location</p>
            <p className="text-sm">Tel: 0XX-XXX-XXXX</p>
            <h2 className="text-xl font-bold mt-4">PUPILS TERMLY REPORT</h2>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">Name:</span> {reportCard.studentName}</p>
              <p><span className="font-semibold">Class:</span> {reportCard.className}</p>
            </div>
            <div>
              <p><span className="font-semibold">Year:</span> {reportCard.academicYearId}</p>
              <p><span className="font-semibold">Term:</span> {reportCard.termId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
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
          <div className="border-2 border-black">
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

          {/* Student Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
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
          <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
            <div className="text-center">
              <div className="border-t border-black pt-2">Class Teacher's Sign</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2">Headmaster's Sign</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
