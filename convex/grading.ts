import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Helper function to generate grading scale code
function generateGradingCode(): string {
  const digits: string = Math.random().toString().slice(2, 8);
  return `GRD${digits}`;
}

// Create default grading scale
export const createDefaultGradingScale = mutation({
  args: {
    schoolId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'gradingScales'>> => {
    const scaleCode: string = generateGradingCode();
    const now: string = new Date().toISOString();

    // Default grading scale matching the report card format
    const grades = [
      { grade: 1, minPercent: 80, maxPercent: 100, remark: 'Excellent' },
      { grade: 2, minPercent: 70, maxPercent: 79, remark: 'Very Good' },
      { grade: 3, minPercent: 65, maxPercent: 69, remark: 'Good' },
      { grade: 4, minPercent: 60, maxPercent: 64, remark: 'High Average' },
      { grade: 5, minPercent: 55, maxPercent: 59, remark: 'Average' },
      { grade: 6, minPercent: 50, maxPercent: 54, remark: 'Low Average' },
      { grade: 7, minPercent: 45, maxPercent: 49, remark: 'Pass' },
      { grade: 8, minPercent: 40, maxPercent: 44, remark: 'Pass' },
      { grade: 9, minPercent: 0, maxPercent: 39, remark: 'Fail' },
    ];

    const scaleId: Id<'gradingScales'> = await ctx.db.insert('gradingScales', {
      schoolId: args.schoolId,
      scaleCode,
      scaleName: 'Default Grading Scale',
      grades: JSON.stringify(grades),
      isDefault: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return scaleId;
  },
});

// Create custom grading scale
export const createGradingScale = mutation({
  args: {
    schoolId: v.string(),
    scaleName: v.string(),
    department: v.optional(
      v.union(
        v.literal('creche'),
        v.literal('kindergarten'),
        v.literal('primary'),
        v.literal('junior_high')
      )
    ),
    grades: v.string(), // JSON string
    isDefault: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'gradingScales'>> => {
    const scaleCode: string = generateGradingCode();
    const now: string = new Date().toISOString();

    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query('gradingScales')
        .withIndex('by_default', (q) =>
          q.eq('schoolId', args.schoolId).eq('isDefault', true)
        )
        .collect();

      for (const scale of existingDefaults) {
        await ctx.db.patch(scale._id, { isDefault: false });
      }
    }

    const scaleId: Id<'gradingScales'> = await ctx.db.insert('gradingScales', {
      schoolId: args.schoolId,
      scaleCode,
      scaleName: args.scaleName,
      department: args.department,
      grades: args.grades,
      isDefault: args.isDefault,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return scaleId;
  },
});

// Get all grading scales for a school
export const getGradingScalesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const scales = await ctx.db
      .query('gradingScales')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return scales;
  },
});

// Get default grading scale
export const getDefaultGradingScale = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const scale = await ctx.db
      .query('gradingScales')
      .withIndex('by_default', (q) =>
        q.eq('schoolId', args.schoolId).eq('isDefault', true)
      )
      .first();

    return scale;
  },
});

// Update grading scale
export const updateGradingScale = mutation({
  args: {
    scaleId: v.id('gradingScales'),
    scaleName: v.optional(v.string()),
    grades: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    const { scaleId, ...updates } = args;
    const now: string = new Date().toISOString();

    // If setting as default, unset others
    if (args.isDefault) {
      const scale = await ctx.db.get(scaleId);
      if (scale) {
        const existingDefaults = await ctx.db
          .query('gradingScales')
          .withIndex('by_default', (q) =>
            q.eq('schoolId', scale.schoolId).eq('isDefault', true)
          )
          .collect();

        for (const existing of existingDefaults) {
          if (existing._id !== scaleId) {
            await ctx.db.patch(existing._id, { isDefault: false });
          }
        }
      }
    }

    await ctx.db.patch(scaleId, {
      ...updates,
      updatedAt: now,
    });

    return scaleId;
  },
});

// Delete grading scale
export const deleteGradingScale = mutation({
  args: { scaleId: v.id('gradingScales') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scaleId);
    return { success: true };
  },
});


export const getGradingScaleById = query({
  args: { scaleId: v.id('gradingScales') },
  handler: async (ctx, args) => {
    const scale = await ctx.db.get(args.scaleId);
    return scale;
  },
});