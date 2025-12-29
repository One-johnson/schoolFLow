import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Create security alert
export const create = mutation({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    alertType: v.union(
      v.literal('new_device'),
      v.literal('suspicious_location'),
      v.literal('multiple_failed_attempts'),
      v.literal('unusual_activity')
    ),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    message: v.string(),
    ipAddress: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('securityAlerts', {
      userId: args.userId,
      userRole: args.userRole,
      alertType: args.alertType,
      severity: args.severity,
      message: args.message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      ipAddress: args.ipAddress,
      device: args.device,
    });

    return id;
  },
});

// Acknowledge alert
export const acknowledge = mutation({
  args: {
    id: v.id('securityAlerts'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      acknowledged: true,
    });
  },
});

// List alerts
export const list = query({
  args: {
    userId: v.optional(v.string()),
    acknowledged: v.optional(v.boolean()),
    severity: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('securityAlerts');

    const results = await query.order('desc').take(args.limit || 100);

    let filtered = results;

    // Filter by user
    if (args.userId) {
      filtered = filtered.filter((alert) => alert.userId === args.userId);
    }

    // Filter by acknowledged status
    if (args.acknowledged !== undefined) {
      filtered = filtered.filter((alert) => alert.acknowledged === args.acknowledged);
    }

    // Filter by severity
    if (args.severity) {
      filtered = filtered.filter((alert) => alert.severity === args.severity);
    }

    return filtered;
  },
});

// Get statistics
export const getStats = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allAlerts = await ctx.db.query('securityAlerts').collect();

    // Filter by user if specified
    const filtered = args.userId
      ? allAlerts.filter((alert) => alert.userId === args.userId)
      : allAlerts;

    const total = filtered.length;
    const unacknowledged = filtered.filter((alert) => !alert.acknowledged).length;

    const bySeverity = {
      high: filtered.filter((alert) => alert.severity === 'high').length,
      medium: filtered.filter((alert) => alert.severity === 'medium').length,
      low: filtered.filter((alert) => alert.severity === 'low').length,
    };

    const byType = {
      new_device: filtered.filter((alert) => alert.alertType === 'new_device').length,
      suspicious_location: filtered.filter((alert) => alert.alertType === 'suspicious_location').length,
      multiple_failed_attempts: filtered.filter((alert) => alert.alertType === 'multiple_failed_attempts').length,
      unusual_activity: filtered.filter((alert) => alert.alertType === 'unusual_activity').length,
    };

    return {
      total,
      unacknowledged,
      bySeverity,
      byType,
    };
  },
});

// Detect suspicious activity (helper function)
export const detectSuspiciousActivity = mutation({
  args: {
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    ipAddress: v.string(),
    device: v.string(),
  },
  handler: async (ctx, args) => {
    // Get recent login history for this user
    const recentLogins = await ctx.db
      .query('loginHistory')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .take(10);

    const alerts: string[] = [];

    // Check for new device
    const knownDevices = new Set(recentLogins.map((login) => login.device));
    if (!knownDevices.has(args.device)) {
      await ctx.db.insert('securityAlerts', {
        userId: args.userId,
        userRole: args.userRole,
        alertType: 'new_device',
        severity: 'medium',
        message: `Login detected from new device: ${args.device}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        ipAddress: args.ipAddress,
        device: args.device,
      });
      alerts.push('new_device');
    }

    // Check for new IP address
    const knownIps = new Set(recentLogins.map((login) => login.ipAddress));
    if (!knownIps.has(args.ipAddress)) {
      await ctx.db.insert('securityAlerts', {
        userId: args.userId,
        userRole: args.userRole,
        alertType: 'suspicious_location',
        severity: 'low',
        message: `Login detected from new IP address: ${args.ipAddress}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        ipAddress: args.ipAddress,
        device: args.device,
      });
      alerts.push('suspicious_location');
    }

    // Check for multiple failed attempts
    const recentFailedLogins = recentLogins.filter((login) => login.status === 'failed');
    if (recentFailedLogins.length >= 3) {
      await ctx.db.insert('securityAlerts', {
        userId: args.userId,
        userRole: args.userRole,
        alertType: 'multiple_failed_attempts',
        severity: 'high',
        message: `Multiple failed login attempts detected (${recentFailedLogins.length} attempts)`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        ipAddress: args.ipAddress,
        device: args.device,
      });
      alerts.push('multiple_failed_attempts');
    }

    return alerts;
  },
});
