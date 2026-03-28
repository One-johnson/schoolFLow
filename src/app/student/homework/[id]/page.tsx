"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentSubmitHomeworkDialog } from "@/components/homework/student-submit-homework-dialog";
import {
  StudentHomeworkDetailSidebar,
  type StudentHomeworkSummary,
} from "@/components/student/student-homework-detail-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Paperclip,
  PencilLine,
  Upload,
  CheckCircle,
  User,
} from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { homeworkPortalDraftStorageKey } from "@/lib/homework-portal-draft";

const LONG_INSTRUCTIONS_THRESHOLD = 480;

export default function StudentHomeworkDetailPage(): React.ReactNode {
  const params = useParams();
  const homeworkId = params.id as Id<"homework">;
  const { student } = useStudentAuth();
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [portalDraft, setPortalDraft] = useState("");
  const [portalSubmitting, setPortalSubmitting] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const submitSectionRef = useRef<HTMLDivElement>(null);
  const draftRestoredRef = useRef(false);

  const homework = useQuery(
    api.students.getHomeworkForStudentDetail,
    student?.id ? { studentId: student.id as Id<"students">, homeworkId } : "skip",
  );

  const summaries = useQuery(
    api.students.getHomeworkSummariesForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students">, limit: 100 } : "skip",
  );

  const submission = useQuery(
    api.homework.getSubmissionByHomeworkAndStudent,
    student?.id
      ? { homeworkId, studentId: student.id as string }
      : "skip",
  );

  const submitHomeworkAsStudent = useMutation(api.homework.submitHomeworkAsStudent);

  const submissionReady = submission !== undefined;
  const canEdit =
    submissionReady && (submission === null || submission.status === "submitted");

  const jumpToSubmit = useCallback(() => {
    submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    draftRestoredRef.current = false;
  }, [homeworkId]);

  useEffect(() => {
    if (submission === undefined) return;
    setPortalDraft(submission?.portalAnswer ?? "");
  }, [submission, submission?.portalAnswer]);

  useEffect(() => {
    if (!submissionReady || !canEdit || draftRestoredRef.current || !student?.id) return;
    if (typeof window === "undefined") return;
    const server = (submission?.portalAnswer ?? "").trim();
    if (server) {
      draftRestoredRef.current = true;
      return;
    }
    const key = homeworkPortalDraftStorageKey(student.id, homeworkId);
    try {
      const raw = localStorage.getItem(key);
      if (raw?.trim()) {
        setPortalDraft(raw);
        toast.success("Saved draft restored");
      }
    } catch {
     
    } finally {
      draftRestoredRef.current = true;
    }
  }, [submissionReady, canEdit, student?.id, homeworkId, submission?.portalAnswer, submission, student]);

  useEffect(() => {
    if (!canEdit || typeof window === "undefined" || !student?.id) return;
    const key = homeworkPortalDraftStorageKey(student.id, homeworkId);
    const t = setTimeout(() => {
      try {
        if (portalDraft.trim()) localStorage.setItem(key, portalDraft);
        else localStorage.removeItem(key);
      } catch {
       
      }
    }, 650);
    return () => clearTimeout(t);
  }, [portalDraft, canEdit, student?.id, homeworkId, student]);

  useEffect(() => {
    if (canEdit || typeof window === "undefined" || !student?.id) return;
    try {
      localStorage.removeItem(homeworkPortalDraftStorageKey(student.id, homeworkId));
    } catch {
      /* ignore */
    }
  }, [canEdit, student?.id, homeworkId, student]);

  useEffect(() => {
    if (!homework?.description) {
      setInstructionsOpen(true);
      return;
    }
    setInstructionsOpen(homework.description.length <= LONG_INSTRUCTIONS_THRESHOLD);
  }, [homework?._id, homework?.description]);

  const prevNext = useMemo(() => {
    const empty = { prev: null as StudentHomeworkSummary | null, next: null as StudentHomeworkSummary | null };
    if (!summaries?.length) return empty;
    const idx = summaries.findIndex((s) => s._id === homeworkId);
    if (idx < 0) return empty;
    return {
      prev: idx > 0 ? summaries[idx - 1] : null,
      next: idx < summaries.length - 1 ? summaries[idx + 1] : null,
    };
  }, [summaries, homeworkId]);

  const wordCount = useMemo(() => {
    const t = portalDraft.trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }, [portalDraft]);

  if (!student) {
    return null;
  }

  const studentName = `${student.firstName} ${student.lastName}`;
  const isMarked = submission?.status === "marked";

  const handleSubmitPortalAnswer = async () => {
    const trimmed = portalDraft.trim();
    if (!trimmed) {
      toast.error("Write your answer in the box before submitting.");
      return;
    }
    setPortalSubmitting(true);
    try {
      await submitHomeworkAsStudent({
        schoolId: student.schoolId,
        homeworkId,
        studentId: student.id as Id<"students">,
        portalAnswer: trimmed,
      });
      try {
        localStorage.removeItem(homeworkPortalDraftStorageKey(student.id, homeworkId));
      } catch {
        /* ignore */
      }
      toast.success("Written work submitted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setPortalSubmitting(false);
    }
  };

  const layoutShell = (body: React.ReactNode) => (
    <div className="mx-auto w-full max-w-6xl xl:max-w-7xl px-1 sm:px-2 lg:px-4 pb-12">{body}</div>
  );

  if (homework === undefined) {
    return layoutShell(
      <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10 xl:items-start">
        <div className="min-w-0 space-y-4 animate-pulse">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-10 w-full max-w-xl rounded bg-muted" />
          <div className="h-48 rounded-lg bg-muted/60" />
        </div>
        <StudentHomeworkDetailSidebar
          summaries={undefined}
          currentHomeworkId={homeworkId}
          onJumpToSubmit={() => {}}
        />
      </div>,
    );
  }

  if (homework === null) {
    return layoutShell(
      <div className="max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" className="gap-1 px-0" asChild>
          <Link href="/student/homework">
            <ArrowLeft className="h-4 w-4" />
            Back to homework
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Assignment not found</CardTitle>
            <CardDescription>It may have been removed or isn&apos;t for your class.</CardDescription>
          </CardHeader>
        </Card>
      </div>,
    );
  }

  const formatDue = new Date(homework.dueDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const descLong = (homework.description?.length ?? 0) > LONG_INSTRUCTIONS_THRESHOLD;

  return layoutShell(
    <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-10 xl:items-start">
      <main className="min-w-0 space-y-8 text-left">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" className="gap-1 px-0 w-fit" asChild>
            <Link href="/student/homework">
              <ArrowLeft className="h-4 w-4" />
              All homework
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <BookOpen className="h-6 w-6" />
            <span className="text-sm font-medium">Assignment</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{homework.title}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {homework.subjectName ? <span>{homework.subjectName}</span> : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {formatDue}
            </span>
            {homework.teacherName ? (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {homework.teacherName}
              </span>
            ) : null}
          </div>
        </div>

        {homework.description ? (
          descLong ? (
            <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
              <Card className="border-violet-200/40 dark:border-violet-900/40 transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">Instructions</CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit shrink-0 border-violet-200/60 text-violet-800 hover:bg-violet-500/10 dark:border-violet-800/50 dark:text-violet-200"
                      >
                        {instructionsOpen ? "Show less" : "Read full instructions"}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                {!instructionsOpen ? (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                      {homework.description}
                    </p>
                  </CardContent>
                ) : null}
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {homework.description}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : (
            <Card className="border-violet-200/40 dark:border-violet-900/40 transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {homework.description}
                </p>
              </CardContent>
            </Card>
          )
        ) : null}

        {homework.attachmentStorageIds && homework.attachmentStorageIds.length > 0 ? (
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Materials & links from your teacher
              </CardTitle>
              <CardDescription>Open or download each file your teacher attached.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {homework.attachmentStorageIds.map((sid, i) => (
                <TeacherAttachmentLink key={sid} storageId={sid} label={`Attachment ${i + 1}`} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div ref={submitSectionRef} id="homework-submit" className="scroll-mt-28">
          <Card className="border-violet-200/50 dark:border-violet-800/40 ring-offset-background transition-shadow hover:shadow-md hover:ring-1 hover:ring-violet-200/50 dark:hover:ring-violet-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your submission</CardTitle>
              <CardDescription>
                {isMarked
                  ? "This homework has been marked. You can view your work below but cannot change it."
                  : "Submit offline work as a file, or write your answers here in the portal — or both."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission?.status === "marked" && submission.grade ? (
                <Badge variant="secondary" className="text-sm">
                  Grade: {submission.grade}
                  {submission.feedback ? ` — ${submission.feedback}` : ""}
                </Badge>
              ) : null}
              {submission && (submission.status === "submitted" || submission.status === "marked") ? (
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {submission.storageId && submission.fileName ? (
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      File: {submission.fileName}
                    </span>
                  ) : null}
                  {submission.portalAnswer ? (
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Written answer on file
                    </span>
                  ) : null}
                </div>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  Option 1 — Submit a file
                </div>
                <p className="text-sm text-muted-foreground">
                  Finished on paper or in another app? Upload a PDF, document, or image here.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canEdit}
                  onClick={() => setFileDialogOpen(true)}
                  className="transition-transform active:scale-[0.98]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {submission?.storageId ? "Replace or add file" : "Choose file to submit"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PencilLine className="h-4 w-4" />
                  Option 2 — Do it in the portal
                </div>
                <p className="text-sm text-muted-foreground">
                  Type your answers below. You can still add a file above if your teacher asked for both.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="portal-answer">Your work</Label>
                  <Textarea
                    id="portal-answer"
                    rows={12}
                    className="min-h-[200px] resize-y font-sans text-sm leading-relaxed transition-[box-shadow] focus-visible:ring-violet-500/30"
                    placeholder="Write your homework here…"
                    value={portalDraft}
                    onChange={(e) => setPortalDraft(e.target.value)}
                    disabled={!canEdit}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {portalDraft.length} characters
                      {wordCount > 0 ? ` · ${wordCount} words` : null}
                    </span>
                    {canEdit && portalDraft.length > 0 ? (
                      <span className="text-violet-600/80 dark:text-violet-400/90">
                        Also saved in this browser until you submit
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={!canEdit || portalSubmitting || !portalDraft.trim()}
                  onClick={handleSubmitPortalAnswer}
                  className="transition-transform active:scale-[0.98]"
                >
                  {portalSubmitting ? "Submitting…" : "Submit written work"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {(prevNext.prev || prevNext.next) && (
          <nav
            className="flex flex-col gap-3 border-t border-violet-200/40 pt-6 dark:border-violet-900/40 sm:flex-row sm:justify-between"
            aria-label="Previous and next assignment"
          >
            {prevNext.prev ? (
              <Button variant="outline" size="sm" className="justify-start gap-1 h-auto py-2 min-w-0 flex-1 sm:max-w-[48%]" asChild>
                <Link href={`/student/homework/${prevNext.prev._id}`}>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="flex min-w-0 flex-col items-start text-left">
                    <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                      Previous
                    </span>
                    <span className="truncate font-medium">{prevNext.prev.title}</span>
                  </span>
                </Link>
              </Button>
            ) : (
              <span className="hidden sm:block sm:flex-1" />
            )}
            {prevNext.next ? (
              <Button variant="outline" size="sm" className="justify-end gap-1 h-auto py-2 min-w-0 flex-1 sm:max-w-[48%]" asChild>
                <Link href={`/student/homework/${prevNext.next._id}`}>
                  <span className="flex min-w-0 flex-col items-end text-right">
                    <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                      Next
                    </span>
                    <span className="truncate font-medium">{prevNext.next.title}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            ) : null}
          </nav>
        )}

        <StudentSubmitHomeworkDialog
          open={fileDialogOpen}
          onOpenChange={setFileDialogOpen}
          homeworkId={homeworkId}
          homeworkTitle={homework.title}
          studentId={student.id as Id<"students">}
          studentName={studentName}
          schoolId={student.schoolId}
        />
      </main>

      <StudentHomeworkDetailSidebar
        summaries={summaries}
        currentHomeworkId={homeworkId}
        onJumpToSubmit={jumpToSubmit}
      />
    </div>,
  );
}

function TeacherAttachmentLink({ storageId, label }: { storageId: string; label: string }) {
  const url = useQuery(api.photos.getFileUrl, { storageId });
  if (!url) {
    return (
      <Button size="sm" variant="outline" disabled>
        Loading…
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" asChild className="transition-colors hover:border-violet-300 hover:bg-violet-500/5">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <FileDown className="h-4 w-4 mr-1" />
        {label}
      </a>
    </Button>
  );
}
