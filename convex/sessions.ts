import { v } from 'convex/values';
import { mutation, query } from './_generated/server';


// Create session
export const create = mutation({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin'), v.literal('teacher')),
    sessionToken: v.string(),
    ipAddress: v.string(),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    deviceType: v.union(v.literal('desktop'), v.literal('mobile'), v.literal('tablet'), v.literal('unknown')),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('sessions', {
      userId: args.userId,
      userRole: args.userRole,
      sessionToken: args.sessionToken,
      ipAddress: args.ipAddress,
      device: args.device,
      browser: args.browser,
      os: args.os,
      deviceType: args.deviceType,
      createdAt: new Date().toISOString(),
      expiresAt: args.expiresAt,
      lastActivity: new Date().toISOString(),
      isActive: true,
    });

    return id;
  },
});

// Update session activity
export const updateActivity = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .filter((q) => q.eq(q.field('sessionToken'), args.sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastActivity: new Date().toISOString(),
      });
    }
  },
});

// Revoke session
export const revoke = mutation({
  args: {
    id: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
    });
  },
});

// Revoke all sessions for a user except current
export const revokeAllExcept = mutation({
  args: {
    userId: v.string(),
    currentSessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('sessions')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('isActive'), true),
          q.neq(q.field('sessionToken'), args.currentSessionToken)
        )
      )
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
      });
    }

    return sessions.length;
  },
});

// List active sessions
export const listActive = query({
  args: {
    userId: v.optional(v.string()),
    userRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'), v.literal('teacher'))),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('sessions');

    const results = await query.collect();

    // Filter active sessions
    let filtered = results.filter((s) => s.isActive);

    // Filter by user if specified
    if (args.userId) {
      filtered = filtered.filter((s) => s.userId === args.userId);
    }

    // Filter by role if specified
    if (args.userRole) {
      filtered = filtered.filter((s) => s.userRole === args.userRole);
    }

    // Check expiry
    const now = Date.now();
    const activeSessions = filtered.filter((s) => s.expiresAt > now);

    return activeSessions.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  },
});

// Get session by token
export const getByToken = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .filter((q) => q.eq(q.field('sessionToken'), args.sessionToken))
      .first();

    return session;
  },
});

// Clean up expired sessions (should be called periodically)
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query('sessions').collect();

    const expired = sessions.filter((s) => s.isActive && s.expiresAt <= now);

    for (const session of expired) {
      await ctx.db.patch(session._id, {
        isActive: false,
      });
    }

    return expired.length;
  },
});

// Get statistics
export const getStats = query({
  args: {
    userRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'), v.literal('teacher'))),
  },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query('sessions').collect();

    // Filter by role if specified
    const filtered = args.userRole
      ? allSessions.filter((s) => s.userRole === args.userRole)
      : allSessions;

    const now = Date.now();
    const active = filtered.filter((s) => s.isActive && s.expiresAt > now).length;
    const total = filtered.length;

    // Device breakdown
    const deviceBreakdown = {
      desktop: filtered.filter((s) => s.isActive && s.deviceType === 'desktop' && s.expiresAt > now).length,
      mobile: filtered.filter((s) => s.isActive && s.deviceType === 'mobile' && s.expiresAt > now).length,
      tablet: filtered.filter((s) => s.isActive && s.deviceType === 'tablet' && s.expiresAt > now).length,
      unknown: filtered.filter((s) => s.isActive && s.deviceType === 'unknown' && s.expiresAt > now).length,
    };

    return {
      active,
      total,
      deviceBreakdown,
    };
  },
});
