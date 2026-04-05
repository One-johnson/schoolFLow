"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
import { Progress } from "@/components/ui/progress";
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
import {
  ArrowLeft,
  Download,
  ListChecks,
  Timer,
  Clock,
  Loader2,
  Trophy,
  ThumbsUp,
  Sparkles,
  Target,
  Star,
  Rocket,
} from "lucide-react";
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

/** Softer ramp for younger students: orange before red. */
function urgencyClass(seconds: number): string {
  if (seconds <= 45) return "text-destructive font-semibold";
  if (seconds <= 120) return "text-orange-600 dark:text-orange-400 font-semibold";
  if (seconds <= 300) return "text-amber-600 dark:text-amber-500 font-medium";
  return "text-muted-foreground";
}

function timerCardTone(seconds: number): string {
  if (seconds <= 45) return "border-destructive/60 bg-destructive/10";
  if (seconds <= 120) return "border-orange-500/50 bg-orange-500/10 dark:bg-orange-500/15";
  if (seconds <= 300) return "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15";
  return "border-muted-foreground/15 bg-muted/40";
}

function QuizStarRow({ percent }: { percent: number }) {
  const filled =
    percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 50 ? 3 : percent >= 30 ? 2 : 1;
  return (
    <div className="flex justify-center gap-1.5 py-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-8 w-8 transition-colors sm:h-9 sm:w-9",
            i < filled ? "fill-amber-400 text-amber-400" : "text-muted/25",
          )}
        />
      ))}
    </div>
  );
}

