"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function defaultClosesAt(opens: string): string {
  const d = new Date(opens);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

function toLocalValue(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function NewClassQuizPage() {
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const createDraft = useMutation(api.classQuizzes.createDraft);

  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const now = new Date();
  const [opensLocal, setOpensLocal] = useState(toLocalValue(now.toISOString()));
  const [closesLocal, setClosesLocal] = useState(
    toLocalValue(defaultClosesAt(now.toISOString())),
  );
  const [useTimeLimit, setUseTimeLimit] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [graceMinutes, setGraceMinutes] = useState(0);
  const [resultsVis, setResultsVis] = useState<"immediate" | "after_close" | "manual">(
    "immediate",
  );
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!teacher) return;
    const idx = (teacher.classIds ?? []).indexOf(classId);
    if (idx < 0 || !classId) {
      toast.error("Choose a class");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    const opensAt = new Date(opensLocal).toISOString();
    const closesAt = new Date(closesLocal).toISOString();
    if (new Date(opensAt) >= new Date(closesAt)) {
      toast.error("Open time must be before close time");
      return;
    }
    let timeLimitSeconds: number | undefined;
    if (useTimeLimit) {
      const sec = Math.round(timeLimitMinutes * 60);
      if (sec < 60 || sec > 14400) {
        toast.error("Time limit must be between 1 and 240 minutes");
        return;
      }
      timeLimitSeconds = sec;
    }
    setSaving(true);
    try {
      const id = await createDraft({
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`.trim(),
        classId,
        className: teacher.classNames?.[idx] ?? classId,
        subjectName: subjectName.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        opensAt,
        closesAt,
        timeLimitSeconds,
        submitGraceSecondsAfterClose:
          graceMinutes > 0 ? Math.min(7200, Math.max(60, graceMinutes * 60)) : undefined,
        resultsVisibility: resultsVis,
      });
      toast.success("Draft created — add questions next");
      router.push(`/teacher/quizzes/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create quiz");
    } finally {
      setSaving(false);
    }
  };

  if (!teacher) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/teacher/quizzes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">New class quiz</h1>
        <p className="text-muted-foreground mt-1">
          You will add questions on the next screen. Students only see the quiz after you publish.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId || undefined} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {(teacher.classIds ?? []).map((cid, i) => (
                  <SelectItem key={cid} value={cid}>
                    {teacher.classNames?.[i] ?? cid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cq-title">Title</Label>
            <Input
              id="cq-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. March review test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cq-subject">Subject (optional)</Label>
            <Input
              id="cq-subject"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cq-desc">Instructions (optional)</Label>
            <Textarea
              id="cq-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cq-opens">Opens</Label>
              <Input
                id="cq-opens"
                type="datetime-local"
                value={opensLocal}
                onChange={(e) => setOpensLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cq-closes">Closes</Label>
              <Input
                id="cq-closes"
                type="datetime-local"
                value={closesLocal}
                onChange={(e) => setClosesLocal(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="cq-tlimit"
              checked={useTimeLimit}
              onCheckedChange={(c) => setUseTimeLimit(c === true)}
            />
            <Label htmlFor="cq-tlimit" className="font-normal cursor-pointer">
              Per-attempt time limit
            </Label>
          </div>
          {useTimeLimit && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="cq-min">Minutes</Label>
              <Input
                id="cq-min"
                type="number"
                min={1}
                max={240}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 1)}
                className="w-32"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cq-grace">Extra submit time after close (minutes)</Label>
            <p className="text-xs text-muted-foreground">0 = no grace. In-progress attempts only.</p>
            <Input
              id="cq-grace"
              type="number"
              min={0}
              max={120}
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Math.max(0, Number(e.target.value) || 0))}
              className="w-32"
            />
          </div>
          <div className="space-y-2">
            <Label>When students see full results</Label>
            <Select
              value={resultsVis}
              onValueChange={(v) =>
                setResultsVis(v as "immediate" | "after_close" | "manual")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Right after submit</SelectItem>
                <SelectItem value="after_close">After quiz closes</SelectItem>
                <SelectItem value="manual">When I release them</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create draft"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
