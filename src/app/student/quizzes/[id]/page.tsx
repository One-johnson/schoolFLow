"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { ArrowLeft, ListChecks, Timer } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

const LABELS = ["A", "B", "C", "D"] as const;

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

  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const questions = session?.questions ?? [];

  useEffect(() => {
    if (questions.length === 0) return;
    setAnswers(Array.from({ length: questions.length }, () => null));
  }, [questions.length, session?.attempt?._id]);

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
      toast.success("Quiz started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!answers.every((a) => a !== null && a >= 0 && a <= 3)) {
      toast.error("Answer every question before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const r = await submitAttempt({
        schoolId: student.schoolId,
        studentId: student.id as Id<"students">,
        quizId,
        answers: answers as number[],
      });
      toast.success(`Submitted — score ${r.score}/${r.maxScore} (${r.percent}%)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
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
    const { attempt: att, questions: qs } = result;
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
        <div className="space-y-6">
          {qs.map((q, i) => {
            const chosen = att.answers?.[i];
            const ok = chosen === q.correctIndex;
            return (
              <Card key={q._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium">Q{i + 1}</CardTitle>
                    <Badge variant={ok ? "default" : "destructive"}>{ok ? "Correct" : "Wrong"}</Badge>
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
                          : chosen === oi && !ok
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

  const showStart =
    !attempt && inWindow && !submitted;
  const showContinue = attempt?.status === "in_progress";

  return (
    <div className="space-y-6 pb-24 pt-2">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/student/quizzes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <StudentPageHeader
        title={quiz.title}
        subtitle={quiz.description}
        icon={ListChecks}
      />

      {!inWindow && !showContinue && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {Date.now() < new Date(quiz.opensAt).getTime()
              ? "This quiz has not opened yet."
              : "This quiz window has closed."}
          </CardContent>
        </Card>
      )}

      {showStart && (
        <Card>
          <CardContent className="py-8 space-y-4">
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
          {secondsLeft !== null && (
            <div
              className={`flex items-center justify-center gap-2 text-sm font-medium ${
                secondsLeft <= 60 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Timer className="h-4 w-4" />
              {secondsLeft <= 0
                ? "Time limit reached — submit as soon as you can"
                : `${secondsLeft}s left`}
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
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit quiz"}
          </Button>
        </>
      )}
    </div>
  );
}
