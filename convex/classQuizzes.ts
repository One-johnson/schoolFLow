import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const questionInput = v.object({
  question: v.string(),
  options: v.array(v.string()),
  correctIndex: v.number(),
  points: v.optional(v.number()),
});

function parseIsoMs(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

function assertOptions(opts: string[]): void {
  if (opts.length !== 4 || !opts.every((o) => typeof o === "string" && o.trim())) {
    throw new Error("Each question needs exactly 4 non-empty options");
  }
}

async function getStudentClassDocId(
  ctx: QueryCtx | MutationCtx,
  studentId: Id<"students">,
): Promise<{ classDocId: string; classCode: string } | null> {
  const student = await ctx.db.get(studentId);
  if (!student) return null;
  const classDoc = await ctx.db
    .query("classes")
    .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
    .first();
  if (!classDoc || classDoc.schoolId !== student.schoolId) return null;
  return { classDocId: classDoc._id as string, classCode: student.classId };
}

async function notifyClassAboutQuiz(
  ctx: MutationCtx,
  classId: string,
  title: string,
  quizId: Id<"classQuizzes">,
) {
  const classDoc = await ctx.db.get(classId as Id<"classes">);
  if (!classDoc) return;

  const students = await ctx.db
    .query("students")
    .withIndex("by_class", (q) => q.eq("classId", classDoc.classCode))
    .collect();

  const now = new Date().toISOString();
  const actionUrl = `/student/quizzes/${quizId}`;

  for (const student of students) {
    await ctx.db.insert("notifications", {
      title: "Class quiz",
      message: `"${title}" is available. Complete it during the open window.`,
      type: "info",
      timestamp: now,
      read: false,
      recipientId: student._id as string,
      recipientRole: "student",
      actionUrl,
    });
  }
}

export const listForTeacher = query({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
    teacherClassIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("classQuizzes")
      .withIndex("by_teacher", (q) =>
        q.eq("schoolId", args.schoolId).eq("teacherId", args.teacherId),
      )
      .collect();
    return rows
      .filter((q) => args.teacherClassIds.includes(q.classId))
      .sort(
        (a, b) =>
          parseIsoMs(b.updatedAt) - parseIsoMs(a.updatedAt),
      );
  },
});

export const getForTeacher = query({
  args: { quizId: v.id("classQuizzes"), teacherId: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.teacherId !== args.teacherId) return null;
    const questions = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    questions.sort((a, b) => a.order - b.order);
    return { quiz, questions };
  },
});

export const createDraft = mutation({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
    teacherName: v.string(),
    classId: v.string(),
    className: v.string(),
    subjectName: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    opensAt: v.string(),
    closesAt: v.string(),
    timeLimitSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (parseIsoMs(args.opensAt) >= parseIsoMs(args.closesAt)) {
      throw new Error("Opens time must be before closes time");
    }
    if (
      args.timeLimitSeconds !== undefined &&
      (args.timeLimitSeconds < 60 || args.timeLimitSeconds > 14400)
    ) {
      throw new Error("Time limit must be between 60 seconds and 4 hours");
    }
    const now = new Date().toISOString();
    const id = await ctx.db.insert("classQuizzes", {
      schoolId: args.schoolId,
      teacherId: args.teacherId,
      teacherName: args.teacherName,
      classId: args.classId,
      className: args.className,
      subjectName: args.subjectName,
      title: args.title.trim(),
      description: args.description?.trim(),
      opensAt: args.opensAt,
      closesAt: args.closesAt,
      timeLimitSeconds: args.timeLimitSeconds,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const updateDraft = mutation({
  args: {
    quizId: v.id("classQuizzes"),
    teacherId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    opensAt: v.optional(v.string()),
    closesAt: v.optional(v.string()),
    timeLimitSeconds: v.optional(v.union(v.number(), v.null())),
    subjectName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.teacherId !== args.teacherId) {
      throw new Error("Quiz not found");
    }
    if (quiz.status !== "draft") {
      throw new Error("Only draft quizzes can be edited");
    }
    const opens = args.opensAt ?? quiz.opensAt;
    const closes = args.closesAt ?? quiz.closesAt;
    if (parseIsoMs(opens) >= parseIsoMs(closes)) {
      throw new Error("Opens time must be before closes time");
    }
    let timeLimit = quiz.timeLimitSeconds;
    if (args.timeLimitSeconds !== undefined) {
      timeLimit =
        args.timeLimitSeconds === null ? undefined : args.timeLimitSeconds;
    }
    if (
      timeLimit !== undefined &&
      (timeLimit < 60 || timeLimit > 14400)
    ) {
      throw new Error("Time limit must be between 60 seconds and 4 hours");
    }
    const now = new Date().toISOString();
    await ctx.db.patch(args.quizId, {
      title: args.title?.trim() ?? quiz.title,
      description:
        args.description !== undefined
          ? args.description.trim() || undefined
          : quiz.description,
      opensAt: opens,
      closesAt: closes,
      timeLimitSeconds: timeLimit,
      subjectName:
        args.subjectName !== undefined
          ? args.subjectName || undefined
          : quiz.subjectName,
      updatedAt: now,
    });
  },
});

export const replaceQuestions = mutation({
  args: {
    quizId: v.id("classQuizzes"),
    teacherId: v.string(),
    questions: v.array(questionInput),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.teacherId !== args.teacherId) {
      throw new Error("Quiz not found");
    }
    if (quiz.status !== "draft") {
      throw new Error("Only draft quizzes can have questions replaced");
    }
    if (args.questions.length === 0) {
      throw new Error("Add at least one question");
    }
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      assertOptions(q.options);
      if (q.correctIndex < 0 || q.correctIndex > 3) {
        throw new Error("Correct answer must be option A–D (index 0–3)");
      }
      if (!q.question.trim()) {
        throw new Error("Question text is required");
      }
    }
    const existing = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];
      await ctx.db.insert("classQuizQuestions", {
        quizId: args.quizId,
        schoolId: quiz.schoolId,
        order: i,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
        points: q.points ?? 1,
      });
    }
    await ctx.db.patch(args.quizId, {
      updatedAt: new Date().toISOString(),
    });
  },
});

