"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6 sm:py-8">
      <StudentPageHeader
        icon={Sparkles}
        title="Study help"
        subtitle="Chat for explanations and tips, or take practice quizzes with stages and your own progress log. Not your real exams."
      />

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
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="quiz" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                Practice quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0 outline-none">
              <div className="flex min-h-[min(420px,50vh)] flex-1 flex-col rounded-2xl border border-blue-200/80 bg-card shadow-sm dark:border-blue-900/50">
                <ScrollArea className="min-h-[min(420px,50vh)] flex-1 p-4">
                  <div className="space-y-4 pr-2">
                    {turns.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Try questions like: “What is photosynthesis in simple terms?” or “How do I
                        plan an essay about my community?” Avoid pasting exact homework you need to
                        hand in.
                      </p>
                    )}
                    {turns.map((t, i) => (
                      <div
                        key={`${i}-${t.role}`}
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm leading-relaxed",
                          t.role === "user"
                            ? "ml-6 bg-blue-600 text-white dark:bg-blue-600"
                            : "mr-4 border border-border/80 bg-muted/40",
                        )}
                      >
                        {t.content}
                      </div>
                    ))}
                    {sending && (
                      <div className="mr-4 flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
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

                <div className="flex flex-col gap-2 border-t border-border/60 p-3 sm:flex-row sm:items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question…"
                    rows={3}
                    className="min-h-[80px] resize-none sm:flex-1"
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
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                    disabled={sending || !input.trim()}
                    onClick={() => void send()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                          Earn XP from each quiz. Stages track how much you practise—only on this
                          device.
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
                      {xpToNext > 0 ? `${xpToNext} XP to next stage` : "Stage complete—keep going!"}
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
                      Finish a quiz below to see your scores here and level up.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-violet-200/60 dark:border-violet-900/40">
                <CardHeader>
                  <CardTitle className="text-lg">Build a practice quiz</CardTitle>
                  <CardDescription>
                    Up to {STUDY_HELP_QUIZ_MAX_COUNT} questions. Very long quizzes may take longer;
                    if generation fails, try fewer questions.
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
                      className="resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={quizDifficulty}
                        onValueChange={(v) =>
                          setQuizDifficulty(v as "easy" | "medium" | "hard")
                        }
                        disabled={quizLoading}
                      >
                        <SelectTrigger className="w-full sm:w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easier</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Harder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Questions</Label>
                      <Select
                        value={quizCount}
                        onValueChange={setQuizCount}
                        disabled={quizLoading}
                      >
                        <SelectTrigger className="w-full sm:w-[100px]">
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
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {quizLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        "Generate quiz"
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
                      Answer every question, then submit to see your grade, explanations, and XP.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {quizQuestions.map((q, qi) => {
                      const selected = quizAnswers[qi];
                      const show = quizSubmitted;
                      const isCorrect = selected === q.correctIndex;
                      return (
                        <div
                          key={qi}
                          className={cn(
                            "rounded-xl border p-4 transition-colors",
                            show
                              ? isCorrect
                                ? "border-emerald-200/90 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/25"
                                : "border-amber-200/90 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/25"
                              : "border-border/80",
                          )}
                        >
                          <p className="font-medium text-sm mb-3">
                            {qi + 1}. {q.question}
                          </p>
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
                            className="space-y-2"
                          >
                            {q.options.map((opt, oi) => {
                              const isThisCorrect = oi === q.correctIndex;
                              const isWrongPick =
                                show &&
                                selected === oi &&
                                oi !== q.correctIndex;
                              return (
                                <div
                                  key={oi}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-lg px-2 py-1.5 border border-transparent",
                                    !show && "hover:bg-muted/50",
                                    show && isThisCorrect &&
                                      "border-emerald-300/80 bg-emerald-100/50 dark:bg-emerald-950/40",
                                    isWrongPick &&
                                      "border-red-300/80 bg-red-50/70 dark:bg-red-950/30",
                                  )}
                                >
                                  <RadioGroupItem value={String(oi)} id={`q${qi}-o${oi}`} />
                                  <Label
                                    htmlFor={`q${qi}-o${oi}`}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {opt}
                                    {show && isThisCorrect ? (
                                      <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        ✓ Correct
                                      </span>
                                    ) : null}
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                          {show ? (
                            <div className="mt-3 space-y-2 text-sm border-t border-border/50 pt-3">
                              {!isCorrect && selected !== undefined ? (
                                <p>
                                  <span className="text-muted-foreground">You chose: </span>
                                  <span className="font-medium">{q.options[selected]}</span>
                                </p>
                              ) : null}
                              {!isCorrect ? (
                                <p>
                                  <span className="text-muted-foreground">Correct answer: </span>
                                  <span className="font-medium text-emerald-800 dark:text-emerald-200">
                                    {q.options[q.correctIndex]}
                                  </span>
                                </p>
                              ) : null}
                              <p className="text-muted-foreground border-l-2 border-violet-400/70 pl-3 leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {!quizSubmitted ? (
                      <Button
                        type="button"
                        className="w-full sm:w-auto"
                        disabled={
                          Object.keys(quizAnswers).length !== quizQuestions.length
                        }
                        onClick={submitQuiz}
                      >
                        Submit &amp; see results
                      </Button>
                    ) : quizScore ? (
                      <div className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/50 dark:bg-violet-950/30 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="h-10 min-w-10 justify-center text-lg font-bold bg-violet-600">
                            {quizScore.grade}
                          </Badge>
                          <div>
                            <p className="font-semibold text-lg tabular-nums">
                              {quizScore.correct} / {quizScore.total} correct (
                              {quizScore.percent}%)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {performanceBand(quizScore.percent)}
                            </p>
                          </div>
                        </div>
                        {lastXpGain !== null ? (
                          <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
                            +{lastXpGain} XP earned · Stage {stage.stage} ({stage.label})
                          </p>
                        ) : null}
                        <Button type="button" variant="outline" size="sm" onClick={resetQuiz}>
                          Start another quiz
                        </Button>
                      </div>
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
