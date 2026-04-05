"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { ClassQuizCard } from "@/components/student/class-quiz-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, ChevronLeft, Smile, ChevronRight } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

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

  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const pageRows = useMemo(() => {
    if (!rows) return [];
    const start = safePage * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6 pb-24 pt-2">
      <StudentPageHeader
        variant="playful"
        title="Class quizzes"
        subtitle="Quizzes from your teacher. Each one opens and closes at set times—different from Study help practice."
        icon={ListChecks}
      />

      {rows === undefined ? (
        <div className="h-44 rounded-2xl bg-gradient-to-r from-violet-100/40 via-muted/40 to-amber-100/40 animate-pulse dark:from-violet-950/30 dark:via-muted/30 dark:to-amber-950/20" />
      ) : rows.length === 0 ? (
        <Card className="overflow-hidden border-violet-200/70 dark:border-violet-900/40">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-500 text-white shadow-md">
              <Smile className="h-7 w-7" />
            </div>
            <p className="max-w-sm text-base font-medium text-foreground">
              No class quizzes right now
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              When your teacher publishes one, it will show up here. You can still use Study help
              to practise on your own.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.map(({ quiz, hasSubmitted, inProgress, attemptSummary }) => (
              <ClassQuizCard
                key={quiz._id}
                href={`/student/quizzes/${quiz._id}`}
                quiz={quiz}
                hasSubmitted={hasSubmitted}
                inProgress={inProgress}
                attemptSummary={attemptSummary}
                now={now}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-violet-200/60 dark:border-violet-900/50">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {safePage * PAGE_SIZE + 1}–
                {Math.min((safePage + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border-violet-200 dark:border-violet-800"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums min-w-[5rem] text-center">
                  Page {safePage + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-xl border-violet-200 dark:border-violet-800"
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
