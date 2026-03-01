"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ReportCardReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportCardId: Id<"reportCards">;
  reviewedBy: string;
  reviewedByName: string;
  onReviewComplete?: () => void;
}

export function ReportCardReviewDialog({
  open,
  onOpenChange,
  reportCardId,
  reviewedBy,
  reviewedByName,
  onReviewComplete,
}: ReportCardReviewDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [presentDays, setPresentDays] = useState<string>("");
  const [totalDays, setTotalDays] = useState<string>("");
  const [conduct, setConduct] = useState<string>("");
  const [attitude, setAttitude] = useState<string>("");
  const [interest, setInterest] = useState<string>("");
  const [classTeacherComment, setClassTeacherComment] = useState<string>("");
  const [headmasterComment, setHeadmasterComment] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState<string>("");

  const reportCard = useQuery(api.reportCards.getReportCardById, {
    reportId: reportCardId,
  });
  const reviewReportCard = useMutation(api.reportCardReview.reviewReportCard);

  const subjects = reportCard?.subjects ? JSON.parse(reportCard.subjects) : [];

  const handleSaveDraft = async (): Promise<void> => {
    setLoading(true);
    try {
      const attendance =
        presentDays && totalDays
          ? JSON.stringify({
              present: parseInt(presentDays),
              total: parseInt(totalDays),
            })
          : undefined;

      await reviewReportCard({
        reportCardId,
        attendance,
        conduct: conduct || undefined,
        attitude: attitude || undefined,
        interest: interest || undefined,
        classTeacherComment: classTeacherComment || undefined,
        headmasterComment: headmasterComment || undefined,
        reviewedBy,
        reviewedByName,
        verifyAndApprove: false,
        reviewNotes: reviewNotes || undefined,
      });

      toast.success("Report card saved as draft");
      onReviewComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save report card",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (): Promise<void> => {
    setLoading(true);
    try {
      const attendance =
        presentDays && totalDays
          ? JSON.stringify({
              present: parseInt(presentDays),
              total: parseInt(totalDays),
            })
          : undefined;

      await reviewReportCard({
        reportCardId,
        attendance,
        conduct: conduct || undefined,
        attitude: attitude || undefined,
        interest: interest || undefined,
        classTeacherComment: classTeacherComment || undefined,
        headmasterComment: headmasterComment || undefined,
        reviewedBy,
        reviewedByName,
        verifyAndApprove: true,
        reviewNotes: reviewNotes || undefined,
      });

      toast.success("Report card approved successfully");
      onReviewComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve report card",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!reportCard) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Report Card</DialogTitle>
          <DialogDescription>
            Review and add comments for {reportCard.studentName} -{" "}
            {reportCard.className}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Student Performance Summary (Read-Only) */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Performance Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Score:</span>
                  <p className="font-medium">
                    {reportCard.totalScore.toFixed(1)} / {reportCard.rawScore}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage:</span>
                  <p className="font-medium">
                    {reportCard.percentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Overall Grade:</span>
                  <p className="font-medium">{reportCard.overallGrade}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <p className="font-medium">
                    {reportCard.position} / {reportCard.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            {/* Subjects (Read-Only) */}
            <div>
              <h3 className="font-semibold mb-2">Subjects</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Subject</th>
                      <th className="text-center p-2">Class</th>
                      <th className="text-center p-2">Exam</th>
                      <th className="text-center p-2">Total</th>
                      <th className="text-center p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(
                      (
                        subject: {
                          subjectName: string;
                          classScore: number;
                          examScore: number;
                          totalScore: number;
                          grade: string;
                        },
                        index: number,
                      ) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{subject.subjectName}</td>
                          <td className="text-center p-2">
                            {subject.classScore}
                          </td>
                          <td className="text-center p-2">
                            {subject.examScore}
                          </td>
                          <td className="text-center p-2 font-semibold">
                            {subject.totalScore}
                          </td>
                          <td className="text-center p-2">{subject.grade}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Editable Review Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Review Information</h3>

              {/* Attendance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="present">Days Present</Label>
                  <Input
                    id="present"
                    type="number"
                    placeholder="e.g., 64"
                    value={presentDays}
                    onChange={(e) => setPresentDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total Days</Label>
                  <Input
                    id="total"
                    type="number"
                    placeholder="e.g., 68"
                    value={totalDays}
                    onChange={(e) => setTotalDays(e.target.value)}
                  />
                </div>
              </div>

              {/* Conduct */}
              <div className="space-y-2">
                <Label htmlFor="conduct">Conduct</Label>
                <Select value={conduct} onValueChange={setConduct}>
                  <SelectTrigger id="conduct">
                    <SelectValue placeholder="Select conduct rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Very Good">Very Good</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Needs Improvement">
                      Needs Improvement
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attitude */}
              <div className="space-y-2">
                <Label htmlFor="attitude">Attitude</Label>
                <Select value={attitude} onValueChange={setAttitude}>
                  <SelectTrigger id="attitude">
                    <SelectValue placeholder="Select attitude" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confident">Confident</SelectItem>
                    <SelectItem value="Respectful">Respectful</SelectItem>
                    <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="Cooperative">Cooperative</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interest */}
              <div className="space-y-2">
                <Label htmlFor="interest">Interest Areas</Label>
                <Input
                  id="interest"
                  placeholder="e.g., Mathematics, Science"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                />
              </div>

              {/* Class Teacher Comment */}
              <div className="space-y-2">
                <Label htmlFor="classTeacherComment">
                  Class Teacher&apos;s Comment
                </Label>
                <Textarea
                  id="classTeacherComment"
                  placeholder="Enter your comments about the student's performance..."
                  rows={3}
                  value={classTeacherComment}
                  onChange={(e) => setClassTeacherComment(e.target.value)}
                />
              </div>

              {/* Headmaster Comment */}
              <div className="space-y-2">
                <Label htmlFor="headmasterComment">
                  Headmaster&apos;s Comment
                </Label>
                <Textarea
                  id="headmasterComment"
                  placeholder="Enter headmaster's remarks (optional)..."
                  rows={3}
                  value={headmasterComment}
                  onChange={(e) => setHeadmasterComment(e.target.value)}
                />
              </div>

              {/* Internal Review Notes */}
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Internal)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Internal notes for record keeping (not visible on report card)..."
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
