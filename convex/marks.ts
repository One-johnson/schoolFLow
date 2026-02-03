import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Helper function to calculate grade
function calculateGrade(percentage: number): {
  grade: string;
  gradeNumber: number;
  remarks: string;
} {
  if (percentage >= 80)
    return { grade: "1", gradeNumber: 1, remarks: "Excellent" };
  if (percentage >= 70)
    return { grade: "2", gradeNumber: 2, remarks: "Very Good" };
  if (percentage >= 65) return { grade: "3", gradeNumber: 3, remarks: "Good" };
  if (percentage >= 60)
    return { grade: "4", gradeNumber: 4, remarks: "High Average" };
  if (percentage >= 55)
    return { grade: "5", gradeNumber: 5, remarks: "Average" };
  if (percentage >= 50)
    return { grade: "6", gradeNumber: 6, remarks: "Low Average" };
  if (percentage >= 45) return { grade: "7", gradeNumber: 7, remarks: "Pass" };
  if (percentage >= 40) return { grade: "8", gradeNumber: 8, remarks: "Pass" };
  return { grade: "9", gradeNumber: 9, remarks: "Fail" };
}

// Enter marks for a student
export const enterMarks = mutation({
  args: {
    schoolId: v.string(),
    examId: v.id("exams"),
    examCode: v.string(),
    examName: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    classId: v.string(),
    className: v.string(),
    subjectId: v.string(),
    subjectName: v.string(),
    classScore: v.number(),
    examScore: v.number(),
    maxMarks: v.number(),
    isAbsent: v.boolean(),
    enteredBy: v.string(),
    enteredByRole: v.union(
      v.literal("subject_teacher"),
      v.literal("class_teacher"),
      v.literal("admin"),
    ),
    enteredByName: v.string(),
    entryReason: v.optional(v.string()),
    adminOverride: v.optional(v.boolean()), // Allow admin to override lock
  },
  handler: async (ctx, args): Promise<Id<"studentMarks">> => {
    const now: string = new Date().toISOString();

    // Check exam status and lock state
    const exam = await ctx.db.get(args.examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    // Phase 1 & 3 Restrictions:
    // - Teachers blocked from editing completed/published exams
    // - Admins can edit completed exams (with warning in UI)
    // - Published exams require unlock first (unless admin override)

    const isTeacher =
      args.enteredByRole === "subject_teacher" ||
      args.enteredByRole === "class_teacher";
    const isAdmin = args.enteredByRole === "admin";

    if (
      isTeacher &&
      (exam.status === "completed" || exam.status === "published")
    ) {
      throw new Error(
        "Teachers cannot edit marks for completed or published exams. Please contact an administrator.",
      );
    }

    // Block editing for any locked exam (completed or published)
    if (
      (exam.status === "completed" || exam.status === "published") &&
      !exam.unlocked &&
      !args.adminOverride
    ) {
      throw new Error(
        `Cannot edit marks for ${exam.status} exam. Please unlock the exam first to make corrections.`,
      );
    }

    // Log admin edits to locked exams for audit trail
    if (
      isAdmin &&
      (exam.status === "completed" || exam.status === "published")
    ) {
      await ctx.db.insert("auditLogs", {
        timestamp: now,
        userId: args.enteredBy,
        userName: args.enteredByName,
        action: exam.unlocked
          ? "edit_marks_unlocked_exam"
          : "edit_marks_completed_exam",
        entity: "studentMarks",
        entityId: args.studentId,
        details: `Admin edited marks for ${args.studentName} in ${args.subjectName} (${exam.examName}). Reason: ${args.entryReason || "Not provided"}`,
        ipAddress: "0.0.0.0",
      });
    }

    // Calculate total score and percentage
    const totalScore: number = args.classScore + args.examScore;
    const percentage: number = (totalScore / args.maxMarks) * 100;

    // Calculate grade
    const gradeInfo = calculateGrade(percentage);

    // Check if mark already exists
    const existing = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) =>
        q.and(
          q.eq(q.field("studentId"), args.studentId),
          q.eq(q.field("subjectId"), args.subjectId),
        ),
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        classScore: args.classScore,
        examScore: args.examScore,
        totalScore,
        percentage,
        grade: gradeInfo.grade,
        gradeNumber: gradeInfo.gradeNumber,
        remarks: gradeInfo.remarks,
        isAbsent: args.isAbsent,
        enteredBy: args.enteredBy,
        enteredByRole: args.enteredByRole,
        enteredByName: args.enteredByName,
        entryReason: args.entryReason,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // Create new
      const markId: Id<"studentMarks"> = await ctx.db.insert("studentMarks", {
        schoolId: args.schoolId,
        examId: args.examId,
        examCode: args.examCode,
        examName: args.examName,
        studentId: args.studentId,
        studentName: args.studentName,
        classId: args.classId,
        className: args.className,
        subjectId: args.subjectId,
        subjectName: args.subjectName,
        classScore: args.classScore,
        examScore: args.examScore,
        totalScore,
        maxMarks: args.maxMarks,
        percentage,
        grade: gradeInfo.grade,
        gradeNumber: gradeInfo.gradeNumber,
        remarks: gradeInfo.remarks,
        isAbsent: args.isAbsent,
        enteredBy: args.enteredBy,
        enteredByRole: args.enteredByRole,
        enteredByName: args.enteredByName,
        verifiedBy: undefined,
        verifiedAt: undefined,
        submissionStatus: "draft",
        entryReason: args.entryReason,
        createdAt: now,
        updatedAt: now,
      });

      return markId;
    }
  },
});

