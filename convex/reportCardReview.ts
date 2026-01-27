import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Get draft report cards for review
export const getDraftReportCards = query({
  args: {
    schoolId: v.string(),
    classId: v.optional(v.string()),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('reportCards')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'draft'));

    if (args.classId) {
      query = query.filter((q) => q.eq(q.field('classId'), args.classId));
    }

    if (args.termId) {
      query = query.filter((q) => q.eq(q.field('termId'), args.termId));
    }

    const reports = await query.order('desc').collect();
    return reports;
  },
});

// Update report card with review data
export const reviewReportCard = mutation({
  args: {
    reportCardId: v.id('reportCards'),
    attendance: v.optional(v.string()), // JSON: {present: X, total: Y}
    conduct: v.optional(v.string()),
    attitude: v.optional(v.string()),
    interest: v.optional(v.string()),
    classTeacherComment: v.optional(v.string()),
    headmasterComment: v.optional(v.string()),
    reviewedBy: v.string(),
    reviewedByName: v.string(),
    verifyAndApprove: v.boolean(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    const updates: Record<string, unknown> = {
      attendance: args.attendance,
      conduct: args.conduct,
      attitude: args.attitude,
      interest: args.interest,
      classTeacherComment: args.classTeacherComment,
      headmasterComment: args.headmasterComment,
      reviewedBy: args.reviewedBy,
      reviewedByName: args.reviewedByName,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
      updatedAt: now,
    };

    if (args.verifyAndApprove) {
      updates.status = 'generated';
      updates.verifiedByClassTeacher = true;
    }

    await ctx.db.patch(args.reportCardId, updates);

    return { success: true };
  },
});

// Bulk approve report cards
export const bulkApproveReportCards = mutation({
  args: {
    reportCardIds: v.array(v.id('reportCards')),
    reviewedBy: v.string(),
    reviewedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const now: string = new Date().toISOString();

    for (const reportCardId of args.reportCardIds) {
      await ctx.db.patch(reportCardId, {
        status: 'generated',
        verifiedByClassTeacher: true,
        reviewedBy: args.reviewedBy,
        reviewedByName: args.reviewedByName,
        reviewedAt: now,
        updatedAt: now,
      });
    }

    return { success: true, count: args.reportCardIds.length };
  },
});

// Get report cards by status for filtering
export const getReportCardsByStatus = query({
  args: {
    schoolId: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('generated'),
      v.literal('published'),
      v.literal('archived')
    ),
    classId: v.optional(v.string()),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('reportCards')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), args.status));

    if (args.classId) {
      query = query.filter((q) => q.eq(q.field('classId'), args.classId));
    }

    if (args.termId) {
      query = query.filter((q) => q.eq(q.field('termId'), args.termId));
    }

    const reports = await query.order('desc').collect();
    return reports;
  },
});
