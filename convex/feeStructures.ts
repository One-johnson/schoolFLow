import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate unique structure code
function generateStructureCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `FS${digits}`;
}

// Create fee structure
export const createFeeStructure = mutation({
  args: {
    schoolId: v.string(),
    structureName: v.string(),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    classId: v.optional(v.string()),
    department: v.optional(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    )),
    fees: v.string(), // JSON stringified array
    totalAmount: v.number(),
    dueDate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const structureCode = generateStructureCode();
    const now = new Date().toISOString();

    const structureId = await ctx.db.insert('feeStructures', {
      schoolId: args.schoolId,
      structureCode,
      structureName: args.structureName,
      academicYearId: args.academicYearId,
      termId: args.termId,
      classId: args.classId,
      department: args.department,
      fees: args.fees,
      totalAmount: args.totalAmount,
      dueDate: args.dueDate,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return structureId;
  },
});

// Get all fee structures for a school
export const getStructuresBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const structures = await ctx.db
      .query('feeStructures')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return structures;
  },
});

// Get active fee structures for a school
export const getActiveStructuresBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const structures = await ctx.db
      .query('feeStructures')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .collect();

    return structures;
  },
});

// Get fee structure by class
export const getStructureByClass = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const structure = await ctx.db
      .query('feeStructures')
      .withIndex('by_class', (q) => 
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      )
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first();

    return structure;
  },
});

// Update fee structure
export const updateFeeStructure = mutation({
  args: {
    structureId: v.id('feeStructures'),
    structureName: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    classId: v.optional(v.string()),
    department: v.optional(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    )),
    fees: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    const { structureId, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(structureId, {
      ...updates,
      updatedAt: now,
    });

    return structureId;
  },
});

// Delete fee structure
export const deleteFeeStructure = mutation({
  args: { structureId: v.id('feeStructures') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.structureId);
  },
});
