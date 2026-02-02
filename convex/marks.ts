import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Helper function to calculate grade
function calculateGrade(percentage: number): { grade: string; gradeNumber: number; remarks: string } {
  if (percentage >= 80) return { grade: '1', gradeNumber: 1, remarks: 'Excellent' };
  if (percentage >= 70) return { grade: '2', gradeNumber: 2, remarks: 'Very Good' };
  if (percentage >= 65) return { grade: '3', gradeNumber: 3, remarks: 'Good' };
  if (percentage >= 60) return { grade: '4', gradeNumber: 4, remarks: 'High Average' };
  if (percentage >= 55) return { grade: '5', gradeNumber: 5, remarks: 'Average' };
  if (percentage >= 50) return { grade: '6', gradeNumber: 6, remarks: 'Low Average' };
  if (percentage >= 45) return { grade: '7', gradeNumber: 7, remarks: 'Pass' };
  if (percentage >= 40) return { grade: '8', gradeNumber: 8, remarks: 'Pass' };
  return { grade: '9', gradeNumber: 9, remarks: 'Fail' };
}

// Enter marks for a student
export const enterMarks = mutation({
  args: {
    schoolId: v.string(),
    examId: v.id('exams'),
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
      v.literal('subject_teacher'),
      v.literal('class_teacher'),
      v.literal('admin')
    ),
    enteredByName: v.string(),
    entryReason: v.optional(v.string()),
    adminOverride: v.optional(v.boolean()), // Allow admin to override lock
  },
  handler: async (ctx, args): Promise<Id<'studentMarks'>> => {
    const now: string = new Date().toISOString();

    // Check exam status and lock state
    const exam = await ctx.db.get(args.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Phase 1 & 3 Restrictions:
    // - Teachers blocked from editing completed/published exams
    // - Admins can edit completed exams (with warning in UI)
    // - Published exams require unlock first (unless admin override)
    
    const isTeacher = args.enteredByRole === 'subject_teacher' || args.enteredByRole === 'class_teacher';
    const isAdmin = args.enteredByRole === 'admin';

    if (isTeacher && (exam.status === 'completed' || exam.status === 'published')) {
      throw new Error('Teachers cannot edit marks for completed or published exams. Please contact an administrator.');
    }

    // Block editing for any locked exam (completed or published)
    if ((exam.status === 'completed' || exam.status === 'published') && !exam.unlocked && !args.adminOverride) {
      throw new Error(`Cannot edit marks for ${exam.status} exam. Please unlock the exam first to make corrections.`);
    }

    // Log admin edits to locked exams for audit trail
    if (isAdmin && (exam.status === 'completed' || exam.status === 'published')) {
      await ctx.db.insert('auditLogs', {
        timestamp: now,
        userId: args.enteredBy,
        userName: args.enteredByName,
        action: exam.unlocked ? 'edit_marks_unlocked_exam' : 'edit_marks_completed_exam',
        entity: 'studentMarks',
        entityId: args.studentId,
        details: `Admin edited marks for ${args.studentName} in ${args.subjectName} (${exam.examName}). Reason: ${args.entryReason || 'Not provided'}`,
        ipAddress: '0.0.0.0',
      });
    }

    // Calculate total score and percentage
    const totalScore: number = args.classScore + args.examScore;
    const percentage: number = (totalScore / args.maxMarks) * 100;

    // Calculate grade
    const gradeInfo = calculateGrade(percentage);

    // Check if mark already exists
    const existing = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) =>
        q.and(
          q.eq(q.field('studentId'), args.studentId),
          q.eq(q.field('subjectId'), args.subjectId)
        )
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
      const markId: Id<'studentMarks'> = await ctx.db.insert('studentMarks', {
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
        submissionStatus: 'draft',
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
  args: { examId: v.id('exams') },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .collect();

    return marks;
  },
});

// Get marks for a student in an exam
export const getStudentExamMarks = query({
  args: {
    schoolId: v.string(),
    examId: v.id('exams'),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) => q.eq(q.field('studentId'), args.studentId))
      .collect();

    return marks;
  },
});

// Get marks for a class and subject
export const getClassSubjectMarks = query({
  args: {
    examId: v.id('exams'),
    classId: v.string(),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) =>
        q.and(
          q.eq(q.field('classId'), args.classId),
          q.eq(q.field('subjectId'), args.subjectId)
        )
      )
      .collect();

    return marks;
  },
});

// Submit marks to class teacher
export const submitMarksToClassTeacher = mutation({
  args: {
    markIds: v.array(v.id('studentMarks')),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    for (const markId of args.markIds) {
      await ctx.db.patch(markId, {
        submissionStatus: 'submitted_to_class_teacher',
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Verify marks (class teacher or admin)
export const verifyMarks = mutation({
  args: {
    markIds: v.array(v.id('studentMarks')),
    verifiedBy: v.string(),
    role: v.union(v.literal('class_teacher'), v.literal('admin')),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    for (const markId of args.markIds) {
      const status: 'verified_by_class_teacher' | 'verified_by_admin' =
        args.role === 'class_teacher'
          ? 'verified_by_class_teacher'
          : 'verified_by_admin';

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
    examId: v.id('exams'),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) => q.eq(q.field('classId'), args.classId))
      .collect();

    return marks;
  },
});

// Get marks statistics for an exam
export const getExamMarksStats = query({
  args: { examId: v.id('exams') },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
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
    examId: v.id('exams'),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_subject', (q) =>
        q.eq('examId', args.examId).eq('subjectId', args.subjectId)
      )
      .filter((q) => q.eq(q.field('isAbsent'), false))
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
    markId: v.id('studentMarks'),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Check if mark exists
    const mark = await ctx.db.get(args.markId);
    
    if (!mark) {
      throw new Error('Mark not found');
    }

    // Delete the mark
    await ctx.db.delete(args.markId);

    return { success: true };
  },
});

// Get marks for a class in an exam (for teacher portal)
export const getMarksByClassAndExam = query({
  args: {
    examId: v.id('exams'),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) => q.eq(q.field('classId'), args.classId))
      .collect();
    return marks;
  },
});
