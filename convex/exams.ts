import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin and return their schoolId
async function getVerifiedSchoolId(ctx: MutationCtx, adminId: string): Promise<string> {
  const admin = await ctx.db.get(adminId as Id<'schoolAdmins'>);
  if (!admin) {
    throw new Error('Unauthorized: Admin not found');
  }
  return admin.schoolId;
}

// Helper function to generate exam code
function generateExamCode(): string {
  const digits: string = Math.random().toString().slice(2, 10);
  return `EXM${digits}`;
}

// Create Exam
export const createExam = mutation({
  args: {
    schoolId: v.string(),
    examName: v.string(),
    examType: v.union(
      v.literal('mid_term'),
      v.literal('end_of_term'),
      v.literal('mock'),
      v.literal('quiz'),
      v.literal('assessment'),
      v.literal('final')
    ),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    department: v.optional(
      v.union(
        v.literal('creche'),
        v.literal('kindergarten'),
        v.literal('primary'),
        v.literal('junior_high')
      )
    ),
    targetClasses: v.optional(v.array(v.string())),
    subjects: v.string(), // JSON string
    totalMarks: v.number(),
    weightage: v.number(),
    instructions: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'exams'>> => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const examCode: string = generateExamCode();
    const now: string = new Date().toISOString();

    const examId: Id<'exams'> = await ctx.db.insert('exams', {
      schoolId: args.schoolId,
      examCode,
      examName: args.examName,
      examType: args.examType,
      academicYearId: args.academicYearId,
      termId: args.termId,
      startDate: args.startDate,
      endDate: args.endDate,
      department: args.department,
      targetClasses: args.targetClasses,
      subjects: args.subjects,
      totalMarks: args.totalMarks,
      weightage: args.weightage,
      instructions: args.instructions,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return examId;
  },
});

// Get all exams for a school
export const getExamsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const exams = await ctx.db
      .query('exams')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return exams;
  },
});

// Get exam by ID
export const getExamById = query({
  args: { examId: v.id('exams') },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    return exam;
  },
});

// Update exam (with status validation)
export const updateExam = mutation({
  args: {
    examId: v.id('exams'),
    examName: v.optional(v.string()),
    examType: v.optional(
      v.union(
        v.literal('mid_term'),
        v.literal('end_of_term'),
        v.literal('mock'),
        v.literal('quiz'),
        v.literal('assessment'),
        v.literal('final')
      )
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    subjects: v.optional(v.string()),
    totalMarks: v.optional(v.number()),
    weightage: v.optional(v.number()),
    instructions: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('scheduled'),
        v.literal('ongoing'),
        v.literal('completed'),
        v.literal('published')
      )
    ),
    adminOverride: v.optional(v.boolean()), // Allow admin to override lock
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { examId, adminOverride, updatedBy, ...updates } = args;
    const now: string = new Date().toISOString();

    // Check current exam status
    const exam = await ctx.db.get(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, updatedBy);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Block editing published exams unless unlocked or admin override
    if (exam.status === 'published' && !exam.unlocked && !adminOverride) {
      throw new Error('Cannot edit published exam. Please unlock it first to make corrections.');
    }

    await ctx.db.patch(examId, {
      ...updates,
      updatedAt: now,
    });

    return examId;
  },
});

// Delete exam
export const deleteExam = mutation({
  args: {
    examId: v.id('exams'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error('Exam not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Delete associated marks first
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .collect();

    for (const mark of marks) {
      await ctx.db.delete(mark._id);
    }

    // Delete exam
    await ctx.db.delete(args.examId);
    return { success: true };
  },
});

// Publish exam
export const publishExam = mutation({
  args: {
    examId: v.id('exams'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error('Exam not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now: string = new Date().toISOString();

    await ctx.db.patch(args.examId, {
      status: 'published',
      updatedAt: now,
    });

    return { success: true };
  },
});

// Unlock exam for corrections
export const unlockExam = mutation({
  args: {
    examId: v.id('exams'),
    adminId: v.string(),
    adminName: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();
    const exam = await ctx.db.get(args.examId);

    if (!exam) {
      throw new Error('Exam not found');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.adminId);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Only allow unlocking completed or published exams
    if (exam.status !== 'completed' && exam.status !== 'published') {
      throw new Error('Only completed or published exams can be unlocked');
    }

    await ctx.db.patch(args.examId, {
      unlocked: true,
      unlockedBy: args.adminId,
      unlockedByName: args.adminName,
      unlockedAt: now,
      unlockReason: args.reason,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.adminId,
      userName: args.adminName,
      action: 'unlock_exam',
      entity: 'exams',
      entityId: args.examId,
      details: `Unlocked exam "${exam.examName}" for corrections. Reason: ${args.reason}`,
      ipAddress: '0.0.0.0', // Will be updated from client if needed
    });

    return { success: true };
  },
});

// Lock exam after corrections
export const lockExam = mutation({
  args: {
    examId: v.id('exams'),
    adminId: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();
    const exam = await ctx.db.get(args.examId);

    if (!exam) {
      throw new Error('Exam not found');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.adminId);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.patch(args.examId, {
      unlocked: false,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.adminId,
      userName: args.adminName,
      action: 'lock_exam',
      entity: 'exams',
      entityId: args.examId,
      details: `Locked exam "${exam.examName}" after corrections`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