// Get marks for an exam
export const getExamMarks = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    return marks;
  },
});

// Get marks for a student in an exam
export const getStudentExamMarks = query({
  args: {
    schoolId: v.string(),
    examId: v.id("exams"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .collect();

    return marks;
  },
});

// Get marks for a class and subject
export const getClassSubjectMarks = query({
  args: {
    examId: v.id("exams"),
    classId: v.string(),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) =>
        q.and(
          q.eq(q.field("classId"), args.classId),
          q.eq(q.field("subjectId"), args.subjectId),
        ),
      )
      .collect();

    return marks;
  },
});

// Submit marks to class teacher
export const submitMarksToClassTeacher = mutation({
  args: {
    markIds: v.array(v.id("studentMarks")),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    for (const markId of args.markIds) {
      await ctx.db.patch(markId, {
        submissionStatus: "submitted_to_class_teacher",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Verify marks (class teacher or admin)
export const verifyMarks = mutation({
  args: {
    markIds: v.array(v.id("studentMarks")),
    verifiedBy: v.string(),
    role: v.union(v.literal("class_teacher"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    for (const markId of args.markIds) {
      const status: "verified_by_class_teacher" | "verified_by_admin" =
        args.role === "class_teacher"
          ? "verified_by_class_teacher"
          : "verified_by_admin";

      await ctx.db.patch(markId, {
        verifiedBy: args.verifiedBy,
        verifiedAt: now,
        submissionStatus: status,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get marks for a class in an exam (all subjects)
export const getClassMarks = query({
  args: {
    examId: v.id("exams"),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) => q.eq(q.field("classId"), args.classId))
      .collect();

    return marks;
  },
});

// Get marks statistics for an exam
export const getExamMarksStats = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    // Group by class and count unique students
    const byClass: Record<string, Set<string>> = {};
    marks.forEach((mark) => {
      if (!byClass[mark.classId]) {
        byClass[mark.classId] = new Set();
      }
      byClass[mark.classId].add(mark.studentId);
    });

    const classStats = Object.entries(byClass).map(([classId, studentIds]) => ({
      classId,
      studentCount: studentIds.size,
      className: marks.find((m) => m.classId === classId)?.className || classId,
    }));

    return {
      totalMarksEntries: marks.length,
      uniqueStudents: new Set(marks.map((m) => m.studentId)).size,
      classesCovered: classStats,
    };
  },
});

// Calculate positions for a subject
export const calculatePositions = mutation({
  args: {
    examId: v.id("exams"),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_subject", (q) =>
        q.eq("examId", args.examId).eq("subjectId", args.subjectId),
      )
      .filter((q) => q.eq(q.field("isAbsent"), false))
      .collect();

    // Sort by total score descending
    const sorted = marks.sort((a, b) => b.totalScore - a.totalScore);

    // Assign positions
    const now: string = new Date().toISOString();
    for (let i: number = 0; i < sorted.length; i++) {
      await ctx.db.patch(sorted[i]._id, {
        position: i + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Delete a mark entry
export const deleteMark = mutation({
  args: {
    markId: v.id("studentMarks"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Check if mark exists
    const mark = await ctx.db.get(args.markId);

    if (!mark) {
      throw new Error("Mark not found");
    }

    // Delete the mark
    await ctx.db.delete(args.markId);

    return { success: true };
  },
});

// Get marks for a class in an exam (for teacher portal)
export const getMarksByClassAndExam = query({
  args: {
    examId: v.id("exams"),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .filter((q) => q.eq(q.field("classId"), args.classId))
      .collect();
    return marks;
  },
});

// Get all marks for a student (for grade book)
export const getStudentAllMarks = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_student", (q) =>
        q.eq("schoolId", args.schoolId).eq("studentId", args.studentId),
      )
      .collect();

    return marks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
});

// Get class grade summary (for grade book overview)
export const getClassGradeSummary = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    examId: v.optional(v.id("exams")),
  },
  handler: async (ctx, args) => {
    let marks;

    if (args.examId) {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .filter((q) => q.eq(q.field("classId"), args.classId))
        .collect();
    } else {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_class", (q) =>
          q.eq("schoolId", args.schoolId).eq("classId", args.classId),
        )
        .collect();
    }

    // Group by student
    const studentMarks: Record<
      string,
      {
        studentId: string;
        studentName: string;
        marks: typeof marks;
        totalScore: number;
        maxScore: number;
        average: number;
        subjectCount: number;
      }
    > = {};

    marks.forEach((mark) => {
      if (!studentMarks[mark.studentId]) {
        studentMarks[mark.studentId] = {
          studentId: mark.studentId,
          studentName: mark.studentName,
          marks: [],
          totalScore: 0,
          maxScore: 0,
          average: 0,
          subjectCount: 0,
        };
      }
      studentMarks[mark.studentId].marks.push(mark);
      studentMarks[mark.studentId].totalScore += mark.totalScore;
      studentMarks[mark.studentId].maxScore += mark.maxMarks;
      studentMarks[mark.studentId].subjectCount += 1;
    });

    // Calculate averages
    Object.values(studentMarks).forEach((student) => {
      if (student.maxScore > 0) {
        student.average = (student.totalScore / student.maxScore) * 100;
      }
    });

    // Sort by average descending
    const sorted = Object.values(studentMarks).sort(
      (a, b) => b.average - a.average,
    );

    // Assign positions
    sorted.forEach((student, index) => {
      (student as typeof student & { position: number }).position = index + 1;
    });

    return sorted;
  },
});

// Get student performance trends
export const getStudentPerformanceTrends = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("studentMarks")
      .withIndex("by_student", (q) =>
        q.eq("schoolId", args.schoolId).eq("studentId", args.studentId),
      )
      .collect();

    // Group by exam
    const examGroups: Record<
      string,
      {
        examId: string;
        examName: string;
        examCode: string;
        subjects: typeof marks;
        totalScore: number;
        maxScore: number;
        average: number;
        date: string;
      }
    > = {};

    marks.forEach((mark) => {
      const examKey = mark.examId;
      if (!examGroups[examKey]) {
        examGroups[examKey] = {
          examId: examKey,
          examName: mark.examName,
          examCode: mark.examCode,
          subjects: [],
          totalScore: 0,
          maxScore: 0,
          average: 0,
          date: mark.createdAt,
        };
      }
      examGroups[examKey].subjects.push(mark);
      examGroups[examKey].totalScore += mark.totalScore;
      examGroups[examKey].maxScore += mark.maxMarks;
    });

    // Calculate averages
    Object.values(examGroups).forEach((group) => {
      if (group.maxScore > 0) {
        group.average = (group.totalScore / group.maxScore) * 100;
      }
    });

    // Sort by date
    return Object.values(examGroups).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  },
});

// Get class performance distribution
export const getClassPerformanceDistribution = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    examId: v.optional(v.id("exams")),
  },
  handler: async (ctx, args) => {
    let marks;

    if (args.examId) {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .filter((q) => q.eq(q.field("classId"), args.classId))
        .collect();
    } else {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_class", (q) =>
          q.eq("schoolId", args.schoolId).eq("classId", args.classId),
        )
        .collect();
    }

    // Calculate student averages
    const studentAverages: Record<string, number[]> = {};
    marks.forEach((mark) => {
      if (!studentAverages[mark.studentId]) {
        studentAverages[mark.studentId] = [];
      }
      studentAverages[mark.studentId].push(mark.percentage);
    });

    const averages = Object.values(studentAverages).map(
      (percentages) =>
        percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
    );

    // Create distribution buckets
    const distribution = {
      excellent: averages.filter((a) => a >= 80).length, // 80-100
      veryGood: averages.filter((a) => a >= 70 && a < 80).length, // 70-79
      good: averages.filter((a) => a >= 60 && a < 70).length, // 60-69
      average: averages.filter((a) => a >= 50 && a < 60).length, // 50-59
      belowAverage: averages.filter((a) => a >= 40 && a < 50).length, // 40-49
      poor: averages.filter((a) => a < 40).length, // Below 40
    };

    return {
      distribution,
      totalStudents: Object.keys(studentAverages).length,
      classAverage:
        averages.length > 0
          ? averages.reduce((sum, a) => sum + a, 0) / averages.length
          : 0,
      highestScore: averages.length > 0 ? Math.max(...averages) : 0,
      lowestScore: averages.length > 0 ? Math.min(...averages) : 0,
    };
  },
});

// Get subject performance comparison
export const getSubjectPerformance = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    examId: v.optional(v.id("exams")),
  },
  handler: async (ctx, args) => {
    let marks;

    if (args.examId) {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_exam", (q) => q.eq("examId", args.examId!))
        .filter((q) => q.eq(q.field("classId"), args.classId))
        .collect();
    } else {
      marks = await ctx.db
        .query("studentMarks")
        .withIndex("by_class", (q) =>
          q.eq("schoolId", args.schoolId).eq("classId", args.classId),
        )
        .collect();
    }

    // Group by subject
    const subjectGroups: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        totalScore: number;
        maxScore: number;
        studentCount: number;
        average: number;
        highest: number;
        lowest: number;
        passRate: number;
      }
    > = {};

    marks.forEach((mark) => {
      if (!subjectGroups[mark.subjectId]) {
        subjectGroups[mark.subjectId] = {
          subjectId: mark.subjectId,
          subjectName: mark.subjectName,
          totalScore: 0,
          maxScore: 0,
          studentCount: 0,
          average: 0,
          highest: 0,
          lowest: 100,
          passRate: 0,
        };
      }
      const group = subjectGroups[mark.subjectId];
      group.totalScore += mark.totalScore;
      group.maxScore += mark.maxMarks;
      group.studentCount += 1;
      group.highest = Math.max(group.highest, mark.percentage);
      group.lowest = Math.min(group.lowest, mark.percentage);
    });

    // Calculate averages and pass rates
    const passThreshold = 50;
    Object.values(subjectGroups).forEach((group) => {
      if (group.maxScore > 0) {
        group.average = (group.totalScore / group.maxScore) * 100;
      }
      const subjectMarks = marks.filter((m) => m.subjectId === group.subjectId);
      const passCount = subjectMarks.filter(
        (m) => m.percentage >= passThreshold,
      ).length;
      group.passRate =
        subjectMarks.length > 0 ? (passCount / subjectMarks.length) * 100 : 0;
    });

    return Object.values(subjectGroups).sort((a, b) => b.average - a.average);
  },
});

