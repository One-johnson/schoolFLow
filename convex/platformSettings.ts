import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get platform settings (or return defaults)
export const get = query({
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('platformSettings')
      .order('desc')
      .first();
    
    // Return defaults if no settings exist
    if (!settings) {
      return {
        platformName: 'SchoolFlow',
        supportEmail: 'support@schoolflow.com',
        maxSchools: 1000,
        defaultPricePerStudent: 10,
        monthlyEnrollmentTarget: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...settings,
      monthlyEnrollmentTarget: settings.monthlyEnrollmentTarget,
    };
  },
});

// Update platform settings
export const update = mutation({
  args: {
    platformName: v.string(),
    supportEmail: v.string(),
    maxSchools: v.number(),
    defaultPricePerStudent: v.number(),
    monthlyEnrollmentTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('platformSettings')
      .order('desc')
      .first();

    const updates = {
      platformName: args.platformName,
      supportEmail: args.supportEmail,
      maxSchools: args.maxSchools,
      defaultPricePerStudent: args.defaultPricePerStudent,
      monthlyEnrollmentTarget: args.monthlyEnrollmentTarget,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert('platformSettings', {
        ...updates,
        createdAt: new Date().toISOString(),
      });
    }
  },
});
