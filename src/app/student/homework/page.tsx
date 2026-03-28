"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Library } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentHomeworkPage(): React.ReactNode {
  const { student } = useStudentAuth();

  const homework = useQuery(
    api.students.getHomeworkForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students">, limit: 100 } : "skip",
  );

  if (!student) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <StudentPageHeader
        icon={BookOpen}
        title="Homework"
        subtitle={`Assignments for ${student.className}`}
      />

      {homework === undefined && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading your assignments…</p>
      )}

      {homework && homework.length === 0 && (
        <Card className="border-violet-200/60 dark:border-violet-800/40 border-dashed bg-violet-500/[0.03] dark:bg-violet-500/[0.05]">
          <CardHeader className="text-center py-10">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Library className="h-7 w-7" />
            </div>
            <CardTitle>All clear</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              When teachers post homework for your class, it&apos;ll land here. Check back after class.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {homework && homework.length > 0 && (
        <div className="space-y-4">
          {homework.map((h) => (
            <Card
              key={h._id}
              className="border-violet-200/50 dark:border-violet-800/40 shadow-sm shadow-violet-500/5 overflow-hidden hover:shadow-md hover:shadow-violet-500/10 transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{h.title}</CardTitle>
                <CardDescription>
                  {h.subjectName && <span className="font-medium text-violet-600/90 dark:text-violet-400">{h.subjectName} · </span>}
                  Due {new Date(h.dueDate).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{h.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
