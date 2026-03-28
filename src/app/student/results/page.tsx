"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function StudentResultsPage(): React.ReactNode {
  const { student } = useStudentAuth();

  const marks = useQuery(
    api.students.getPublishedMarksForStudentPortal,
    student?.id ? { studentId: student.id as Id<"students">, limit: 80 } : "skip",
  );

  if (!student) {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <StudentPageHeader
        icon={BarChart3}
        title="Results"
        subtitle="Published scores from your exams"
      />

      {marks === undefined && (
        <p className="animate-pulse text-sm text-muted-foreground">Loading results…</p>
      )}

      {marks && marks.length === 0 && (
        <Card className="border-dashed border-blue-200/80 dark:border-blue-900/50">
          <CardHeader>
            <CardTitle>No published results yet</CardTitle>
            <CardDescription>
              When your teachers publish marks for your class, they will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {marks && marks.length > 0 && (
        <Card className="border-blue-200/80 shadow-sm dark:border-blue-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your marks</CardTitle>
            <CardDescription>{student.className}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((m) => (
                  <TableRow key={m._id}>
                    <TableCell className="font-medium">{m.examName}</TableCell>
                    <TableCell>{m.subjectName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.isAbsent ? "—" : m.totalScore}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{m.maxMarks}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.isAbsent ? "—" : `${Math.round(m.percentage)}%`}
                    </TableCell>
                    <TableCell>{m.isAbsent ? "Absent" : m.grade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
