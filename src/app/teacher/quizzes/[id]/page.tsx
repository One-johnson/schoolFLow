"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, RotateCcw, FileText, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Id } from "../../../../../convex/_generated/dataModel";

type QForm = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  points: number;
};

const emptyQ = (): QForm => ({
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  points: 1,
});

function toLocalValue(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function TeacherQuizEditorPage() {
  const params = useParams();
  const quizId = params.id as Id<"classQuizzes">;
  const { teacher } = useTeacherAuth();

  const data = useQuery(
    api.classQuizzes.getForTeacher,
    teacher ? { quizId, teacherId: teacher.id } : "skip",
  );

  const attempts = useQuery(
    api.classQuizzes.listAttemptsForTeacher,
    teacher && data?.quiz && data.quiz.status === "published"
      ? { quizId, teacherId: teacher.id }
      : "skip",
  );

  const updateDraft = useMutation(api.classQuizzes.updateDraft);
  const replaceQuestions = useMutation(api.classQuizzes.replaceQuestions);
  const publishQuiz = useMutation(api.classQuizzes.publishQuiz);
  const archiveQuiz = useMutation(api.classQuizzes.archiveQuiz);
  const updatePublishedQuizSettings = useMutation(api.classQuizzes.updatePublishedQuizSettings);
  const releaseQuizResults = useMutation(api.classQuizzes.releaseQuizResults);
  const resetStudentQuizAttempt = useMutation(api.classQuizzes.resetStudentQuizAttempt);
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const setQuizHandout = useMutation(api.classQuizzes.setQuizHandout);
  const clearQuizHandout = useMutation(api.classQuizzes.clearQuizHandout);

  const handoutPreviewUrl = useQuery(
    api.photos.getFileUrl,
    teacher && data?.quiz?.handoutStorageId
      ? { storageId: data.quiz.handoutStorageId }
      : "skip",
  );

  const handoutFileInputRef = useRef<HTMLInputElement>(null);
  const [handoutUploading, setHandoutUploading] = useState(false);
  const [handoutClearing, setHandoutClearing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [opensLocal, setOpensLocal] = useState("");
  const [closesLocal, setClosesLocal] = useState("");
  const [useTimeLimit, setUseTimeLimit] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [questions, setQuestions] = useState<QForm[]>([emptyQ()]);
  const [showPublish, setShowPublish] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingQs, setSavingQs] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [graceMinutes, setGraceMinutes] = useState(0);
  const [resultsVis, setResultsVis] = useState<"immediate" | "after_close" | "manual">(
    "immediate",
  );
  const [savingPubSettings, setSavingPubSettings] = useState(false);
  const [resetStudentId, setResetStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.quiz) return;
    const { quiz, questions: qs } = data;
    setTitle(quiz.title);
    setDescription(quiz.description ?? "");
    setSubjectName(quiz.subjectName ?? "");
    setOpensLocal(toLocalValue(quiz.opensAt));
    setClosesLocal(toLocalValue(quiz.closesAt));
    const tl = quiz.timeLimitSeconds;
    setUseTimeLimit(!!tl);
    setTimeLimitMinutes(tl ? Math.round(tl / 60) : 30);
    setGraceMinutes(
      quiz.submitGraceSecondsAfterClose
        ? Math.round(quiz.submitGraceSecondsAfterClose / 60)
        : 0,
    );
    setResultsVis(quiz.resultsVisibility ?? "immediate");
    if (qs.length > 0) {
      setQuestions(
        qs.map((q) => ({
          question: q.question,
          options: [q.options[0], q.options[1], q.options[2], q.options[3]] as [
            string,
            string,
            string,
            string,
          ],
          correctIndex: q.correctIndex,
          points: q.points,
        })),
      );
    } else {
      setQuestions([emptyQ()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resync when server quiz changes
  }, [data?.quiz?._id, data?.quiz?.updatedAt]);

  const saveMeta = async () => {
    if (!teacher || !data?.quiz || data.quiz.status !== "draft") return;
    setSavingMeta(true);
    try {
      await updateDraft({
        quizId,
        teacherId: teacher.id,
        title: title.trim(),
        description: description.trim(),
        subjectName: subjectName.trim(),
        opensAt: new Date(opensLocal).toISOString(),
        closesAt: new Date(closesLocal).toISOString(),
        timeLimitSeconds: useTimeLimit
          ? Math.min(14400, Math.max(60, Math.round(timeLimitMinutes * 60)))
          : null,
        submitGraceSecondsAfterClose:
          graceMinutes > 0 ? Math.min(7200, Math.max(60, graceMinutes * 60)) : null,
        resultsVisibility: resultsVis,
      });
      toast.success("Details saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMeta(false);
    }
  };

  const saveQuestions = async () => {
    if (!teacher || !data?.quiz || data.quiz.status !== "draft") return;
    setSavingQs(true);
    try {
      await replaceQuestions({
        quizId,
        teacherId: teacher.id,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: [...q.options],
          correctIndex: q.correctIndex,
          points: q.points,
        })),
      });
      toast.success("Questions saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingQs(false);
    }
  };

  const doPublish = async () => {
    if (!teacher || !data?.quiz || data.quiz.status !== "draft") return;
    setPublishing(true);
    try {
      await replaceQuestions({
        quizId,
        teacherId: teacher.id,
        questions: questions.map((q) => ({
          question: q.question.trim(),
          options: [...q.options],
          correctIndex: q.correctIndex,
          points: q.points,
        })),
      });
      await publishQuiz({ quizId, teacherId: teacher.id });
      toast.success("Published — students were notified");
      setShowPublish(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const doArchive = async () => {
    if (!teacher) return;
    try {
      await archiveQuiz({ quizId, teacherId: teacher.id });
      toast.success("Quiz archived");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };

  const savePublishedSettings = async () => {
    if (!teacher || !data?.quiz || data.quiz.status !== "published") return;
    setSavingPubSettings(true);
    try {
      await updatePublishedQuizSettings({
        quizId,
        teacherId: teacher.id,
        submitGraceSecondsAfterClose:
          graceMinutes > 0 ? Math.min(7200, Math.max(60, graceMinutes * 60)) : null,
        resultsVisibility: resultsVis,
      });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPubSettings(false);
    }
  };

  const doReleaseResults = async () => {
    if (!teacher) return;
    try {
      await releaseQuizResults({ quizId, teacherId: teacher.id });
      toast.success("Detailed results are now visible to students");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Release failed");
    }
  };

  const doResetStudent = async () => {
    if (!teacher || !resetStudentId) return;
    try {
      await resetStudentQuizAttempt({
        quizId,
        teacherId: teacher.id,
        studentId: resetStudentId,
      });
      toast.success("Attempt cleared — student can start again");
      setResetStudentId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    }
  };

  const prepareHandoutFile = async (file: File): Promise<File> => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".doc") && !lower.endsWith(".docx")) {
      return file;
    }
    const fd = new FormData();
    fd.append("file", file);
    const conv = await fetch("/api/teacher/class-quiz/handout-to-pdf", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (conv.status === 503) {
      const body = (await conv.json().catch(() => null)) as { code?: string } | null;
      if (body?.code === "CONVERT_DISABLED") {
        return file;
      }
    }
    if (!conv.ok) {
      const errBody = (await conv.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errBody?.error ?? "Could not convert Word to PDF");
    }
    const blob = await conv.blob();
    const base = file.name.replace(/\.(docx?|DOCX?)$/i, "") || "handout";
    return new File([blob], `${base}.pdf`, { type: "application/pdf" });
  };

  const uploadHandout = async (file: File) => {
    if (!teacher || !data?.quiz) return;
    setHandoutUploading(true);
    try {
      const toStore = await prepareHandoutFile(file);
      const lowerOrig = file.name.toLowerCase();
      const wasConverted =
        (lowerOrig.endsWith(".doc") || lowerOrig.endsWith(".docx")) &&
        toStore.name.toLowerCase().endsWith(".pdf");

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": toStore.type || "application/octet-stream" },
        body: toStore,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const json = (await res.json()) as { storageId?: string };
      if (!json.storageId) {
        throw new Error("Upload did not return storage");
      }
      await setQuizHandout({
        quizId,
        teacherId: teacher.id,
        storageId: json.storageId,
        fileName: toStore.name,
      });
      toast.success(wasConverted ? "Handout converted to PDF and saved" : "Handout saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload handout");
    } finally {
      setHandoutUploading(false);
    }
  };

  const removeHandout = async () => {
    if (!teacher || !data?.quiz?.handoutStorageId) return;
    setHandoutClearing(true);
    try {
      await clearQuizHandout({ quizId, teacherId: teacher.id });
      toast.success("Handout removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove handout");
    } finally {
      setHandoutClearing(false);
    }
  };

  if (!teacher) {
    return (
      <div className="py-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="py-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-4">
        <p className="text-muted-foreground">Quiz not found.</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/teacher/quizzes">Back to list</Link>
        </Button>
      </div>
    );
  }

  const { quiz } = data;
  const isDraft = quiz.status === "draft";

  return (
    <div className="space-y-6 py-4 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
        <Link href="/teacher/quizzes">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All quizzes
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold flex-1 min-w-0">{quiz.title}</h1>
        <Badge>{quiz.status}</Badge>
      </div>

      {!isDraft && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              This quiz is {quiz.status}. Students open it from{" "}
              <span className="font-medium text-foreground">Student hub → Class quizzes</span>.
              {quiz.status === "published" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={doArchive}>
                    Archive quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {quiz.handoutStorageId && quiz.handoutFileName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Student handout
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium truncate max-w-full">{quiz.handoutFileName}</span>
                {handoutPreviewUrl ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={handoutPreviewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Loading link…</span>
                )}
              </CardContent>
            </Card>
          )}

          {quiz.status === "published" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Window, grace & results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Extra submit time after close (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      className="w-32"
                      value={graceMinutes}
                      onChange={(e) =>
                        setGraceMinutes(Math.max(0, Number(e.target.value) || 0))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>When students see per-question breakdown</Label>
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
                  {resultsVis === "manual" && !quiz.resultsReleasedAt && (
                    <Button type="button" variant="secondary" onClick={doReleaseResults}>
                      Release detailed results to students
                    </Button>
                  )}
                  {resultsVis === "manual" && quiz.resultsReleasedAt && (
                    <p className="text-sm text-muted-foreground">
                      Released at{" "}
                      {new Date(quiz.resultsReleasedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  <Button onClick={savePublishedSettings} disabled={savingPubSettings}>
                    {savingPubSettings ? "Saving…" : "Save settings"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {attempts === undefined ? (
                    <Skeleton className="h-32 w-full" />
                  ) : attempts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attempts yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attempts.map((a) => (
                          <TableRow key={a._id}>
                            <TableCell>{a.studentName}</TableCell>
                            <TableCell>{a.status}</TableCell>
                            <TableCell>
                              {a.status === "submitted"
                                ? `${a.score ?? "—"}/${a.maxScore ?? "—"}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setResetStudentId(a.studentId)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {isDraft && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Schedule & details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eq-title">Title</Label>
                <Input id="eq-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-sub">Subject (optional)</Label>
                <Input
                  id="eq-sub"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eq-desc">Instructions</Label>
                <Textarea
                  id="eq-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Opens</Label>
                  <Input
                    type="datetime-local"
                    value={opensLocal}
                    onChange={(e) => setOpensLocal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closes</Label>
                  <Input
                    type="datetime-local"
                    value={closesLocal}
                    onChange={(e) => setClosesLocal(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="eq-tl"
                  checked={useTimeLimit}
                  onCheckedChange={(c) => setUseTimeLimit(c === true)}
                />
                <Label htmlFor="eq-tl" className="font-normal cursor-pointer">
                  Per-attempt time limit
                </Label>
              </div>
              {useTimeLimit && (
                <div className="space-y-2 pl-6">
                  <Label>Minutes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    className="w-32"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 1)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Extra submit time after close (minutes)</Label>
                <p className="text-xs text-muted-foreground">
                  Students who already started may submit this many minutes after the scheduled close.
                  Use 0 for no grace.
                </p>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  className="w-32"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Math.max(0, Number(e.target.value) || 0))}
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
              <Button onClick={saveMeta} disabled={savingMeta}>
                {savingMeta ? "Saving…" : "Save details"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reference handout (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a PDF or Word file. If your school has Word-to-PDF conversion enabled, Word
                uploads become PDFs so students can read them in the quiz page; otherwise Word files
                are stored as downloads. PDFs always show inline beside the questions. Add MCQs that
                refer to the handout.
              </p>
              <input
                ref={handoutFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                aria-label="Upload quiz handout file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadHandout(f);
                }}
              />
              {quiz.handoutFileName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[min(100%,16rem)]">
                    {quiz.handoutFileName}
                  </span>
                  {handoutPreviewUrl && (
                    <Button variant="link" className="h-auto p-0 text-sm" asChild>
                      <a href={handoutPreviewUrl} target="_blank" rel="noopener noreferrer">
                        Preview
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={handoutClearing || handoutUploading}
                    onClick={() => void removeHandout()}
                  >
                    {handoutClearing ? "Removing…" : "Remove"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={handoutUploading || handoutClearing}
                    onClick={() => handoutFileInputRef.current?.click()}
                  >
                    {handoutUploading ? "Uploading…" : "Replace"}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={handoutUploading}
                  onClick={() => handoutFileInputRef.current?.click()}
                >
                  {handoutUploading ? "Uploading…" : "Upload PDF or Word"}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Questions (4 options each)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuestions((q) => [...q, emptyQ()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-8">
              {questions.map((q, qi) => (
                <div key={qi} className="border rounded-lg p-4 space-y-3 relative">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Q{qi + 1}</span>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-destructive"
                        onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      value={q.question}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((row, i) =>
                            i === qi ? { ...row, question: e.target.value } : row,
                          ),
                        )
                      }
                      rows={2}
                    />
                  </div>
                  {(["A", "B", "C", "D"] as const).map((letter, oi) => (
                    <div key={oi} className="space-y-1">
                      <Label className="text-xs">Option {letter}</Label>
                      <Input
                        value={q.options[oi]}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((row, i) => {
                              if (i !== qi) return row;
                              const next = [...row.options] as [string, string, string, string];
                              next[oi] = e.target.value;
                              return { ...row, options: next };
                            }),
                          )
                        }
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Correct</Label>
                      <Select
                        value={String(q.correctIndex)}
                        onValueChange={(v) =>
                          setQuestions((prev) =>
                            prev.map((row, i) =>
                              i === qi ? { ...row, correctIndex: Number(v) } : row,
                            ),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">A</SelectItem>
                          <SelectItem value="1">B</SelectItem>
                          <SelectItem value="2">C</SelectItem>
                          <SelectItem value="3">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((row, i) =>
                              i === qi
                                ? { ...row, points: Math.max(1, Number(e.target.value) || 1) }
                                : row,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveQuestions} disabled={savingQs}>
                  {savingQs ? "Saving…" : "Save questions"}
                </Button>
                <Button variant="default" onClick={() => setShowPublish(true)}>
                  Publish quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={showPublish} onOpenChange={setShowPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current questions will be saved, then students in {quiz.className} will be notified.
              They can take the quiz during the open window.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doPublish} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetStudentId} onOpenChange={() => setResetStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this student&apos;s attempt?</AlertDialogTitle>
            <AlertDialogDescription>
              Their progress and score will be removed. They can start the quiz again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doResetStudent} className="bg-destructive text-destructive-foreground">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
