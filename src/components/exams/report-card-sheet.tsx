"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportReportCardToPDF } from "@/lib/pdf-utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { ReportCardPerformanceChart } from "./report-card-performance-chart";
import {
  PrintLayoutSettings,
  type PrintLayoutOptions,
} from "./print-layout-settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GradingScaleDisplayProps {
  gradingScaleId?: Id<"gradingScales">;
  gradingScaleName?: string;
}

function GradingScaleDisplay({
  gradingScaleId,
  gradingScaleName,
}: GradingScaleDisplayProps) {
  const gradingScale = useQuery(
    api.grading.getGradingScaleById,
    gradingScaleId ? { scaleId: gradingScaleId } : "skip",
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
        {grades.map(
          (
            grade: {
              grade: string | number;
              minPercent: number;
              maxPercent: number;
              remark: string;
            },
            index: number,
          ) => (
            <div key={index}>
              {grade.minPercent}-{grade.maxPercent}: Grade {grade.grade} -{" "}
              {grade.remark}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

interface ReportCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCardId: Id<"reportCards">;
}

export function ReportCardSheet({
  open,
  onOpenChange,
  reportCardId,
}: ReportCardSheetProps) {
  const reportCard = useQuery(api.reportCards.getReportCardById, {
    reportId: reportCardId,
  });

  // Fetch academic year details
  const academicYear = useQuery(
    api.academicYears.getYearById,
    reportCard?.academicYearId
      ? { yearId: reportCard.academicYearId as Id<"academicYears"> }
      : "skip",
  );

  // Fetch term details
  const term = useQuery(
    api.terms.getTermById,
    reportCard?.termId ? { termId: reportCard.termId as Id<"terms"> } : "skip",
  );

  // Fetch student details for photo using studentId field
  const student = useQuery(
    api.students.getStudentByStudentId,
    reportCard?.studentId ? { studentId: reportCard.studentId } : "skip",
  );

  // Get photo URL from storage
  const photoUrl = useQuery(
    api.students.getStudentPhotoUrl,
    student?.photoStorageId ? { storageId: student.photoStorageId } : "skip",
  );

  if (!reportCard) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Loading Report Card</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading report card...
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const subjects = reportCard.subjects ? JSON.parse(reportCard.subjects) : [];
  const attendance = reportCard.attendance
    ? JSON.parse(reportCard.attendance)
    : null;

  const handleDownload = (options?: PrintLayoutOptions): void => {
    // Enrich report card with fetched names and photo
    const enrichedReport = {
      ...reportCard,
      academicYearName:
        academicYear?.yearName || reportCard.academicYearName || "N/A",
      termName: term?.termName || reportCard.termName || "N/A",
      photoUrl: photoUrl || undefined,
    };
    exportReportCardToPDF(enrichedReport, options);
  };

  const handlePrint = (options?: PrintLayoutOptions): void => {
    // Enrich report card with fetched names and photo
    const enrichedReport = {
      ...reportCard,
      academicYearName:
        academicYear?.yearName || reportCard.academicYearName || "N/A",
      termName: term?.termName || reportCard.termName || "N/A",
      photoUrl: photoUrl || undefined,
    };
    exportReportCardToPDF(enrichedReport, options);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Report Card Preview</SheetTitle>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleDownload()}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => handlePrint()} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <PrintLayoutSettings
              onDownload={handleDownload}
              onPrint={handlePrint}
            />
          </div>
        </SheetHeader>

        <div className="mt-6 bg-white text-black p-6 border-2 border-black">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1" />
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold">
                  {reportCard.schoolName || "SCHOOL NAME"}
                </h1>
                <p className="text-sm">
                  {reportCard.schoolAddress || "Address not available"}
                </p>
                <p className="text-sm">
                  Tel: {reportCard.schoolPhone || "N/A"}
                </p>
                <h2 className="text-xl font-bold mt-4">PUPILS TERMLY REPORT</h2>
              </div>
              <div className="flex-1 flex justify-end">
                {photoUrl && (
                  <Avatar className="h-24 w-24 border-2 border-black">
                    <AvatarImage src={photoUrl} alt={reportCard.studentName} />
                    <AvatarFallback className="text-2xl">
                      {reportCard.studentName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {reportCard.studentName}
              </p>
              <p>
                <span className="font-semibold">Class:</span>{" "}
                {reportCard.className}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Year:</span>{" "}
                {academicYear?.yearName || reportCard.academicYearName || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Term:</span>{" "}
                {term?.termName || reportCard.termName || "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p>
                <span className="font-semibold">Raw Score:</span>{" "}
                {reportCard.rawScore.toFixed(1)}
              </p>
              <p>
                <span className="font-semibold">Total Score:</span>{" "}
                {reportCard.totalScore.toFixed(1)}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Overall Percentage:</span>{" "}
                {reportCard.percentage.toFixed(1)}%
              </p>
              <p>
                <span className="font-semibold">Overall Grade:</span>{" "}
                {reportCard.overallGrade}
              </p>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="border-2 border-black mb-6 rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-black bg-gray-100 hover:bg-gray-100">
                  <TableHead className="border-r border-black text-black font-bold text-left">
                    SUBJECT
                  </TableHead>
                  <TableHead className="border-r border-black text-black font-bold text-center">
                    CLASS SCORE (%)
                  </TableHead>
                  <TableHead className="border-r border-black text-black font-bold text-center">
                    EXAMS SCORE (%)
                  </TableHead>
                  <TableHead className="border-r border-black text-black font-bold text-center">
                    TOTAL SCORE (%)
                  </TableHead>
                  <TableHead className="border-r border-black text-black font-bold text-center">
                    POSITION
                  </TableHead>
                  <TableHead className="border-r border-black text-black font-bold text-center">
                    GRADE
                  </TableHead>
                  <TableHead className="text-black font-bold text-center">
                    REMARKS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map(
                  (
                    subject: {
                      subjectName: string;
                      classScore: number;
                      examScore: number;
                      totalScore: number;
                      position: number;
                      grade: string;
                      remarks: string;
                    },
                    index: number,
                  ) => (
                    <TableRow
                      key={index}
                      className="border-b border-black hover:bg-gray-50"
                    >
                      <TableCell className="border-r border-black text-left">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell className="border-r border-black text-center">
                        {subject.classScore}
                      </TableCell>
                      <TableCell className="border-r border-black text-center">
                        {subject.examScore}
                      </TableCell>
                      <TableCell className="border-r border-black text-center font-semibold">
                        {subject.totalScore}
                      </TableCell>
                      <TableCell className="border-r border-black text-center">
                        {subject.position}
                      </TableCell>
                      <TableCell className="border-r border-black text-center font-semibold">
                        {subject.grade}
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.remarks}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>

          {/* Performance Chart */}
          <div className="mb-6 border-2 border-black p-4">
            <ReportCardPerformanceChart subjects={subjects} />
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
                <p>
                  <span className="font-semibold">Attendance:</span>{" "}
                  {attendance.present} / {attendance.total}
                </p>
              )}
              {reportCard.promotionStatus && (
                <p>
                  <span className="font-semibold">Promoted To:</span>{" "}
                  {reportCard.promotionStatus}
                </p>
              )}
              {reportCard.position && (
                <p>
                  <span className="font-semibold">Position:</span>{" "}
                  {reportCard.position} / {reportCard.totalStudents}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {reportCard.conduct && (
                <p>
                  <span className="font-semibold">Conduct:</span>{" "}
                  {reportCard.conduct}
                </p>
              )}
              {reportCard.attitude && (
                <p>
                  <span className="font-semibold">Attitude:</span>{" "}
                  {reportCard.attitude}
                </p>
              )}
              {reportCard.interest && (
                <p>
                  <span className="font-semibold">Interest:</span>{" "}
                  {reportCard.interest}
                </p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4 mb-8">
            {reportCard.classTeacherComment && (
              <div className="border border-black p-3">
                <p className="font-semibold text-sm mb-1">
                  Class Teacher&apos;s Remarks:
                </p>
                <p className="text-sm">{reportCard.classTeacherComment}</p>
              </div>
            )}

            {reportCard.headmasterComment && (
              <div className="border border-black p-3">
                <p className="font-semibold text-sm mb-1">
                  Headmaster&apos;s Remarks:
                </p>
                <p className="text-sm">{reportCard.headmasterComment}</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="text-center">
              <div className="border-t border-black pt-2 mt-8">
                Class Teacher&apos;s Sign
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2 mt-8">
                Headmaster&apos;s Sign
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
