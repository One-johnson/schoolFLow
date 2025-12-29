import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get user settings by userId and role
export const get = query({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', args.userId).eq('userRole', args.userRole))
      .first();
    
    // Return defaults if no settings exist
    if (!settings) {
      if (args.userRole === 'super_admin') {
        return {
          userId: args.userId,
          userRole: args.userRole,
          // Notification preferences
          emailNotifications: true,
          newSchoolRegistration: true,
          paymentVerification: true,
          systemAlerts: true,
          // Security settings
          twoFactorAuth: false,
          sessionTimeout: 30,
          ipWhitelist: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        return {
          userId: args.userId,
          userRole: args.userRole,
          // Notification preferences
          emailNotifications: true,
          paymentAlerts: true,
          systemUpdates: false,
          // Account settings
          profileVisibility: true,
          dataSharing: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }
    
    return settings;
  },
});

// Update Super Admin settings
export const updateSuperAdmin = mutation({
  args: {
    userId: v.string(),
    // Notification preferences
    emailNotifications: v.optional(v.boolean()),
    newSchoolRegistration: v.optional(v.boolean()),
    paymentVerification: v.optional(v.boolean()),
    systemAlerts: v.optional(v.boolean()),
    // Security settings
    twoFactorAuth: v.optional(v.boolean()),
    sessionTimeout: v.optional(v.number()),
    ipWhitelist: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...settingsData } = args;
    
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId).eq('userRole', 'super_admin'))
      .first();
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...settingsData,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      // Create new settings with defaults
      return await ctx.db.insert('userSettings', {
        userId,
        userRole: 'super_admin' as const,
        emailNotifications: settingsData.emailNotifications ?? true,
        newSchoolRegistration: settingsData.newSchoolRegistration ?? true,
        paymentVerification: settingsData.paymentVerification ?? true,
        systemAlerts: settingsData.systemAlerts ?? true,
        twoFactorAuth: settingsData.twoFactorAuth ?? false,
        sessionTimeout: settingsData.sessionTimeout ?? 30,
        ipWhitelist: settingsData.ipWhitelist ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

// Update School Admin settings
export const updateSchoolAdmin = mutation({
  args: {
    userId: v.string(),
    // Notification preferences
    emailNotifications: v.optional(v.boolean()),
    paymentAlerts: v.optional(v.boolean()),
    systemUpdates: v.optional(v.boolean()),
    // Account settings
    profileVisibility: v.optional(v.boolean()),
    dataSharing: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...settingsData } = args;
    
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId).eq('userRole', 'school_admin'))
      .first();
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...settingsData,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      // Create new settings with defaults
      return await ctx.db.insert('userSettings', {
        userId,
        userRole: 'school_admin' as const,
        emailNotifications: settingsData.emailNotifications ?? true,
        paymentAlerts: settingsData.paymentAlerts ?? true,
        systemUpdates: settingsData.systemUpdates ?? false,
        profileVisibility: settingsData.profileVisibility ?? true,
        dataSharing: settingsData.dataSharing ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },
});
