import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate unique discount code
function generateDiscountCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `DISC${digits}`;
}

// Create fee discount
export const createDiscount = mutation({
  args: {
    schoolId: v.string(),
    discountName: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(v.literal('percentage'), v.literal('fixed')),
    discountValue: v.number(),
    applicableTo: v.union(v.literal('all'), v.literal('specific_categories')),
    categoryIds: v.optional(v.array(v.string())),
    reason: v.union(
      v.literal('scholarship'),
      v.literal('sibling'),
      v.literal('merit'),
      v.literal('need_based'),
      v.literal('other')
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const discountCode = generateDiscountCode();
    const now = new Date().toISOString();

    const discountId = await ctx.db.insert('feeDiscounts', {
      schoolId: args.schoolId,
      discountCode,
      discountName: args.discountName,
      description: args.description,
      discountType: args.discountType,
      discountValue: args.discountValue,
      applicableTo: args.applicableTo,
      categoryIds: args.categoryIds,
      reason: args.reason,
      status: 'active',
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return discountId;
  },
});

// Get all discounts for a school
export const getDiscountsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const discounts = await ctx.db
      .query('feeDiscounts')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return discounts;
  },
});

// Get active discounts
export const getActiveDiscounts = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const discounts = await ctx.db
      .query('feeDiscounts')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .collect();

    return discounts;
  },
});

// Calculate discount amount
export const calculateDiscount = query({
  args: {
    discountId: v.id('feeDiscounts'),
    originalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const discount = await ctx.db.get(args.discountId);
    
    if (!discount || discount.status !== 'active') {
      return { discountAmount: 0, finalAmount: args.originalAmount };
    }

    let discountAmount = 0;
    
    if (discount.discountType === 'percentage') {
      discountAmount = (args.originalAmount * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }

    const finalAmount = Math.max(0, args.originalAmount - discountAmount);

    return { discountAmount, finalAmount };
  },
});

// Update discount
export const updateDiscount = mutation({
  args: {
    discountId: v.id('feeDiscounts'),
    discountName: v.optional(v.string()),
    description: v.optional(v.string()),
    discountValue: v.optional(v.number()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { discountId, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(discountId, {
      ...updates,
      updatedAt: now,
    });

    return discountId;
  },
});

// Delete discount
export const deleteDiscount = mutation({
  args: { discountId: v.id('feeDiscounts') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.discountId);
  },
});
