import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate unique category code
function generateCategoryCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `FEE${digits}`;
}

// Create fee category
export const createFeeCategory = mutation({
  args: {
    schoolId: v.string(),
    categoryName: v.string(),
    description: v.optional(v.string()),
    isOptional: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const categoryCode = generateCategoryCode();
    const now = new Date().toISOString();

    const categoryId = await ctx.db.insert('feeCategories', {
      schoolId: args.schoolId,
      categoryCode,
      categoryName: args.categoryName,
      description: args.description,
      isOptional: args.isOptional,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return categoryId;
  },
});

// Get all fee categories for a school
export const getCategoriesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query('feeCategories')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return categories;
  },
});

// Get active fee categories for a school
export const getActiveCategoriesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query('feeCategories')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .collect();

    return categories;
  },
});

// Update fee category
export const updateFeeCategory = mutation({
  args: {
    categoryId: v.id('feeCategories'),
    categoryName: v.optional(v.string()),
    description: v.optional(v.string()),
    isOptional: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    const { categoryId, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(categoryId, {
      ...updates,
      updatedAt: now,
    });

    return categoryId;
  },
});

// Delete fee category
export const deleteFeeCategory = mutation({
  args: { categoryId: v.id('feeCategories') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.categoryId);
  },
});

// Get fee category stats
export const getCategoryStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query('feeCategories')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const active = categories.filter((c) => c.status === 'active').length;
    const inactive = categories.filter((c) => c.status === 'inactive').length;
    const mandatory = categories.filter((c) => !c.isOptional).length;
    const optional = categories.filter((c) => c.isOptional).length;

    return {
      total: categories.length,
      active,
      inactive,
      mandatory,
      optional,
    };
  },
});
