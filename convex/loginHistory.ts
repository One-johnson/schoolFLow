import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Create login history entry
export const create = mutation({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    status: v.union(v.literal('success'), v.literal('failed')),
    ipAddress: v.string(),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    deviceType: v.union(v.literal('desktop'), v.literal('mobile'), v.literal('tablet'), v.literal('unknown')),
    failureReason: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('loginHistory', {
      userId: args.userId,
      userRole: args.userRole,
      loginTime: new Date().toISOString(),
      status: args.status,
      ipAddress: args.ipAddress,
      device: args.device,
      browser: args.browser,
      os: args.os,
      deviceType: args.deviceType,
      failureReason: args.failureReason,
      sessionId: args.sessionId,
    });

    return id;
  },
});

// Update logout time
export const updateLogout = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const loginEntry = await ctx.db
      .query('loginHistory')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (loginEntry) {
      await ctx.db.patch(loginEntry._id, {
        logoutTime: new Date().toISOString(),
      });
    }
  },
});

// List all login history (paginated)
export const list = query({
  args: {
    limit: v.optional(v.number()),
    userRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
    status: v.optional(v.union(v.literal('success'), v.literal('failed'))),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('loginHistory');

    const results = await query.order('desc').take(args.limit || 100);

    // Filter by role if specified
    let filtered = results;
    if (args.userRole) {
      filtered = filtered.filter((entry) => entry.userRole === args.userRole);
    }

    // Filter by status if specified
    if (args.status) {
      filtered = filtered.filter((entry) => entry.status === args.status);
    }

    return filtered;
  },
});

// Get login history for specific user
export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('loginHistory')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .take(args.limit || 50);

    return results;
  },
});

// Get statistics
export const getStats = query({
  args: {
    userRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('loginHistory');
    const allHistory = await query.collect();

    // Filter by role if specified
    const filtered = args.userRole
      ? allHistory.filter((entry) => entry.userRole === args.userRole)
      : allHistory;

    const total = filtered.length;
    const successful = filtered.filter((entry) => entry.status === 'success').length;
    const failed = filtered.filter((entry) => entry.status === 'failed').length;

    // Get today's logins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = filtered.filter((entry) => {
      const loginDate = new Date(entry.loginTime);
      return loginDate >= today;
    }).length;

    // Get device breakdown
    const deviceBreakdown = {
      desktop: filtered.filter((e) => e.deviceType === 'desktop').length,
      mobile: filtered.filter((e) => e.deviceType === 'mobile').length,
      tablet: filtered.filter((e) => e.deviceType === 'tablet').length,
      unknown: filtered.filter((e) => e.deviceType === 'unknown').length,
    };

    return {
      total,
      successful,
      failed,
      todayLogins,
      deviceBreakdown,
    };
  },
});

// Get recent failed login attempts (for security)
export const getRecentFailedLogins = query({
  args: {
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursAgo = args.hours || 24;
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const failedLogins = await ctx.db
      .query('loginHistory')
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'failed'),
          q.gte(q.field('loginTime'), cutoffTime)
        )
      )
      .order('desc')
      .collect();

    return failedLogins;
  },
});
