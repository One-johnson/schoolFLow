"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  SendHorizontal,
  Loader2,
  ClipboardList,
  RotateCcw,
  Trophy,
  TrendingUp,
  Star,
  Sun,
  Gauge,
  Zap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/study-help-quiz-parse";
import {
  STUDY_HELP_QUIZ_MAX_COUNT,
  STUDY_HELP_QUIZ_MIN_COUNT,
} from "@/lib/study-help-limits";
import {
  appendQuizAttempt,
  gradeLetterFromPercent,
  loadQuizProgress,
  performanceBand,
  stageFromXp,
  xpForQuiz,
  type QuizProgressState,
} from "@/lib/study-quiz-progress";

type Turn = { role: "user" | "assistant"; content: string };

const axiosOpts = { withCredentials: true, headers: { "Content-Type": "application/json" } };

const COUNT_OPTIONS = Array.from(
  { length: STUDY_HELP_QUIZ_MAX_COUNT - STUDY_HELP_QUIZ_MIN_COUNT + 1 },
  (_, i) => STUDY_HELP_QUIZ_MIN_COUNT + i,
);

function formatAttemptDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const LABELS = ["A", "B", "C", "D"] as const;

const CHAT_SUGGESTIONS = [
  "What is photosynthesis in simple words?",
  "How can I get better at times tables?",
  "How do I plan a short essay?",
  "What is a fraction?",
] as const;

function StudyHelpStarRow({ percent }: { percent: number }) {
  const filled =
    percent >= 90 ? 5 : percent >= 70 ? 4 : percent >= 50 ? 3 : percent >= 30 ? 2 : 1;
  return (
    <div className="flex justify-center gap-1.5 py-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-7 w-7 sm:h-8 sm:w-8",
            i < filled ? "fill-amber-400 text-amber-400" : "text-muted/25",
          )}
        />
      ))}
    </div>
  );
}

