'use client';

import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useOnlineStatus } from './offline-banner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, Save } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface ReportCard {
  _id: Id<'reportCards'>;
  studentName: string;
  examName: string;
  className: string;
  status: string;
  totalScore?: number;
  averageScore?: number;
  position?: number;
  totalStudents?: number;
  grade?: string;
  classTeacherComment?: string;
  classTeacherSign?: string;
  subjectScores?: Array<{
    subjectName: string;
    score: number;
    grade?: string;
    remarks?: string;
  }>;
}

interface ReportCardEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportCard | null;
  teacherId: string;
}

export function ReportCardEditSheet({
  open,
  onOpenChange,
  report,
  teacherId,
}: ReportCardEditSheetProps) {
  const isOnline = useOnlineStatus();
  const [comment, setComment] = useState('');
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updateReportCard = useMutation(api.reportCards.updateReportCard);

  // Reset form when report changes
  useEffect(() => {
    if (report) {
      setComment(report.classTeacherComment || '');
      setSignature(report.classTeacherSign || '');
    }
  }, [report]);

  const isDraft = report?.status === 'draft';
  const canEdit = isDraft;

  const handleSave = async () => {
    if (!isOnline) {
      toast.error('You must be online to save changes');
      return;
    }

    if (!report) return;

    setIsSaving(true);
    try {
      await updateReportCard({
        reportId: report._id,
        updatedBy: teacherId,
        classTeacherComment: comment,
        classTeacherSign: signature,
      });
      toast.success('Report card updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update report card:', error);
      toast.error('Failed to update report card');
    } finally {
      setIsSaving(false);
    }
  };

  if (!report) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Card
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-140px)]">
          <div className="space-y-6 pr-4">
            {/* Student Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{report.studentName}</h3>
              <p className="text-sm text-muted-foreground">
                {report.examName} • {report.className}
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                {report.averageScore !== undefined && (
                  <span>Average: <strong>{report.averageScore.toFixed(1)}%</strong></span>
                )}
                {report.position && report.totalStudents && (
                  <span>Position: <strong>{report.position}/{report.totalStudents}</strong></span>
                )}
                {report.grade && (
                  <span>Grade: <strong>{report.grade}</strong></span>
                )}
              </div>
            </div>

            {/* Subject Scores (Read-only) */}
            {report.subjectScores && report.subjectScores.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Subject Scores</h4>
                <div className="space-y-2">
                  {report.subjectScores.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="text-sm">{subject.subjectName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{subject.score}%</span>
                        {subject.grade && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {subject.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Class Teacher&apos;s Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter your comment for this student..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!canEdit}
                rows={4}
              />
              {!canEdit && (
                <p className="text-xs text-muted-foreground">
                  Comments can only be edited on draft report cards
                </p>
              )}
            </div>

            {/* Teacher Signature */}
            <div className="space-y-2">
              <Label htmlFor="signature">Class Teacher&apos;s Signature</Label>
              <Input
                id="signature"
                placeholder="Type your name as signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4">
          {canEdit ? (
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