// Quick enter marks for multiple students
export const quickEnterMarks = mutation({
  args: {
    schoolId: v.string(),
    examId: v.id("exams"),
    examCode: v.string(),
    examName: v.string(),
    classId: v.string(),
    className: v.string(),
    subjectId: v.string(),
    subjectName: v.string(),
    maxMarks: v.number(),
    enteredBy: v.string(),
    enteredByRole: v.union(
      v.literal("subject_teacher"),
      v.literal("class_teacher"),
      v.literal("admin"),
    ),
    enteredByName: v.string(),
    marks: v.array(
      v.object({
        studentId: v.string(),
        studentName: v.string(),
        classScore: v.number(),
        examScore: v.number(),
        isAbsent: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const results: { studentId: string; success: boolean; error?: string }[] =
      [];

    for (const markData of args.marks) {
      try {
        const totalScore = markData.classScore + markData.examScore;
        const percentage = (totalScore / args.maxMarks) * 100;
        const gradeInfo = calculateGrade(percentage);

        // Check if mark already exists
        const existing = await ctx.db
          .query("studentMarks")
          .withIndex("by_exam", (q) => q.eq("examId", args.examId))
          .filter((q) =>
            q.and(
              q.eq(q.field("studentId"), markData.studentId),
              q.eq(q.field("subjectId"), args.subjectId),
            ),
          )
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            classScore: markData.classScore,
            examScore: markData.examScore,
            totalScore,
            percentage,
            grade: gradeInfo.grade,
            gradeNumber: gradeInfo.gradeNumber,
            remarks: gradeInfo.remarks,
            isAbsent: markData.isAbsent,
            enteredBy: args.enteredBy,
            enteredByRole: args.enteredByRole,
            enteredByName: args.enteredByName,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("studentMarks", {
            schoolId: args.schoolId,
            examId: args.examId,
            examCode: args.examCode,
            examName: args.examName,
            studentId: markData.studentId,
            studentName: markData.studentName,
            classId: args.classId,
            className: args.className,
            subjectId: args.subjectId,
            subjectName: args.subjectName,
            classScore: markData.classScore,
            examScore: markData.examScore,
            totalScore,
            maxMarks: args.maxMarks,
            percentage,
            grade: gradeInfo.grade,
            gradeNumber: gradeInfo.gradeNumber,
            remarks: gradeInfo.remarks,
            isAbsent: markData.isAbsent,
            enteredBy: args.enteredBy,
            enteredByRole: args.enteredByRole,
            enteredByName: args.enteredByName,
            submissionStatus: "draft",
            createdAt: now,
            updatedAt: now,
          });
        }

        results.push({ studentId: markData.studentId, success: true });
      } catch (error) {
        results.push({
          studentId: markData.studentId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: args.marks.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});
