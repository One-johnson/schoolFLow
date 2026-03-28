"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { ArrowDownToLine, ListChecks } from "lucide-react";

export type StudentHomeworkSummary = {
  _id: Id<"homework">;
  title: string;
  dueDate: string;
  createdAt?: string;
  subjectName?: string;
  teacherName?: string;
  attachmentCount?: number;
  submissionStatus: "none" | "submitted" | "marked";
  grade?: string;
  isOverdue: boolean;
};

type StudentHomeworkDetailSidebarProps = {
  summaries: StudentHomeworkSummary[] | undefined;
  currentHomeworkId: Id<"homework">;
  onJumpToSubmit: () => void;
};

export function StudentHomeworkDetailSidebar({
  summaries,
  currentHomeworkId,
  onJumpToSubmit,
}: StudentHomeworkDetailSidebarProps) {
  const total = summaries?.length ?? 0;
  const done =
    summaries?.filter((s) => s.submissionStatus === "submitted" || s.submissionStatus === "marked")
      .length ?? 0;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const others = summaries?.filter((s) => s._id !== currentHomeworkId) ?? [];

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <Card className="border-violet-200/50 shadow-sm dark:border-violet-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Your class progress
          </CardTitle>
          <CardDescription>All active homework for your class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries === undefined ? (
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
          ) : (
            <>
              <Progress value={progressPct} className="h-2 bg-violet-500/15 [&>[data-slot=progress-indicator]]:bg-violet-600 dark:[&>[data-slot=progress-indicator]]:bg-violet-400" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{done}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> turned in
              </p>
            </>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full gap-2 bg-violet-100/80 text-violet-900 hover:bg-violet-200/90 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/60"
            onClick={onJumpToSubmit}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Jump to submit
          </Button>
        </CardContent>
      </Card>

      <Card className="border-violet-200/50 shadow-sm dark:border-violet-900/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Other assignments</CardTitle>
          <CardDescription>Due soonest first · Click to open</CardDescription>
        </CardHeader>
        <CardContent className="p-0 px-0">
          {summaries === undefined ? (
            <div className="space-y-2 px-6 pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          ) : others.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">
              This is your only active assignment right now.
            </p>
          ) : (
            <ScrollArea className="h-[min(380px,calc(100vh-22rem))]">
              <ul className="space-y-1 px-4 pb-4 pr-3">
                {others.map((s) => (
                  <li key={s._id}>
                    <Link
                      href={`/student/homework/${s._id}`}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl border border-transparent p-2.5 text-left transition-all duration-200",
                        "hover:border-violet-200/80 hover:bg-violet-500/[0.07] hover:shadow-sm",
                        "dark:hover:border-violet-800/50 dark:hover:bg-violet-500/[0.06]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                        s.isOverdue &&
                          "border-destructive/25 bg-destructive/[0.06] hover:border-destructive/40",
                      )}
                    >
                      <span className="text-sm font-medium leading-snug line-clamp-2">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Due{" "}
                        {formatDistanceToNow(new Date(s.dueDate), { addSuffix: true })}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {s.subjectName ? (
                          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                            {s.subjectName}
                          </Badge>
                        ) : null}
                        {s.submissionStatus === "marked" ? (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600/90">Marked</Badge>
                        ) : s.submissionStatus === "submitted" ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Submitted
                          </Badge>
                        ) : s.isOverdue ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                            To do
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
