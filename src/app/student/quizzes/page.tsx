"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, ChevronRight, Calendar } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentQuizzesPage() {
  const { student } = useStudentAuth();
  const [now, setNow] = useState(() => Date.now());

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

  if (!student) {
    return null;
  }

  const formatRange = (opens: string, closes: string) => {
    const o = new Date(opens);
    const c = new Date(closes);
    const fmt = (d: Date) =>
      d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    return `${fmt(o)} – ${fmt(c)}`;
  };

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
        <div className="space-y-3">
          {rows.map(({ quiz, inWindow, hasSubmitted, inProgress }) => {
            const before = now < new Date(quiz.opensAt).getTime();
            const after = now > new Date(quiz.closesAt).getTime();
            let windowLabel = "Open now";
            if (before) windowLabel = "Upcoming";
            if (after) windowLabel = "Closed";

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
                      {formatRange(quiz.opensAt, quiz.closesAt)}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