export default function StudentStudyHelpPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [quizTopic, setQuizTopic] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizCount, setQuizCount] = useState(String(8));
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);
  const [quizProgress, setQuizProgress] = useState<QuizProgressState>({
    xp: 0,
    attempts: [],
  });

  useEffect(() => {
    if (!student?.id) return;
    setQuizProgress(loadQuizProgress(student.id));
  }, [student?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<{ available: boolean; provider?: string }>(
          "/api/student/study-help",
          axiosOpts,
        );
        if (!cancelled) {
          setAvailable(data.available);
          setProvider(data.provider ?? null);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
          setProvider(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, sending]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !available) return;

    setError(null);
    setInput("");
    const nextTurns: Turn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    setSending(true);

    try {
      const { data } = await axios.post<{ message?: string; error?: string }>(
        "/api/student/study-help",
        { messages: nextTurns },
        axiosOpts,
      );
      if (data.error) {
        setError(data.error);
        setTurns(turns);
        return;
      }
      if (data.message) {
        setTurns([...nextTurns, { role: "assistant", content: data.message }]);
      }
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : "Something went wrong. Try again.";
      setError(msg);
      setTurns(turns);
    } finally {
      setSending(false);
    }
  }, [available, input, sending, turns]);

  const resetQuiz = () => {
    setQuizQuestions(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError(null);
    setLastXpGain(null);
  };

  const generateQuiz = async () => {
    const topic = quizTopic.trim();
    if (!topic || quizLoading || !available) return;
    const count = parseInt(quizCount, 10);
    if (!Number.isFinite(count)) return;

    setQuizError(null);
    setQuizLoading(true);
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizQuestions(null);
    setLastXpGain(null);

    try {
      const { data } = await axios.post<{
        questions?: QuizQuestion[];
        error?: string;
      }>(
        "/api/student/study-help",
        {
          mode: "quiz_generate",
          topic,
          difficulty: quizDifficulty,
          count,
        },
        axiosOpts,
      );
      if (data.error) {
        setQuizError(data.error);
        return;
      }
      if (data.questions?.length) {
        setQuizQuestions(data.questions);
      }
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : "Could not generate a quiz. Try again.";
      setQuizError(msg);
    } finally {
      setQuizLoading(false);
    }
  };

  const quizScore = (() => {
    if (!quizQuestions || !quizSubmitted) return null;
    let correct = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
      if (quizAnswers[i] === quizQuestions[i].correctIndex) correct++;
    }
    const total = quizQuestions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percent, grade: gradeLetterFromPercent(percent) };
  })();

  const submitQuiz = () => {
    if (!quizQuestions?.length) return;
    let correct = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
      if (quizAnswers[i] === quizQuestions[i].correctIndex) correct++;
    }
    const total = quizQuestions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const gradeLetter = gradeLetterFromPercent(percent);
    const gain = xpForQuiz(correct, total, percent);
    setLastXpGain(gain);
    setQuizSubmitted(true);
    if (student?.id) {
      const next = appendQuizAttempt(student.id, {
        topic: quizTopic.trim().slice(0, 120) || "Quiz",
        difficulty: quizDifficulty,
        correct,
        total,
        percent,
        gradeLetter,
      });
      setQuizProgress(next);
    }
  };

  const stage = stageFromXp(quizProgress.xp);
  const xpToNext = Math.max(0, stage.xpForNext - stage.xpIntoStage);

  const practiceAnsweredCount = useMemo(() => {
    if (!quizQuestions?.length) return 0;
    let n = 0;
    for (let i = 0; i < quizQuestions.length; i++) {
      if (quizAnswers[i] !== undefined) n++;
    }
    return n;
  }, [quizAnswers, quizQuestions]);

  const practiceProgressPercent = useMemo(() => {
    if (!quizQuestions?.length) return 0;
    return Math.round((practiceAnsweredCount / quizQuestions.length) * 100);
  }, [practiceAnsweredCount, quizQuestions]);

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6 sm:py-8">
      <div className="space-y-3">
        <StudentPageHeader
          variant="playful"
          icon={Sparkles}
          title="Study help"
          subtitle="Ask questions in chat or build fun practice quizzes. Grow XP on this device—just for learning, not your real class grades."
        />
        <p className="rounded-xl border border-violet-200/60 bg-violet-50/50 px-4 py-3 text-sm text-muted-foreground dark:border-violet-900/40 dark:bg-violet-950/25">
          Do not paste exact homework you must hand in. Use your own words so you really learn.
        </p>
      </div>

      {available === null && (
        <p className="text-sm text-muted-foreground">Checking availability…</p>
      )}

      {available === false && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Study help is not available yet. Your school may still be setting it up, or it may be
          turned off. Ask your teacher if you need help with classwork.
        </div>
      )}

      {available === true && (
        <>
          {provider ? (
            <p className="text-xs text-muted-foreground">
              Assistant: {provider === "gemini" ? "Google Gemini" : "OpenAI"} (set by your school)
            </p>
          ) : null}

          <Tabs defaultValue="chat" className="w-full gap-4">
            <TabsList className="grid h-12 w-full max-w-md grid-cols-2 rounded-2xl border border-violet-200/60 bg-muted/40 p-1 dark:border-violet-900/40">
              <TabsTrigger
                value="chat"
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="quiz"
                className="gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <ClipboardList className="h-4 w-4" />
                Practice quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0 outline-none">
              <div className="flex min-h-[min(420px,50vh)] flex-1 flex-col overflow-hidden rounded-2xl border border-violet-200/70 bg-card shadow-md dark:border-violet-900/45">
                <ScrollArea className="min-h-[min(420px,50vh)] flex-1 p-4">
                  <div className="space-y-4 pr-2">
                    {turns.length === 0 && (
                      <div className="space-y-3">
                        <p className="text-base text-muted-foreground">
                          Tap an idea to start, or type your own question below.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {CHAT_SUGGESTIONS.map((s) => (
                            <Button
                              key={s}
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={sending}
                              className="h-auto max-w-full whitespace-normal rounded-full border-violet-200 px-3 py-2 text-left text-sm text-foreground hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/40"
                              onClick={() => setInput(s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {turns.map((t, i) => (
                      <div
                        key={`${i}-${t.role}`}
                        className={cn(
                          "flex gap-2 rounded-2xl px-4 py-3 text-base leading-relaxed",
                          t.role === "user"
                            ? "ml-2 border border-transparent bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-sm dark:from-violet-600 dark:to-violet-700"
                            : "mr-2 border border-border/80 bg-muted/50",
                        )}
                      >
                        {t.role === "assistant" ? (
                          <Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                        ) : null}
                        <div className="min-w-0 flex-1">{t.content}</div>
                      </div>
                    ))}
                    {sending && (
                      <div className="mr-2 flex items-center gap-2 rounded-2xl border border-border/80 bg-muted/50 px-4 py-3 text-base text-muted-foreground">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-600" />
                        Thinking…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {error && (
                  <p className="border-t border-border/60 px-4 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question here…"
                    rows={3}
                    className="min-h-[88px] resize-none rounded-xl text-base sm:flex-1"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-amber-600 px-6 text-base font-semibold hover:from-violet-500 hover:to-amber-500"
                    disabled={sending || !input.trim()}
                    onClick={() => void send()}
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send
                        <SendHorizontal className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="mt-0 space-y-4 outline-none">
              <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-background dark:border-violet-900/40 dark:from-violet-950/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Your study stage</CardTitle>
                        <CardDescription>
                          Every practice quiz adds XP. Stages are saved on this phone or computer
                          only.
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm font-semibold tabular-nums">
                      {quizProgress.xp} XP
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      Stage {stage.stage} — {stage.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {xpToNext > 0
                        ? `${xpToNext} more XP until the next stage`
                        : "Amazing — you maxed this stage! Keep practising anyway."}
                    </p>
                  </div>
                  <Progress value={stage.progressPercent} className="h-2.5" />
                  {quizProgress.attempts.length > 0 ? (
                    <>
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        Recent quizzes (you)
                      </div>
                      <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                        {[...quizProgress.attempts].reverse().slice(0, 8).map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-2 py-1.5"
                          >
                            <span className="truncate text-muted-foreground max-w-[55%]">
                              {formatAttemptDate(a.at)} · {a.topic}
                            </span>
                            <span className="shrink-0 font-medium tabular-nums">
                              {a.correct}/{a.total}{" "}
                              <span className="text-violet-600 dark:text-violet-400">
                                ({a.gradeLetter})
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Finish a quiz underneath to see scores here and level up.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-violet-200/60 dark:border-violet-900/40">
                <CardHeader>
                  <CardTitle className="text-lg">Build a practice quiz</CardTitle>
                  <CardDescription>
                    Choose a topic and how many questions (up to {STUDY_HELP_QUIZ_MAX_COUNT}). If it
                    takes too long, try fewer questions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-topic">Topic</Label>
                    <Textarea
                      id="quiz-topic"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="What do you want to practise?"
                      rows={2}
                      disabled={quizLoading}
                      className="resize-none rounded-xl text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { v: "easy" as const, label: "Easier", Icon: Sun },
                          { v: "medium" as const, label: "Medium", Icon: Gauge },
                          { v: "hard" as const, label: "Harder", Icon: Zap },
                        ] as const
                      ).map(({ v, label, Icon }) => (
                        <Button
                          key={v}
                          type="button"
                          variant={quizDifficulty === v ? "default" : "outline"}
                          className={cn(
                            "h-11 flex-1 gap-2 rounded-xl sm:flex-none sm:min-w-[7.5rem]",
                            quizDifficulty === v
                              ? "bg-violet-600 hover:bg-violet-600"
                              : "border-violet-200 dark:border-violet-800",
                          )}
                          disabled={quizLoading}
                          onClick={() => setQuizDifficulty(v)}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <Select
                        value={quizCount}
                        onValueChange={setQuizCount}
                        disabled={quizLoading}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl sm:w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                          {COUNT_OPTIONS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => void generateQuiz()}
                      disabled={quizLoading || !quizTopic.trim()}
                      className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-amber-600 px-6 text-base font-semibold hover:from-violet-500 hover:to-amber-500"
                    >
                      {quizLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Making your quiz…
                        </>
                      ) : (
                        "Make my quiz"
                      )}
                    </Button>
                    {quizQuestions ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetQuiz}
                        disabled={quizLoading}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        New quiz
                      </Button>
                    ) : null}
                  </div>
                  {quizError ? (
                    <p className="text-sm text-destructive">{quizError}</p>
                  ) : null}
                </CardContent>
              </Card>

              {quizQuestions && quizQuestions.length > 0 ? (
                <Card className="border-violet-200/60 dark:border-violet-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Your quiz</CardTitle>
                    <CardDescription>
                      Tap the best answer for each question. When all are filled, turn it in to see
                      explanations and XP.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!quizSubmitted ? (
                      <div className="sticky top-2 z-10 rounded-2xl border border-violet-200/70 bg-card/95 p-4 shadow-md backdrop-blur-md dark:border-violet-900/45">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                          <span className="text-violet-900 dark:text-violet-100">Your progress</span>
                          <span className="tabular-nums text-muted-foreground">
                            {practiceAnsweredCount} of {quizQuestions.length} answered
                          </span>
                        </div>
                        <Progress
                          value={practiceProgressPercent}
                          className="h-3 bg-violet-100 dark:bg-violet-950/60 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-violet-500 [&>[data-slot=progress-indicator]]:to-amber-500"
                        />
                      </div>
                    ) : null}

                    <div className="space-y-8">
                      {quizQuestions.map((q, qi) => {
                        const selected = quizAnswers[qi];
                        const show = quizSubmitted;
                        const isCorrect = selected === q.correctIndex;
                        return (
                          <div
                            key={qi}
                            className={cn(
                              "rounded-2xl border-2 p-4 transition-colors sm:p-5",
                              show
                                ? isCorrect
                                  ? "border-emerald-300/80 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/25"
                                  : "border-amber-300/80 bg-amber-50/45 dark:border-amber-800/50 dark:bg-amber-950/20"
                                : "border-violet-200/50 dark:border-violet-900/35",
                            )}
                          >
                            <Badge
                              variant="outline"
                              className="mb-3 w-fit border-violet-300 text-violet-800 dark:border-violet-700 dark:text-violet-200"
                            >
                              Question {qi + 1} of {quizQuestions.length}
                            </Badge>
                            <p className="mb-4 text-balance text-lg font-semibold leading-snug">
                              {q.question}
                            </p>
                            {!show ? (
                              <p className="mb-3 text-sm font-medium text-muted-foreground">
                                Tap one answer
                              </p>
                            ) : null}
                            <RadioGroup
                              value={
                                selected !== undefined ? String(selected) : undefined
                              }
                              onValueChange={(v) => {
                                if (quizSubmitted) return;
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [qi]: parseInt(v, 10),
                                }));
                              }}
                              disabled={quizSubmitted}
                              className="grid gap-3"
                            >
                              {q.options.map((opt, oi) => {
                                const id = `study-q${qi}-o${oi}`;
                                const isThisCorrect = oi === q.correctIndex;
                                const isWrongPick =
                                  show && selected === oi && oi !== q.correctIndex;
                                const picked = selected === oi;
                                return (
                                  <Label
                                    key={oi}
                                    htmlFor={id}
                                    className={cn(
                                      "flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-base font-normal transition-all",
                                      !show &&
                                        (picked
                                          ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20 dark:border-violet-400"
                                          : "border-muted-foreground/15 hover:border-violet-300/70 hover:bg-violet-50/40 dark:hover:bg-violet-950/25"),
                                      show && isThisCorrect &&
                                        "border-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/35",
                                      isWrongPick && "border-red-400/80 bg-red-50/80 dark:bg-red-950/35",
                                    )}
                                  >
                                    <RadioGroupItem value={String(oi)} id={id} className="h-5 w-5 shrink-0" />
                                    <span
                                      className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                        !show &&
                                          (picked
                                            ? "bg-violet-600 text-white"
                                            : "bg-muted text-muted-foreground"),
                                        show && isThisCorrect && "bg-emerald-600 text-white",
                                        isWrongPick && "bg-red-600 text-white",
                                        show && !isThisCorrect && !isWrongPick && "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {LABELS[oi]}
                                    </span>
                                    <span className="flex-1 leading-snug">
                                      {opt}
                                      {show && isThisCorrect ? (
                                        <span className="ml-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                          Got it!
                                        </span>
                                      ) : null}
                                    </span>
                                  </Label>
                                );
                              })}
                            </RadioGroup>
                            {show ? (
                              <div className="mt-4 space-y-2 border-t border-border/50 pt-4 text-base">
                                {!isCorrect && selected !== undefined ? (
                                  <p>
                                    <span className="text-muted-foreground">You picked: </span>
                                    <span className="font-medium">{q.options[selected]}</span>
                                  </p>
                                ) : null}
                                {!isCorrect ? (
                                  <p>
                                    <span className="text-muted-foreground">Best answer: </span>
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200">
                                      {q.options[q.correctIndex]}
                                    </span>
                                  </p>
                                ) : null}
                                <p className="border-l-4 border-violet-400/80 pl-3 leading-relaxed text-muted-foreground">
                                  {q.explanation}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {!quizSubmitted ? (
                      <Button
                        type="button"
                        className="h-14 w-full rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500"
                        disabled={
                          Object.keys(quizAnswers).length !== quizQuestions.length
                        }
                        onClick={submitQuiz}
                      >
                        Turn in &amp; see results
                      </Button>
                    ) : quizScore ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-4 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-card to-amber-50/50 p-5 dark:border-violet-900/50 dark:from-violet-950/35 dark:to-amber-950/20"
                      >
                        <div className="text-center">
                          <p className="text-lg font-bold text-violet-950 dark:text-violet-100">
                            {quizScore.percent >= 70
                              ? "Great practice!"
                              : quizScore.percent >= 40
                                ? "Nice try — keep going!"
                                : "Every quiz makes you stronger!"}
                          </p>
                          <StudyHelpStarRow percent={quizScore.percent} />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                          <Badge className="h-12 min-w-12 justify-center rounded-xl text-xl font-black bg-violet-600">
                            {quizScore.grade}
                          </Badge>
                          <div>
                            <p className="text-xl font-bold tabular-nums sm:text-2xl">
                              {quizScore.correct} / {quizScore.total}{" "}
                              <span className="text-lg font-semibold text-muted-foreground">
                                correct ({quizScore.percent}%)
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {performanceBand(quizScore.percent)}
                            </p>
                          </div>
                        </div>
                        {lastXpGain !== null ? (
                          <p className="text-center text-base font-semibold text-violet-800 dark:text-violet-200 sm:text-left">
                            +{lastXpGain} XP · Stage {stage.stage}: {stage.label}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full rounded-xl border-violet-200 dark:border-violet-800 sm:w-auto"
                          onClick={resetQuiz}
                        >
                          Start another quiz
                        </Button>
                      </motion.div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground">
            Replies and quizzes are generated by AI and can make mistakes. Always double-check with
            your teacher or textbook.
          </p>
        </>
      )}
    </div>
  );
}
