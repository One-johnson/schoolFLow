"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Download, ListChecks, Timer, Clock } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { buildClassQuizResultPdf } from "@/lib/class-quiz-result-pdf";
import { cn } from "@/lib/utils";

const LABELS = ["A", "B", "C", "D"] as const;

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 120) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
  }
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}

function urgencyClass(seconds: number): string {
  if (seconds <= 60) return "text-destructive font-semibold";
  if (seconds <= 300) return "text-amber-600 dark:text-amber-500 font-medium";
  return "text-muted-foreground";
}

export default function StudentQuizTakePage() {
  const params = useParams();
  const quizId = params.id as Id<"classQuizzes">;
  const { student } = useStudentAuth();

  const session = useQuery(
    api.classQuizzes.getTakingSession,
    student
      ? {
          schoolId: student.schoolId,
          studentId: student.id as Id<"students">,
          quizId,
        }
      : "skip",
  );

  const result = useQuery(
    api.classQuizzes.getAttemptResult,
    student && session?.attempt?.status === "submitted"
      ? {
          schoolId: student.schoolId,
          studentId: student.id as Id<"students">,
          quizId,
        }
      : "skip",
  );

  const startAttempt = useMutation(api.classQuizzes.startAttempt);
  const submitAttempt = useMutation(api.classQuizzes.submitAttempt);
  const saveQuizProgress = useMutation(api.classQuizzes.saveQuizProgress);

  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const autoSubmittedRef = useRef(false);
  const warnedSubmit5Ref = useRef(false);
  const warnedSubmit1Ref = useRef(false);
  const warnedWindow5Ref = useRef(false);
  const warnedWindow1Ref = useRef(false);
  const [wallClock, setWallClock] = useState(() => Date.now());

  const questions = session?.questions ?? [];
  const blockedPastDeadline = session?.blockedPastDeadline === true;

  useEffect(() => {
    if (questions.length === 0) return;
    const att = session?.attempt;
    const saved =
      att?.status === "in_progress" && att.answers?.length === questions.length
        ? att.answers
        : null;
    if (saved) {
      setAnswers(saved.map((a) => (a < 0 || a > 3 ? null : a)));
    } else {
      setAnswers(Array.from({ length: questions.length }, () => null));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when attempt identity or saved draft changes
  }, [questions.length, session?.attempt?._id, session?.attempt?.status, session?.attempt?.answers]);

  useEffect(() => {
    autoSubmittedRef.current = false;
    warnedSubmit5Ref.current = false;
    warnedSubmit1Ref.current = false;
    warnedWindow5Ref.current = false;
    warnedWindow1Ref.current = false;
  }, [session?.attempt?._id]);

  const timeLimitSec = session?.quiz.timeLimitSeconds;
  const startedAtMs = session?.attempt?.startedAt
    ? new Date(session.attempt.startedAt).getTime()
    : null;

  useEffect(() => {
    if (!timeLimitSec || !startedAtMs || session?.attempt?.status !== "in_progress") {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const elapsed = (Date.now() - startedAtMs) / 1000;
      setSecondsLeft(Math.max(0, Math.ceil(timeLimitSec - elapsed)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeLimitSec, startedAtMs, session?.attempt?.status]);

  useEffect(() => {
    if (
      !student ||
      session?.attempt?.status !== "in_progress" ||
      blockedPastDeadline ||
      questions.length === 0 ||
      answers.length !== questions.length
    ) {
      return;
    }
    const payload = answers.map((a) => (a === null ? -1 : a));
    const t = setTimeout(() => {
      saveQuizProgress({
        schoolId: student.schoolId,
        studentId: student.id as Id<"students">,
        quizId,
        answers: payload,
      }).catch(() => {
        /* offline / race; ignore */
      });
    }, 900);
    return () => clearTimeout(t);
  }, [
    answers,
    blockedPastDeadline,
    questions.length,
    quizId,
    saveQuizProgress,
    session?.attempt?.status,
    student,
  ]);

  const runSubmit = useCallback(
    async (allowPartial: boolean) => {
      if (!student) return;
      const payload = answers.map((a) => (a === null ? -1 : a));
      if (!allowPartial && !payload.every((a) => a >= 0 && a <= 3)) {
        toast.error("Answer every question before submitting");
        return;
      }
      setSubmitting(true);
      try {
        const r = await submitAttempt({
          schoolId: student.schoolId,
          studentId: student.id as Id<"students">,
          quizId,
          answers: payload,
          allowPartial,
        });
        toast.success(`Submitted — score ${r.score}/${r.maxScore} (${r.percent}%)`);
        setShowConfirmSubmit(false);
      } catch (e) {
        if (allowPartial) {
          autoSubmittedRef.current = false;
        }
        toast.error(e instanceof Error ? e.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, quizId, student, submitAttempt],
  );

  useEffect(() => {
    if (secondsLeft !== 0 || session?.attempt?.status !== "in_progress" || blockedPastDeadline) {
      return;
    }
    if (!timeLimitSec) return;
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void runSubmit(true);
  }, [blockedPastDeadline, runSubmit, secondsLeft, session?.attempt?.status, timeLimitSec]);

  const needWallClockTick =
    Boolean(session?.inWindow && !session.attempt) ||
    Boolean(
      session?.attempt?.status === "in_progress" &&
        !session?.blockedPastDeadline &&
        session.submitDeadlineMs != null,
    );

  useEffect(() => {
    if (!needWallClockTick) return;
    const id = setInterval(() => setWallClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, [needWallClockTick]);

  const closesAtMs =
    session?.quiz?.closesAt !== undefined ? new Date(session.quiz.closesAt).getTime() : 0;
  const windowRemSec =
    session && session.inWindow && !session.attempt
      ? Math.max(0, Math.ceil((closesAtMs - wallClock) / 1000))
      : null;
  const submitRemSec =
    session &&
    session.attempt?.status === "in_progress" &&
    !session.blockedPastDeadline &&
    session.submitDeadlineMs != null
      ? Math.max(0, Math.ceil((session.submitDeadlineMs - wallClock) / 1000))
      : null;

  useEffect(() => {
    if (submitRemSec === null || submitRemSec <= 0) return;
    if (submitRemSec <= 300 && !warnedSubmit5Ref.current) {
      warnedSubmit5Ref.current = true;
      toast.warning("Less than 5 minutes left to submit this quiz.");
    }
  }, [submitRemSec]);

  useEffect(() => {
    if (submitRemSec === null || submitRemSec <= 0) return;
    if (submitRemSec <= 60 && !warnedSubmit1Ref.current) {
      warnedSubmit1Ref.current = true;
      toast.warning("Less than 1 minute left to submit — finish and submit soon.");
    }
  }, [submitRemSec]);

  useEffect(() => {
    if (windowRemSec === null || windowRemSec <= 0) return;
    if (windowRemSec <= 300 && !warnedWindow5Ref.current) {
      warnedWindow5Ref.current = true;
      toast.warning("Quiz window closes in under 5 minutes — start when you're ready.");
    }
  }, [windowRemSec]);

  useEffect(() => {
    if (windowRemSec === null || windowRemSec <= 0) return;
    if (windowRemSec <= 60 && !warnedWindow1Ref.current) {
      warnedWindow1Ref.current = true;
      toast.warning("Quiz window closes in under 1 minute.");
    }
  }, [windowRemSec]);

  if (!student) {
    return null;
  }

  const handleStart = async () => {
    setStarting(true);
    try {
      await startAttempt({
        schoolId: student.schoolId,
        studentId: student.id as Id<"students">,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        quizId,
      });
      autoSubmittedRef.current = false;
      toast.success("Quiz started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
    } finally {
      setStarting(false);
    }
  };

  const downloadPdf = () => {
    if (!result || result.withheld || !student) return;
    const { quiz, attempt: att, questions: qs } = result;
    const rows = qs.map((q, i) => {
      const chosen = att.answers?.[i];
      const ok = chosen === q.correctIndex;
      const your =
        chosen === undefined || chosen === null || chosen < 0
          ? "—"
          : `${LABELS[chosen]}. ${q.options[chosen] ?? ""}`;
      const corr = `${LABELS[q.correctIndex]}. ${q.options[q.correctIndex] ?? ""}`;
      return {
        q: i + 1,
        question: q.question.slice(0, 200),
        yourAnswer: your,
        correctAnswer: corr,
        result: ok ? "Correct" : chosen !== undefined && chosen >= 0 ? "Wrong" : "Skipped",
        pointsEarned: ok ? String(q.points) : "0",
      };
    });
    const doc = buildClassQuizResultPdf({
      quizTitle: quiz.title,
      studentDisplayName: `${student.firstName} ${student.lastName}`.trim(),
      studentIdLabel: student.studentId,
      className: student.className,
      score: att.score ?? 0,
      maxScore: att.maxScore ?? 0,
      percent: att.percent ?? 0,
      generatedAt: new Date(),
      rows,
    });
    doc.save(`quiz-${quiz.title.replace(/[^\w]+/g, "-").slice(0, 40)}.pdf`);
  };

  if (session === undefined) {
    return (
      <div className="space-y-4 pb-24 pt-2">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4 pb-24 pt-2">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link href="/student/quizzes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <p className="text-muted-foreground">This quiz is not available.</p>
      </div>
    );
  }

  const { quiz, inWindow, attempt } = session;
  const submitted = attempt?.status === "submitted";

  if (submitted && result === undefined) {
    return (
      <div className="space-y-4 pb-24 pt-2">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (submitted && result) {
    const { attempt: att } = result;
    if (result.withheld) {
      return (
        <div className="space-y-6 pb-24 pt-2">
          <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
            <Link href="/student/quizzes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All quizzes
            </Link>
          </Button>
          <StudentPageHeader
            title={quiz.title}
            subtitle={`Score: ${att.score ?? 0}/${att.maxScore ?? 0} (${att.percent ?? 0}%)`}
            icon={ListChecks}
          />
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {result.withholdReason}
            </CardContent>
          </Card>
        </div>
      );
    }

    const { questions: qs } = result;
    return (
      <div className="space-y-6 pb-24 pt-2">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
          <Link href="/student/quizzes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All quizzes
          </Link>
        </Button>
        <StudentPageHeader
          title={quiz.title}
          subtitle={`Score: ${att.score ?? 0}/${att.maxScore ?? 0} (${att.percent ?? 0}%)`}
          icon={ListChecks}
        />
        <Button variant="outline" className="w-full" onClick={downloadPdf}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <div className="space-y-6">
          {qs.map((q, i) => {
            const chosen = att.answers?.[i];
            const skipped = chosen === undefined || chosen === null || chosen < 0;
            const ok = !skipped && chosen === q.correctIndex;
            return (
              <Card key={q._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium">Q{i + 1}</CardTitle>
                    <Badge variant={skipped ? "secondary" : ok ? "default" : "destructive"}>
                      {skipped ? "Skipped" : ok ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                  <p className="text-sm pt-1">{q.question}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={
                        oi === q.correctIndex
                          ? "rounded-md border border-green-600/50 bg-green-500/10 px-3 py-2"
                          : !skipped && chosen === oi && !ok
                            ? "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2"
                            : "rounded-md border px-3 py-2"
                      }
                    >
                      <span className="font-medium text-muted-foreground mr-2">{LABELS[oi]}.</span>
                      {opt}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const showStart = !attempt && inWindow && !submitted;
  const showContinue = attempt?.status === "in_progress" && !blockedPastDeadline;
  const deadlineLabel =
    session.submitDeadlineMs !== null
      ? new Date(session.submitDeadlineMs).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="space-y-6 pb-24 pt-2">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/student/quizzes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <StudentPageHeader title={quiz.title} subtitle={quiz.description} icon={ListChecks} />

      {!inWindow && !showContinue && !blockedPastDeadline && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {Date.now() < new Date(quiz.opensAt).getTime()
              ? "This quiz has not opened yet."
              : "This quiz window has closed."}
          </CardContent>
        </Card>
      )}

      {blockedPastDeadline && (
        <Card>
          <CardContent className="py-8 text-center space-y-2 text-muted-foreground">
            <p className="font-medium text-foreground">Submission period ended</p>
            <p>
              The deadline for this quiz has passed
              {deadlineLabel ? ` (${deadlineLabel})` : ""}. If you did not submit in time, contact
              your teacher.
            </p>
          </CardContent>
        </Card>
      )}

      {showStart && (
        <Card>
          <CardContent className="py-8 space-y-4">
            {windowRemSec !== null && windowRemSec > 0 && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 bg-muted/40",
                  windowRemSec <= 60 && "border-destructive/60 bg-destructive/10",
                  windowRemSec > 60 &&
                    windowRemSec <= 300 &&
                    "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15",
                )}
              >
                <Clock
                  className={cn(
                    "h-8 w-8 shrink-0",
                    urgencyClass(windowRemSec),
                  )}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quiz window closes in
                  </p>
                  <p className={cn("text-2xl font-bold tabular-nums", urgencyClass(windowRemSec))}>
                    {formatRemaining(windowRemSec * 1000)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Start before then or you won&apos;t be able to take this quiz.
                  </p>
                </div>
              </div>
            )}
            {quiz.timeLimitSeconds && (
              <p className="text-sm text-muted-foreground text-center">
                Time limit: {Math.round(quiz.timeLimitSeconds / 60)} min once you start
              </p>
            )}
            <Button className="w-full" onClick={handleStart} disabled={starting}>
              {starting ? "Starting…" : "Start quiz"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showContinue && (
        <>
          {submitRemSec !== null && submitRemSec > 0 && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 bg-muted/40",
                submitRemSec <= 60 && "border-destructive/60 bg-destructive/10",
                submitRemSec > 60 &&
                  submitRemSec <= 300 &&
                  "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15",
              )}
            >
              <Clock
                className={cn("h-8 w-8 shrink-0", urgencyClass(submitRemSec))}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time left to submit
                </p>
                <p className={cn("text-2xl font-bold tabular-nums", urgencyClass(submitRemSec))}>
                  {formatRemaining(submitRemSec * 1000)}
                </p>
                {deadlineLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Final deadline {deadlineLabel}
                    {(quiz.submitGraceSecondsAfterClose ?? 0) > 0
                      ? ` · includes ${Math.round((quiz.submitGraceSecondsAfterClose ?? 0) / 60)} min grace after scheduled close`
                      : ""}
                  </p>
                )}
              </div>
            </div>
          )}
          {secondsLeft !== null && (
            <div
              className={`flex items-center justify-center gap-2 text-sm font-medium ${
                secondsLeft <= 60 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Timer className="h-4 w-4" />
              {secondsLeft <= 0
                ? "Time limit reached — submitting…"
                : `Question timer: ${secondsLeft}s left`}
            </div>
          )}
          <div className="space-y-8">
            {questions.map((q, qi) => (
              <Card key={q._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Q{qi + 1}</CardTitle>
                  <p className="text-sm font-normal pt-1">{q.question}</p>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={
                      answers[qi] !== null && answers[qi] !== undefined
                        ? String(answers[qi])
                        : undefined
                    }
                    onValueChange={(v) =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = Number(v);
                        return next;
                      })
                    }
                  >
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={String(oi)} id={`q${qi}-o${oi}`} />
                        <Label htmlFor={`q${qi}-o${oi}`} className="font-normal cursor-pointer flex-1">
                          <span className="text-muted-foreground mr-2">{LABELS[oi]}.</span>
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={submitting}
          >
            Submit quiz
          </Button>
        </>
      )}

      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot change your answers after submitting. Make sure you answered every
              question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runSubmit(false)} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