function handoutIsPdf(contentType: string | undefined): boolean {
  return (contentType ?? "").toLowerCase().includes("pdf");
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
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<{
    score: number;
    maxScore: number;
    percent: number;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const autoSubmittedRef = useRef(false);
  const warnedSubmit5Ref = useRef(false);
  const warnedSubmit1Ref = useRef(false);
  const warnedWindow5Ref = useRef(false);
  const warnedWindow1Ref = useRef(false);
  const [wallClock, setWallClock] = useState(() => Date.now());

  const questions = session?.questions ?? [];
  const blockedPastDeadline = session?.blockedPastDeadline === true;

  const answeredCount = useMemo(
    () => answers.filter((a) => a !== null && a !== undefined && a >= 0).length,
    [answers],
  );
  const progressPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

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
    setShowDetails(false);
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
        toast.error("Pick an answer for every question first");
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
        // Small suspense delay so the loader is visible.
        await new Promise((res) => setTimeout(res, 900));
        setScoreSummary({ score: r.score, maxScore: r.maxScore, percent: r.percent });
        setShowScoreDialog(true);
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
    const summary = scoreSummary ?? {
      score: att.score ?? 0,
      maxScore: att.maxScore ?? 0,
      percent: att.percent ?? 0,
    };
    const remark =
      summary.percent >= 80
        ? {
            title: "Super work!",
            body: "You really understood this quiz. Keep being awesome!",
            Icon: Trophy,
          }
        : summary.percent >= 60
          ? {
              title: "Great job!",
              body: "Nice try — you are getting the hang of it.",
              Icon: ThumbsUp,
            }
          : summary.percent >= 40
            ? {
                title: "Good effort!",
                body: "A bit more practice and you will shine next time.",
                Icon: Target,
              }
            : {
                title: "Keep learning!",
                body: "Every quiz helps you grow — you can do it!",
                Icon: Sparkles,
              };

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
            variant="playful"
            title={quiz.title}
            subtitle={`Score: ${summary.score}/${summary.maxScore} (${summary.percent}%)`}
            icon={ListChecks}
          />
          <Card className="overflow-hidden border-violet-200/60 dark:border-violet-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">{remark.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-muted-foreground">{remark.body}</CardContent>
          </Card>
          <Card>
            <CardContent className="py-8 text-center text-base text-muted-foreground">
              {result.withholdReason}
            </CardContent>
          </Card>
          <AlertDialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>You finished!</AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <remark.Icon className="h-5 w-5" />
                      <span>{remark.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{remark.body}</div>
                    <div className="text-sm text-foreground font-semibold">
                      Score: {summary.score}/{summary.maxScore} ({summary.percent}%)
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction className="rounded-xl">Great!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
          variant="playful"
          title={quiz.title}
          subtitle="Here is how you did. Take a moment to celebrate your effort!"
          icon={ListChecks}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="overflow-hidden border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-card to-amber-50/40 shadow-md dark:border-violet-900/45 dark:from-violet-950/30 dark:to-amber-950/20">
            <CardContent className="space-y-4 pt-6 pb-6 text-center sm:pt-8 sm:pb-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-violet-600 p-4 text-white shadow-lg dark:bg-violet-500">
                  <remark.Icon className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-violet-950 dark:text-violet-100 sm:text-xl">
                  {remark.title}
                </p>
                <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">{remark.body}</p>
              </div>
              <QuizStarRow percent={summary.percent} />
              <div className="rounded-2xl border border-violet-200/50 bg-background/80 px-4 py-5 dark:border-violet-900/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your score
                </p>
                <p className="mt-1 text-4xl font-black tabular-nums tracking-tight text-violet-700 dark:text-violet-200 sm:text-5xl">
                  {summary.score}
                  <span className="text-2xl font-bold text-muted-foreground sm:text-3xl">
                    /{summary.maxScore}
                  </span>
                </p>
                <p className="mt-2 text-lg font-semibold text-muted-foreground">{summary.percent}%</p>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant={showDetails ? "secondary" : "default"}
                  className="h-12 w-full rounded-2xl text-base font-semibold"
                  onClick={() => setShowDetails((v) => !v)}
                >
                  {showDetails ? "Hide question review" : "See question review"}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-base border-violet-200 dark:border-violet-800"
                  onClick={downloadPdf}
                >
                  <Download className="h-4 w-4 mr-2 shrink-0" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {showDetails && (
          <div className="space-y-5">
            {qs.map((q, i) => {
              const chosen = att.answers?.[i];
              const skipped = chosen === undefined || chosen === null || chosen < 0;
              const ok = !skipped && chosen === q.correctIndex;
              const statusLabel = skipped ? "Skipped" : ok ? "Got it!" : "Not quite";
              return (
                <Card
                  key={q._id}
                  className="overflow-hidden border-violet-100/80 shadow-sm dark:border-violet-900/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold">Question {i + 1}</CardTitle>
                      <Badge
                        variant={skipped ? "secondary" : ok ? "default" : "destructive"}
                        className="shrink-0 text-sm"
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <p className="pt-1 text-base leading-relaxed">{q.question}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-base">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={
                          oi === q.correctIndex
                            ? "rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 px-4 py-3"
                            : !skipped && chosen === oi && !ok
                              ? "rounded-2xl border-2 border-orange-500/50 bg-orange-500/10 px-4 py-3"
                              : "rounded-2xl border px-4 py-3"
                        }
                      >
                        <span className="font-semibold text-muted-foreground mr-2">{LABELS[oi]}.</span>
                        {opt}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>You finished!</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <remark.Icon className="h-5 w-5" />
                    <span>{remark.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{remark.body}</div>
                  <div className="text-base font-semibold text-foreground">
                    Score: {summary.score}/{summary.maxScore} ({summary.percent}%)
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="rounded-xl">Great!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <Card className="w-[min(92vw,22rem)] border-violet-200/60 shadow-lg dark:border-violet-900/40">
            <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
              <div className="space-y-1">
                <p className="text-lg font-semibold">Checking your answers…</p>
                <p className="text-sm text-muted-foreground">Almost there — great work finishing!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/student/quizzes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <StudentPageHeader
        variant="playful"
        title={quiz.title}
        subtitle={
          quiz.description?.trim()
            ? quiz.description
            : "Read each question and tap the answer you think is best."
        }
        icon={ListChecks}
      />

      {!inWindow && !showContinue && !blockedPastDeadline && (
        <Card className="border-violet-200/60 dark:border-violet-900/40">
          <CardContent className="py-10 text-center text-base text-muted-foreground">
            {Date.now() < new Date(quiz.opensAt).getTime()
              ? "This quiz is not open yet. Check back when your teacher says it is time!"
              : "This quiz has closed. If you think this is a mistake, ask your teacher."}
          </CardContent>
        </Card>
      )}

      {blockedPastDeadline && (
        <Card className="border-orange-200/60 dark:border-orange-900/40">
          <CardContent className="py-10 text-center space-y-3 text-base text-muted-foreground">
            <p className="font-semibold text-foreground text-lg">Time is up for this quiz</p>
            <p>
              The deadline passed
              {deadlineLabel ? ` (${deadlineLabel})` : ""}. Tell your teacher if you had trouble
              sending it in.
            </p>
          </CardContent>
        </Card>
      )}

      {showStart && (
        <Card className="overflow-hidden border-violet-200/70 shadow-md dark:border-violet-900/40">
          <CardContent className="space-y-5 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-gradient-to-br from-violet-500 to-amber-500 p-3 text-white shadow-md">
                <Rocket className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-violet-950 dark:text-violet-100">
                Ready when you are!
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Take your time reading each question. You&apos;ve got this!
              </p>
            </div>
            {windowRemSec !== null && windowRemSec > 0 && (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 px-4 py-3",
                  timerCardTone(windowRemSec),
                )}
              >
                <Clock className={cn("h-9 w-9 shrink-0", urgencyClass(windowRemSec))} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Time left to begin
                  </p>
                  <p className={cn("text-2xl font-bold tabular-nums", urgencyClass(windowRemSec))}>
                    {formatRemaining(windowRemSec * 1000)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tap <span className="font-medium text-foreground">Let&apos;s go</span> before
                    this reaches zero.
                  </p>
                </div>
              </div>
            )}
            {quiz.timeLimitSeconds && (
              <p className="text-center text-base text-muted-foreground">
                After you start, you have about{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(quiz.timeLimitSeconds / 60)} minutes
                </span>{" "}
                for the whole quiz.
              </p>
            )}
            {quiz.handoutStorageId && (
              <p className="text-center text-base text-muted-foreground">
                Your teacher added helper pages — they will show up next to the questions.
              </p>
            )}
            <Button
              className="h-14 w-full rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 shadow-md"
              onClick={handleStart}
              disabled={starting}
            >
              {starting ? "Starting…" : "Let's go!"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showContinue && (
        <>
          {submitRemSec !== null && submitRemSec > 0 && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-4 py-3",
                timerCardTone(submitRemSec),
              )}
            >
              <Clock className={cn("h-9 w-9 shrink-0", urgencyClass(submitRemSec))} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time left to turn in
                </p>
                <p className={cn("text-2xl font-bold tabular-nums", urgencyClass(submitRemSec))}>
                  {formatRemaining(submitRemSec * 1000)}
                </p>
                {deadlineLabel && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Hand in by {deadlineLabel}
                    {(quiz.submitGraceSecondsAfterClose ?? 0) > 0
                      ? ` (+${Math.round((quiz.submitGraceSecondsAfterClose ?? 0) / 60)} min grace)`
                      : ""}
                  </p>
                )}
                {submitRemSec > 120 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Still plenty of time — double-check your answers.
                  </p>
                )}
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="sticky top-2 z-30 rounded-2xl border border-violet-200/70 bg-card/95 p-4 shadow-md backdrop-blur-md dark:border-violet-900/45">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <span className="text-violet-900 dark:text-violet-100">Your progress</span>
                <span className="tabular-nums text-muted-foreground">
                  {answeredCount} of {questions.length} answered
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-3 bg-violet-100 dark:bg-violet-950/60 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-violet-500 [&>[data-slot=progress-indicator]]:to-amber-500"
              />
            </div>
          )}

          {secondsLeft !== null && (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl border border-muted-foreground/10 bg-muted/30 px-4 py-3 text-center sm:flex-row sm:gap-2",
                secondsLeft <= 45 && "border-destructive/30 bg-destructive/5",
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Timer className={cn("h-5 w-5", secondsLeft <= 45 ? "text-destructive" : "text-violet-600")} />
                <span className={secondsLeft <= 45 ? "text-destructive" : "text-foreground"}>
                  {secondsLeft <= 0
                    ? "Time is up — sending your quiz…"
                    : `Quiz clock: ${secondsLeft} seconds`}
                </span>
              </div>
              {secondsLeft > 45 && secondsLeft <= 120 && (
                <span className="text-sm text-muted-foreground">Focus — clock is ticking!</span>
              )}
            </div>
          )}
          <div
            className={cn(
              "flex flex-col gap-4 min-h-0",
              session.handoutUrl && "lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start",
            )}
          >
            {session.handoutUrl && (
              <aside
                className={cn(
                  "sticky top-0 z-20 -mx-1 rounded-xl border bg-background/95 backdrop-blur-sm shadow-sm",
                  "overflow-hidden flex flex-col shrink-0",
                  "lg:static lg:z-auto lg:backdrop-blur-none lg:shadow-none lg:mx-0 lg:self-start",
                  "lg:max-h-[calc(100vh-10rem)] lg:min-h-0",
                )}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/50 text-xs font-medium shrink-0">
                  <span className="truncate min-w-0">
                    Handout
                    {quiz.handoutFileName ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {quiz.handoutFileName}
                      </span>
                    ) : null}
                  </span>
                  <a
                    href={session.handoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary shrink-0 hover:underline"
                  >
                    New tab
                  </a>
                </div>
                <div
                  className={cn(
                    "bg-muted/20",
                    "h-[min(40vh,320px)] min-h-[180px]",
                    "lg:flex-1 lg:min-h-[420px] lg:h-auto lg:max-h-[calc(100vh-12rem)]",
                  )}
                >
                  {handoutIsPdf(quiz.handoutContentType) ? (
                    <iframe
                      title="Quiz handout"
                      src={session.handoutUrl}
                      className="w-full h-full border-0 bg-white dark:bg-zinc-950"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center text-sm text-muted-foreground">
                      <p>
                        This handout is a Word document. Download it to view formatting and equations,
                        then answer here.
                      </p>
                      <Button variant="default" size="sm" asChild>
                        <a
                          href={session.handoutUrl}
                          download={quiz.handoutFileName ?? "handout"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download handout
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </aside>
            )}
            <div className="space-y-8 min-w-0">
              {questions.map((q, qi) => (
                <Card
                  key={q._id}
                  className="overflow-hidden border-violet-200/50 shadow-sm dark:border-violet-900/35"
                >
                  <CardHeader className="pb-3">
                    <Badge variant="outline" className="mb-2 w-fit border-violet-300 text-violet-800 dark:border-violet-700 dark:text-violet-200">
                      Question {qi + 1} of {questions.length}
                    </Badge>
                    <CardTitle className="text-balance text-lg font-semibold leading-snug sm:text-xl">
                      {q.question}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tap the answer you think is correct
                    </p>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      className="grid gap-3"
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
                      {q.options.map((opt, oi) => {
                        const id = `q${qi}-o${oi}`;
                        const picked =
                          answers[qi] !== null &&
                          answers[qi] !== undefined &&
                          answers[qi] === oi;
                        return (
                          <Label
                            key={oi}
                            htmlFor={id}
                            className={cn(
                              "flex min-h-[3.5rem] w-full cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3 text-base font-normal shadow-sm transition-all",
                              picked
                                ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/25 dark:border-violet-400 dark:bg-violet-500/15"
                                : "border-muted-foreground/15 bg-card hover:border-violet-300/70 hover:bg-violet-50/40 dark:hover:border-violet-700/60 dark:hover:bg-violet-950/25",
                            )}
                          >
                            <RadioGroupItem value={String(oi)} id={id} className="h-5 w-5 shrink-0" />
                            <span
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                picked
                                  ? "bg-violet-600 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {LABELS[oi]}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Button
            className="h-14 w-full rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 shadow-md"
            size="lg"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={submitting}
          >
            Turn in quiz
          </Button>
        </>
      )}

      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="border-violet-200/60 dark:border-violet-900/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Turn in your quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              After you turn it in, you cannot change answers. If every question has a choice
              picked, you are ready!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep working</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-gradient-to-r from-violet-600 to-amber-600"
              onClick={() => void runSubmit(false)}
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Yes, turn it in"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
