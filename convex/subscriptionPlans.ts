import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query('subscriptionPlans').collect();
    return plans;
  },
});

export const getById = query({
  args: { id: v.id('subscriptionPlans') },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.id);
    return plan;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    pricePerStudent: v.number(),
    billingCycle: v.union(v.literal('monthly'), v.literal('quarterly'), v.literal('yearly')),
    features: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.db.insert('subscriptionPlans', {
      name: args.name,
      description: args.description,
      pricePerStudent: args.pricePerStudent,
      billingCycle: args.billingCycle,
      features: args.features,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return planId;
  },
});

export const update = mutation({
  args: {
    id: v.id('subscriptionPlans'),
    name: v.string(),
    description: v.string(),
    pricePerStudent: v.number(),
    billingCycle: v.union(v.literal('monthly'), v.literal('quarterly'), v.literal('yearly')),
    features: v.array(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id('subscriptionPlans'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const toggleStatus = mutation({
  args: {
    id: v.id('subscriptionPlans'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: new Date().toISOString(),
    });
    return args.id;
  },
});
