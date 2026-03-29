"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListChecks, Plus, Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { formatClassQuizDateRange } from "@/lib/class-quiz-display";

const PAGE_SIZE = 10;

export default function TeacherQuizzesPage() {
  const { teacher } = useTeacherAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const rows = useQuery(
    api.classQuizzes.listForTeacher,
    teacher
      ? {
          schoolId: teacher.schoolId,
          teacherId: teacher.id,
          teacherClassIds: teacher.classIds ?? [],
        }
      : "skip",
  );

  const filtered =
    rows?.filter((q) => (statusFilter === "all" ? true : q.status === statusFilter)) ?? [];

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-7 w-7" />
            Class quizzes
          </h1>
          <p className="text-muted-foreground mt-1">
            Timed multiple-choice quizzes for your classes (separate from Study help practice)
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/quizzes/new">
            <Plus className="h-4 w-4 mr-2" />
            New quiz
          </Link>
        </Button>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {rows === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ListChecks className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No quizzes yet.</p>
            <Button asChild>
              <Link href="/teacher/quizzes/new">
                <Plus className="h-4 w-4 mr-2" />
                Create a quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageRows.map((q) => (
              <Link key={q._id} href={`/teacher/quizzes/${q._id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{q.title}</CardTitle>
                      <Badge
                        variant={
                          q.status === "published"
                            ? "default"
                            : q.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                        className="shrink-0"
                      >
                        {q.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {q.className}
                      </span>
                      {q.subjectName && <span>{q.subjectName}</span>}
                      <span className="flex items-center gap-1 w-full">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatClassQuizDateRange(q.opensAt, q.closesAt)}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
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
