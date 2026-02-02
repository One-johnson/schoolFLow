'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Eye, Edit2 } from 'lucide-react';
import { ReportCardEditSheet } from '@/components/teacher/report-card-edit-sheet';
import type { Id } from '../../../../convex/_generated/dataModel';

export default function TeacherReportsPage() {
  const { teacher } = useTeacherAuth();
  const [selectedReportId, setSelectedReportId] = useState<Id<'reportCards'> | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const classId = teacher?.classIds?.[0];

  // Get report cards - filter by class
  const allReportCards = useQuery(
    api.reportCards.getReportCardsBySchool,
    teacher ? { schoolId: teacher.schoolId } : 'skip'
  );

  // Filter report cards by class
  const reportCards = allReportCards?.filter((report) => report.classId === classId);

  const handleOpenReport = (reportId: Id<'reportCards'>) => {
    setSelectedReportId(reportId);
    setIsSheetOpen(true);
  };

  const selectedReport = reportCards?.find((r) => r._id === selectedReportId);

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-xl font-bold">Report Cards</h1>

      {/* Report Count */}
      {reportCards && (
        <p className="text-sm text-muted-foreground">
          {reportCards.length} report card{reportCards.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Report Cards List */}
      <div className="space-y-3">
        {!reportCards ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : reportCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No report cards found</p>
          </div>
        ) : (
          reportCards.map((report) => {
            const isDraft = report.status === 'draft';
            return (
              <Card
                key={report._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOpenReport(report._id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{report.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.termName || report.className}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        report.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : report.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {report.status}
                    </span>
                    {isDraft ? (
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Report Card Edit Sheet */}
      {selectedReport && (
        <ReportCardEditSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          report={{
            _id: selectedReport._id,
            studentName: selectedReport.studentName,
            examName: selectedReport.termName || 'Term Report',
            className: selectedReport.className,
            status: selectedReport.status,
            totalScore: selectedReport.totalScore,
            averageScore: selectedReport.percentage,
            position: selectedReport.position,
            totalStudents: selectedReport.totalStudents,
            grade: selectedReport.overallGrade,
            classTeacherComment: selectedReport.classTeacherComment,
            classTeacherSign: selectedReport.classTeacherSign,
          }}
          teacherId={teacher.id}
        />
      )}
    </div>
  );
}
