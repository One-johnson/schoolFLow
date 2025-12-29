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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    return settings;
  },
});

// Update platform settings
export const update = mutation({
  args: {
    platformName: v.string(),
    supportEmail: v.string(),
    maxSchools: v.number(),
    defaultPricePerStudent: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('platformSettings')
      .order('desc')
      .first();
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        platformName: args.platformName,
        supportEmail: args.supportEmail,
        maxSchools: args.maxSchools,
        defaultPricePerStudent: args.defaultPricePerStudent,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      // Create new settings
      return await ctx.db.insert('platformSettings', {
        platformName: args.platformName,
        supportEmail: args.supportEmail,
        maxSchools: args.maxSchools,
        defaultPricePerStudent: args.defaultPricePerStudent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },
});
