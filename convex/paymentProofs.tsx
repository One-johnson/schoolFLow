import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const create = mutation({
  args: {
    subscriptionRequestId: v.string(),
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    paymentMethod: v.union(v.literal('mobile_money'), v.literal('bank_transfer')),
    transactionId: v.string(),
    amount: v.number(),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
    screenshotStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('paymentProofs', {
      subscriptionRequestId: args.subscriptionRequestId,
      schoolAdminId: args.schoolAdminId,
      schoolAdminEmail: args.schoolAdminEmail,
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      amount: args.amount,
      paymentDate: args.paymentDate,
      notes: args.notes,
      screenshotStorageId: args.screenshotStorageId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Update subscription request status
    const subscriptionRequest = await ctx.db
      .query('subscriptionRequests')
      .filter((q) => q.eq(q.field('_id'), args.subscriptionRequestId))
      .first();

    if (subscriptionRequest) {
      await ctx.db.patch(subscriptionRequest._id, {
        status: 'pending_approval',
      });
    }

    // Create notification for super admin
    await ctx.db.insert('notifications', {
      title: 'New Payment Proof',
      message: `${args.schoolAdminEmail} has uploaded payment proof for subscription approval.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      recipientRole: 'super_admin',
      actionUrl: '/super-admin/subscriptions',
    });

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'Payment Proof Submitted',
      message: 'Your payment proof has been submitted and is pending review by the administrator.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: args.schoolAdminId,
      recipientRole: 'school_admin',
    });

    return id;
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const proofs = await ctx.db
      .query('paymentProofs')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .collect();
    return proofs;
  },
});

export const getBySubscriptionRequest = query({
  args: { subscriptionRequestId: v.string() },
  handler: async (ctx, args) => {
    const proof = await ctx.db
      .query('paymentProofs')
      .withIndex('by_subscription_request', (q) => q.eq('subscriptionRequestId', args.subscriptionRequestId))
      .first();
    return proof;
  },
});

export const approve = mutation({
  args: {
    id: v.id('paymentProofs'),
    reviewedBy: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) throw new Error('Payment proof not found');

    await ctx.db.patch(args.id, {
      status: 'approved',
      reviewedBy: args.reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes: args.reviewNotes,
    });

    // Approve the subscription request
    const subscriptionRequest = await ctx.db
      .query('subscriptionRequests')
      .filter((q) => q.eq(q.field('_id'), proof.subscriptionRequestId))
      .first();

    if (subscriptionRequest) {
      await ctx.db.patch(subscriptionRequest._id, {
        status: 'approved',
        approvedBy: args.reviewedBy,
        approvedAt: new Date().toISOString(),
      });

      // Update school admin status
      const admin = await ctx.db
        .query('schoolAdmins')
        .filter((q) => q.eq(q.field('email'), proof.schoolAdminEmail))
        .first();

      if (admin) {
        await ctx.db.patch(admin._id, {
          hasActiveSubscription: true,
          status: 'active',
        });
      }

      // Create notification for school admin
      await ctx.db.insert('notifications', {
        title: 'Payment Verified',
        message: `Your payment has been verified and your subscription to ${subscriptionRequest.planName} is now active. You can now create your school.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: proof.schoolAdminId,
        recipientRole: 'school_admin',
        actionUrl: '/school-admin/create-school',
      });
    }

    return args.id;
  },
});

export const reject = mutation({
  args: {
    id: v.id('paymentProofs'),
    reviewedBy: v.string(),
    reviewNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) throw new Error('Payment proof not found');

    await ctx.db.patch(args.id, {
      status: 'rejected',
      reviewedBy: args.reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes: args.reviewNotes,
    });

    // Update subscription request status
    const subscriptionRequest = await ctx.db
      .query('subscriptionRequests')
      .filter((q) => q.eq(q.field('_id'), proof.subscriptionRequestId))
      .first();

    if (subscriptionRequest) {
      await ctx.db.patch(subscriptionRequest._id, {
        status: 'rejected',
      });
    }

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'Payment Rejected',
      message: `Your payment proof has been rejected. Reason: ${args.reviewNotes}. Please re-upload with correct details.`,
      type: 'error',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: proof.schoolAdminId,
      recipientRole: 'school_admin',
      actionUrl: '/school-admin/payment',
    });

    return args.id;
  },
});
