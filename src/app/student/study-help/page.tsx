"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, SendHorizontal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

const axiosOpts = { withCredentials: true, headers: { "Content-Type": "application/json" } };

export default function StudentStudyHelpPage(): React.ReactNode {
  const { student } = useStudentAuth();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<{ available: boolean }>(
          "/api/student/study-help",
          axiosOpts,
        );
        if (!cancelled) setAvailable(data.available);
      } catch {
        if (!cancelled) setAvailable(false);
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

  if (!student) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6 sm:py-8">
      <StudentPageHeader
        icon={Sparkles}
        title="Study help"
        subtitle="Ask for explanations and study tips. This assistant will not complete homework or tests for you."
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
          <div className="flex min-h-[min(420px,50vh)] flex-1 flex-col rounded-2xl border border-blue-200/80 bg-card shadow-sm dark:border-blue-900/50">
            <ScrollArea className="min-h-[min(420px,50vh)] flex-1 p-4">
              <div className="space-y-4 pr-2">
                {turns.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Try questions like: “What is photosynthesis in simple terms?” or “How do I plan
                    an essay about my community?” Avoid pasting exact homework you need to hand in.
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

          <p className="text-xs text-muted-foreground">
            Replies are generated by AI and can make mistakes. Always double-check important facts
            with your teacher or textbook.
          </p>
        </>
      )}
    </div>
  );
}