export const publishQuiz = mutation({
  args: { quizId: v.id("classQuizzes"), teacherId: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.teacherId !== args.teacherId) {
      throw new Error("Quiz not found");
    }
    if (quiz.status !== "draft") {
      throw new Error("Only draft quizzes can be published");
    }
    const questions = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    if (questions.length === 0) {
      throw new Error("Add questions before publishing");
    }
    const now = new Date().toISOString();
    await ctx.db.patch(args.quizId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });
    await notifyClassAboutQuiz(ctx, quiz.classId, quiz.title, args.quizId);
  },
});

export const archiveQuiz = mutation({
  args: { quizId: v.id("classQuizzes"), teacherId: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.teacherId !== args.teacherId) {
      throw new Error("Quiz not found");
    }
    await ctx.db.patch(args.quizId, {
      status: "archived",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const listForStudentPortal = query({
  args: { schoolId: v.string(), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const loc = await getStudentClassDocId(ctx, args.studentId);
    if (!loc) return [];
    const rows = await ctx.db
      .query("classQuizzes")
      .withIndex("by_class", (q) =>
        q.eq("schoolId", args.schoolId).eq("classId", loc.classDocId),
      )
      .collect();
    const published = rows.filter((q) => q.status === "published");
    const now = Date.now();
    const attempts = await Promise.all(
      published.map(async (quiz) => {
        const att = await ctx.db
          .query("classQuizAttempts")
          .withIndex("by_quiz_student", (q) =>
            q.eq("quizId", quiz._id).eq("studentId", args.studentId as string),
          )
          .first();
        return { quizId: quiz._id, attempt: att };
      }),
    );
    const byQuiz = new Map(attempts.map((a) => [a.quizId, a.attempt]));
    return published
      .map((quiz) => {
        const openStart = parseIsoMs(quiz.opensAt);
        const openEnd = parseIsoMs(quiz.closesAt);
        const inWindow = now >= openStart && now <= openEnd;
        const attempt = byQuiz.get(quiz._id);
        return {
          quiz,
          inWindow,
          hasSubmitted: attempt?.status === "submitted",
          inProgress: attempt?.status === "in_progress",
        };
      })
      .sort((a, b) => parseIsoMs(b.quiz.publishedAt ?? b.quiz.createdAt) - parseIsoMs(a.quiz.publishedAt ?? a.quiz.createdAt));
  },
});

export const getTakingSession = query({
  args: {
    schoolId: v.string(),
    studentId: v.id("students"),
    quizId: v.id("classQuizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.schoolId !== args.schoolId || quiz.status !== "published") {
      return null;
    }
    const loc = await getStudentClassDocId(ctx, args.studentId);
    if (!loc || loc.classDocId !== quiz.classId) {
      return null;
    }
    const questionsRaw = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    questionsRaw.sort((a, b) => a.order - b.order);
    const questions = questionsRaw.map((q) => ({
      _id: q._id,
      order: q.order,
      question: q.question,
      options: q.options,
      points: q.points,
    }));
    const attempt = await ctx.db
      .query("classQuizAttempts")
      .withIndex("by_quiz_student", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", args.studentId as string),
      )
      .first();
    const now = Date.now();
    const openStart = parseIsoMs(quiz.opensAt);
    const openEnd = parseIsoMs(quiz.closesAt);
    const inWindow = now >= openStart && now <= openEnd;
    return { quiz, questions, attempt, inWindow };
  },
});

export const startAttempt = mutation({
  args: {
    schoolId: v.string(),
    studentId: v.id("students"),
    studentName: v.string(),
    quizId: v.id("classQuizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.schoolId !== args.schoolId || quiz.status !== "published") {
      throw new Error("Quiz not available");
    }
    const loc = await getStudentClassDocId(ctx, args.studentId);
    if (!loc || loc.classDocId !== quiz.classId) {
      throw new Error("Not in this class");
    }
    const nowMs = Date.now();
    if (
      nowMs < parseIsoMs(quiz.opensAt) ||
      nowMs > parseIsoMs(quiz.closesAt)
    ) {
      throw new Error("This quiz is not open right now");
    }
    const existing = await ctx.db
      .query("classQuizAttempts")
      .withIndex("by_quiz_student", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", args.studentId as string),
      )
      .first();
    if (existing?.status === "submitted") {
      throw new Error("You already submitted this quiz");
    }
    if (existing?.status === "in_progress") {
      if (quiz.timeLimitSeconds) {
        const elapsed =
          (nowMs - parseIsoMs(existing.startedAt)) / 1000;
        if (elapsed > quiz.timeLimitSeconds + 15) {
          throw new Error("Time limit exceeded — contact your teacher if this is wrong");
        }
      }
      return existing._id;
    }
    const now = new Date().toISOString();
    return await ctx.db.insert("classQuizAttempts", {
      quizId: args.quizId,
      schoolId: args.schoolId,
      studentId: args.studentId as string,
      studentName: args.studentName,
      status: "in_progress",
      startedAt: now,
    });
  },
});

const GRACE_SEC = 15;

export const submitAttempt = mutation({
  args: {
    schoolId: v.string(),
    studentId: v.id("students"),
    quizId: v.id("classQuizzes"),
    answers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.schoolId !== args.schoolId || quiz.status !== "published") {
      throw new Error("Quiz not available");
    }
    const loc = await getStudentClassDocId(ctx, args.studentId);
    if (!loc || loc.classDocId !== quiz.classId) {
      throw new Error("Not in this class");
    }
    const nowMs = Date.now();
    if (nowMs > parseIsoMs(quiz.closesAt)) {
      throw new Error("The quiz window has closed");
    }
    const attempt = await ctx.db
      .query("classQuizAttempts")
      .withIndex("by_quiz_student", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", args.studentId as string),
      )
      .first();
    if (!attempt || attempt.status !== "in_progress") {
      throw new Error("No active attempt");
    }
    if (quiz.timeLimitSeconds) {
      const elapsed = (nowMs - parseIsoMs(attempt.startedAt)) / 1000;
      if (elapsed > quiz.timeLimitSeconds + GRACE_SEC) {
        throw new Error("Time limit exceeded");
      }
    }
    const questions = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    questions.sort((a, b) => a.order - b.order);
    if (args.answers.length !== questions.length) {
      throw new Error("Answer every question");
    }
    for (const a of args.answers) {
      if (!Number.isInteger(a) || a < 0 || a > 3) {
        throw new Error("Invalid answer selection");
      }
    }
    let score = 0;
    let maxScore = 0;
    for (let i = 0; i < questions.length; i++) {
      maxScore += questions[i].points;
      if (args.answers[i] === questions[i].correctIndex) {
        score += questions[i].points;
      }
    }
    const percent =
      maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
    const submittedAt = new Date().toISOString();
    await ctx.db.patch(attempt._id, {
      status: "submitted",
      submittedAt,
      answers: args.answers,
      score,
      maxScore,
      percent,
    });
    return { score, maxScore, percent };
  },
});

export const getAttemptResult = query({
  args: {
    schoolId: v.string(),
    studentId: v.id("students"),
    quizId: v.id("classQuizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.schoolId !== args.schoolId) return null;
    const loc = await getStudentClassDocId(ctx, args.studentId);
    if (!loc || loc.classDocId !== quiz.classId) return null;
    const attempt = await ctx.db
      .query("classQuizAttempts")
      .withIndex("by_quiz_student", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", args.studentId as string),
      )
      .first();
    if (!attempt || attempt.status !== "submitted") return null;
    const questions = await ctx.db
      .query("classQuizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    questions.sort((a, b) => a.order - b.order);
    return { quiz, attempt, questions };
  },
});