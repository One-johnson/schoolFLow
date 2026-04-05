"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  classQuizWindowState,
  formatClassQuizDateRange,
} from "@/lib/class-quiz-display";
import type { Id } from "../../../convex/_generated/dataModel";

export type ClassQuizListAttemptSummary =
  | {
      status: "submitted";
      startedAt: string;
      submittedAt?: string | null;
      score: number | null;
      maxScore: number | null;
      percent: number | null;
    }
  | {
      status: "in_progress";
      startedAt: string;
      submittedAt: null;
      score: null;
      maxScore: null;
      percent: null;
    }
  | null;

export interface ClassQuizCardProps {
  href: string;
  quiz: {
    _id: Id<"classQuizzes">;
    title: string;
    opensAt: string;
    closesAt: string;
  };
  hasSubmitted: boolean;
  inProgress: boolean;
  attemptSummary: ClassQuizListAttemptSummary;
  now: number;
}

function friendlyWindowLabel(label: string): string {
  if (label === "Upcoming") return "Coming up";
  return label;
}

export function ClassQuizCard({
  href,
  quiz,
  hasSubmitted,
  inProgress,
  attemptSummary,
  now,
}: ClassQuizCardProps): React.JSX.Element {
  const { inWindow, windowLabel } = classQuizWindowState(now, quiz.opensAt, quiz.closesAt);
  const labelShown = friendlyWindowLabel(windowLabel);

  const scoreLine =
    hasSubmitted &&
    attemptSummary &&
    attemptSummary.status === "submitted" &&
    attemptSummary.score !== null &&
    attemptSummary.maxScore !== null
      ? {
          score: attemptSummary.score,
          max: attemptSummary.maxScore,
          percent: attemptSummary.percent,
        }
      : null;

  const submittedAtLabel =
    hasSubmitted &&
    attemptSummary &&
    attemptSummary.status === "submitted" &&
    attemptSummary.submittedAt
      ? new Date(attemptSummary.submittedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  return (
    <Link href={href} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-2xl">
      <Card
        className={cn(
          "relative h-full overflow-hidden border-2 border-violet-300 bg-card shadow-sm transition-all duration-200",
          "hover:border-violet-500 hover:shadow-md dark:border-violet-800 dark:hover:border-violet-600",
          inWindow && !hasSubmitted && "ring-2 ring-emerald-500/40 dark:ring-emerald-500/30",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-amber-500 to-sky-600 dark:from-violet-500 dark:via-amber-400 dark:to-sky-500" />
        <CardHeader className="space-y-2 p-3 pt-3.5 sm:p-4 sm:pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-violet-900 text-white shadow-sm dark:from-violet-600 dark:to-violet-800">
                <ClipboardList className="h-4 w-4" />
              </div>
              <CardTitle className="line-clamp-2 pr-0.5 text-left text-sm font-bold leading-tight text-foreground group-hover:text-violet-800 dark:group-hover:text-violet-200 sm:text-base">
                {quiz.title}
              </CardTitle>
            </div>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-700 transition-transform group-hover:translate-x-0.5 dark:text-violet-300" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {hasSubmitted ? (
              <Badge className="rounded-md bg-violet-700 px-2 py-0 text-[11px] font-semibold text-white hover:bg-violet-700 sm:text-xs">
                Turned in
              </Badge>
            ) : inProgress ? (
              <Badge className="rounded-md bg-amber-600 px-2 py-0 text-[11px] font-semibold text-white hover:bg-amber-600 sm:text-xs">
                In progress
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                "rounded-md text-[11px] font-semibold sm:text-xs",
                windowLabel === "Open now" &&
                  "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white dark:border-emerald-600",
                windowLabel === "Upcoming" &&
                  "border-sky-600 bg-sky-100 text-sky-950 hover:bg-sky-100 dark:border-sky-600 dark:bg-sky-900/60 dark:text-sky-50",
                windowLabel === "Closed" &&
                  "border-border bg-muted/50 text-foreground dark:bg-muted/30",
              )}
            >
              {labelShown}
            </Badge>
          </div>

          {scoreLine && (
            <div className="rounded-lg border border-violet-300 bg-violet-100/90 px-2.5 py-2 dark:border-violet-800 dark:bg-violet-950/50">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-900 dark:text-violet-200 sm:text-xs">
                Your score
              </p>
              <p className="text-lg font-black tabular-nums leading-tight text-violet-950 dark:text-violet-100 sm:text-xl">
                {scoreLine.score}
                <span className="text-sm font-bold text-violet-800/90 dark:text-violet-300 sm:text-base">
                  /{scoreLine.max}
                </span>
                {scoreLine.percent !== null ? (
                  <span className="ml-1.5 text-xs font-bold text-violet-800 dark:text-violet-300 sm:text-sm">
                    ({scoreLine.percent}%)
                  </span>
                ) : null}
              </p>
            </div>
          )}

          {submittedAtLabel && (
            <p className="text-[11px] text-muted-foreground sm:text-xs">Turned in {submittedAtLabel}</p>
          )}

          <div className="flex items-end justify-between gap-2 border-t border-violet-200/80 pt-2 dark:border-violet-800/60">
            <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-foreground/90 sm:text-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-800 dark:text-violet-300" />
              <span className="leading-tight">{formatClassQuizDateRange(quiz.opensAt, quiz.closesAt)}</span>
            </p>
            <span className="shrink-0 text-[11px] font-bold text-violet-800 dark:text-violet-300 sm:text-xs">
              Open
              <ChevronRight className="ml-0 inline h-3 w-3 align-text-bottom transition-transform group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
