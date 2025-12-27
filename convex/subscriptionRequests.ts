import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
  args: {
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    planId: v.string(),
    planName: v.string(),
    studentsCount: v.number(),
    totalAmount: v.number(),
    isTrial: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('subscriptionRequests', {
      schoolAdminId: args.schoolAdminId,
      schoolAdminEmail: args.schoolAdminEmail,
      planId: args.planId,
      planName: args.planName,
      studentsCount: args.studentsCount,
      totalAmount: args.totalAmount,
      isTrial: args.isTrial,
      status: args.isTrial ? 'approved' : 'pending_payment',
      createdAt: new Date().toISOString(),
      ...(args.isTrial && {
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date().toISOString(),
      }),
    });

    // If it's a trial, update school admin status
    if (args.isTrial) {
      const admin = await ctx.db
        .query('schoolAdmins')
        .filter((q) => q.eq(q.field('email'), args.schoolAdminEmail))
        .first();

      if (admin) {
        await ctx.db.patch(admin._id, {
          hasActiveSubscription: true,
          trialStartDate: new Date().toISOString(),
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Create notification for school admin
      await ctx.db.insert('notifications', {
        title: 'Trial Activated',
        message: `Your 30-day trial has been activated. You can now create your school.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: args.schoolAdminId,
        recipientRole: 'school_admin',
      });
    }

    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query('subscriptionRequests')
      .order('desc')
      .collect();
    return requests;
  },
});

export const getByAdmin = query({
  args: { schoolAdminId: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query('subscriptionRequests')
      .withIndex('by_admin', (q) => q.eq('schoolAdminId', args.schoolAdminId))
      .order('desc')
      .collect();
    return requests;
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query('subscriptionRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending_approval'))
      .order('desc')
      .collect();
    return requests;
  },
});

export const approve = mutation({
  args: {
    id: v.id('subscriptionRequests'),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error('Subscription request not found');

    await ctx.db.patch(args.id, {
      status: 'approved',
      approvedBy: args.approvedBy,
      approvedAt: new Date().toISOString(),
    });

    // Update school admin status
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('email'), request.schoolAdminEmail))
      .first();

    if (admin) {
      await ctx.db.patch(admin._id, {
        hasActiveSubscription: true,
        status: 'active',
      });
    }

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'Subscription Approved',
      message: `Your subscription to ${request.planName} has been approved. You can now create your school.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: request.schoolAdminId,
      recipientRole: 'school_admin',
      actionUrl: '/school-admin/create-school',
    });

    return args.id;
  },
});

export const reject = mutation({
  args: {
    id: v.id('subscriptionRequests'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error('Subscription request not found');

    await ctx.db.patch(args.id, {
      status: 'rejected',
    });

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'Subscription Rejected',
      message: `Your subscription request has been rejected. Reason: ${args.reason}`,
      type: 'error',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: request.schoolAdminId,
      recipientRole: 'school_admin',
    });

    return args.id;
  },
});

export const checkTrialExpiry = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const expiredTrials = await ctx.db
      .query('subscriptionRequests')
      .filter((q) => 
        q.and(
          q.eq(q.field('isTrial'), true),
          q.eq(q.field('status'), 'approved'),
          q.lt(q.field('trialEndDate'), now)
        )
      )
      .collect();

    for (const trial of expiredTrials) {
      // Update subscription request status
      await ctx.db.patch(trial._id, {
        status: 'expired',
      });

      // Suspend school admin
      const admin = await ctx.db
        .query('schoolAdmins')
        .filter((q) => q.eq(q.field('email'), trial.schoolAdminEmail))
        .first();

      if (admin) {
        await ctx.db.patch(admin._id, {
          status: 'suspended',
          hasActiveSubscription: false,
        });

        // Create notification for school admin
        await ctx.db.insert('notifications', {
          title: 'Trial Expired',
          message: 'Your 30-day trial has expired. Please purchase a subscription to continue using SchoolFlow.',
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false,
          recipientId: trial.schoolAdminId,
          recipientRole: 'school_admin',
          actionUrl: '/school-admin/subscription',
        });
      }
    }

    return expiredTrials.length;
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id('subscriptionRequests')),
  },
  handler: async (ctx, args) => {
    const deletedCount: number = 0;
    
    for (const id of args.ids) {
      const request = await ctx.db.get(id);
      if (request) {
        // Update associated school admin if subscription was active
        if (request.status === 'approved') {
          const admin = await ctx.db
            .query('schoolAdmins')
            .filter((q) => q.eq(q.field('email'), request.schoolAdminEmail))
            .first();

          if (admin) {
            await ctx.db.patch(admin._id, {
              hasActiveSubscription: false,
              status: 'pending',
            });

            // Create notification for school admin
            await ctx.db.insert('notifications', {
              title: 'Subscription Removed',
              message: `Your subscription to ${request.planName} has been removed by an administrator.`,
              type: 'warning',
              timestamp: new Date().toISOString(),
              read: false,
              recipientId: request.schoolAdminId,
              recipientRole: 'school_admin',
            });
          }
        }

        await ctx.db.delete(id);
      }
    }

    return { deletedCount: args.ids.length };
  },
});
