import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query('schoolAdmins').collect();
    return admins;
  },
});

export const getById = query({
  args: { id: v.id('schoolAdmins') },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    return admin;
  },
});

export const getBySchoolId = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query('schoolAdmins')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .first();
    return admin;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();
    return admin;
  },
});

export const updatePassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();

    if (!admin) {
      throw new Error('Admin not found');
    }

    await ctx.db.patch(admin._id, {
      password: args.password,
      tempPassword: undefined, // Clear temp password once permanent password is set
    });

    return admin._id;
  },
});

export const resetPassword = mutation({
  args: {
    id: v.id('schoolAdmins'),
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Set the temp password and clear the hashed password
    // User will be required to change password on next login
    await ctx.db.patch(args.id, {
      tempPassword: args.tempPassword,
      password: undefined, // Clear hashed password to force temp password usage
    });

    // Send notification to the admin
    await ctx.db.insert('notifications', {
      title: 'Password Reset',
      message: 'Your password has been reset by an administrator. You will need to change your password on your next login.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: args.id,
      recipientRole: 'school_admin',
    });

    return args.id;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    schoolId: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
    invitedBy: v.string(),
    tempPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('schoolAdmins', {
      name: args.name,
      email: args.email,
      schoolId: args.schoolId,
      status: args.status,
      createdAt: new Date().toISOString(),
      invitedBy: args.invitedBy,
      tempPassword: args.tempPassword,
    });

    return id;
  },
});

export const bulkCreate = mutation({
  args: {
    admins: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        schoolId: v.string(),
        status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
        invitedBy: v.string(),
        tempPassword: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const admin of args.admins) {
      const id = await ctx.db.insert('schoolAdmins', {
        ...admin,
        createdAt: new Date().toISOString(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id('schoolAdmins'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended'))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const bulkUpdate = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('schoolAdmins'),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended'))),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const { id, ...fields } = update;
      await ctx.db.patch(id, fields);
    }
    return args.updates.length;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('schoolAdmins'),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    if (!admin) throw new Error('Admin not found');

    const oldStatus = admin.status;
    await ctx.db.patch(args.id, {
      status: args.status,
    });

    // Send notification if status changed to suspended or inactive
    if (args.status === 'suspended' && oldStatus !== 'suspended') {
      await ctx.db.insert('notifications', {
        title: 'Account Suspended',
        message: args.reason 
          ? `Your account has been suspended. Reason: ${args.reason}` 
          : 'Your account has been suspended by an administrator. Please contact support for assistance.',
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: args.id,
        recipientRole: 'school_admin',
      });

      // Update associated subscriptions
      const subscriptions = await ctx.db
        .query('subscriptionRequests')
        .filter((q) => q.eq(q.field('schoolAdminEmail'), admin.email))
        .collect();

      for (const sub of subscriptions) {
        if (sub.status === 'approved') {
          await ctx.db.patch(sub._id, {
            status: 'expired',
          });
        }
      }
    }

    if (args.status === 'inactive' && oldStatus !== 'inactive') {
      await ctx.db.insert('notifications', {
        title: 'Account Deactivated',
        message: args.reason 
          ? `Your account has been deactivated. Reason: ${args.reason}` 
          : 'Your account has been deactivated by an administrator. Please contact support for assistance.',
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: args.id,
        recipientRole: 'school_admin',
      });

      // Update subscription status
      await ctx.db.patch(args.id, {
        hasActiveSubscription: false,
      });
    }

    return args.id;
  },
});

export const remove = mutation({
  args: { 
    id: v.id('schoolAdmins'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    if (!admin) throw new Error('Admin not found');

    // Send notification before deletion
    await ctx.db.insert('notifications', {
      title: 'Account Deleted',
      message: args.reason 
        ? `Your account has been deleted. Reason: ${args.reason}` 
        : 'Your account has been deleted by an administrator.',
      type: 'error',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: args.id,
      recipientRole: 'school_admin',
    });

    // Delete or expire associated subscriptions
    const subscriptions = await ctx.db
      .query('subscriptionRequests')
      .filter((q) => q.eq(q.field('schoolAdminEmail'), admin.email))
      .collect();

    for (const sub of subscriptions) {
      await ctx.db.patch(sub._id, {
        status: 'expired',
      });
    }

    // Delete the admin
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id('schoolAdmins')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const admin = await ctx.db.get(id);
      if (!admin) continue;

      // Send notification before deletion
      await ctx.db.insert('notifications', {
        title: 'Account Deleted',
        message: args.reason 
          ? `Your account has been deleted. Reason: ${args.reason}` 
          : 'Your account has been deleted by an administrator.',
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: id,
        recipientRole: 'school_admin',
      });

      // Cancel associated subscriptions
      const subscriptions = await ctx.db
        .query('subscriptionRequests')
        .filter((q) => q.eq(q.field('schoolAdminEmail'), admin.email))
        .collect();

      for (const sub of subscriptions) {
        await ctx.db.patch(sub._id, {
          status: 'expired',
        });
      }

      await ctx.db.delete(id);
    }
    return args.ids.length;
  },
});
