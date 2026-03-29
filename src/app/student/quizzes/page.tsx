"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  classQuizWindowState,
  formatClassQuizDateRange,
} from "@/lib/class-quiz-display";

const PAGE_SIZE = 10;

export default function StudentQuizzesPage() {
  const { student } = useStudentAuth();
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const rows = useQuery(
    api.classQuizzes.listForStudentPortal,
    student
      ? {
          schoolId: student.schoolId,
          studentId: student.id as Id<"students">,
        }
      : "skip",
  );

  const total = rows?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    if (!rows) return [];
    const start = page * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24 pt-2">
      <StudentPageHeader
        title="Class quizzes"
        subtitle="Teacher-assigned quizzes with a fixed time window. Separate from Study help practice."
        icon={ListChecks}
      />

      {rows === undefined ? (
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No class quizzes right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {pageRows.map(({ quiz, hasSubmitted, inProgress }) => {
              const { inWindow, windowLabel } = classQuizWindowState(
                now,
                quiz.opensAt,
                quiz.closesAt,
              );

              return (
                <Link key={quiz._id} href={`/student/quizzes/${quiz._id}`}>
                  <Card className="transition-colors hover:bg-blue-500/5 dark:hover:bg-blue-500/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold leading-snug pr-2">
                          {quiz.title}
                        </CardTitle>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hasSubmitted ? (
                          <Badge variant="secondary">Submitted</Badge>
                        ) : inProgress ? (
                          <Badge className="bg-amber-600 hover:bg-amber-600">In progress</Badge>
                        ) : null}
                        <Badge variant={inWindow ? "default" : "outline"}>{windowLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <Calendar className="h-3 w-3" />
                        {formatClassQuizDateRange(quiz.opensAt, quiz.closesAt)}
                      </p>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/50">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="border-blue-200 dark:border-blue-800"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums min-w-[5rem] text-center">
                  Page {page + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="border-blue-200 dark:border-blue-800"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
