import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate upload URL for photos/documents
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Create photo record after successful upload
export const createPhotoRecord = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    entityType: v.union(
      v.literal('student'),
      v.literal('teacher'),
      v.literal('school'),
      v.literal('support_ticket')
    ),
    entityId: v.string(),
    fileType: v.union(
      v.literal('photo'),
      v.literal('document'),
      v.literal('certificate'),
      v.literal('attachment')
    ),
    uploadedBy: v.string(),
    schoolId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const photoId = await ctx.db.insert('photos', {
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      entityType: args.entityType,
      entityId: args.entityId,
      fileType: args.fileType,
      uploadedBy: args.uploadedBy,
      uploadedAt: new Date().toISOString(),
      schoolId: args.schoolId,
      isDeleted: false,
    });

    return photoId;
  },
});

// Get photo/document URL from storage
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<'_storage'>);
  },
});

// Get photo record by storage ID
export const getPhotoByStorageId = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .first();

    return photo;
  },
});

// Get all photos for an entity
export const getPhotosByEntity = query({
  args: {
    entityType: v.union(
      v.literal('student'),
      v.literal('teacher'),
      v.literal('school'),
      v.literal('support_ticket')
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query('photos')
      .withIndex('by_entity', (q) =>
        q.eq('entityType', args.entityType).eq('entityId', args.entityId)
      )
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .collect();

    return photos;
  },
});

// Soft delete photo record
export const softDeletePhoto = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (!photo) {
      throw new Error('Photo record not found');
    }

    await ctx.db.patch(photo._id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Hard delete file from storage (use with caution)
export const deleteFileFromStorage = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // First soft delete the photo record
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (photo) {
      await ctx.db.patch(photo._id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    }

    // Then delete from storage
    await ctx.storage.delete(args.storageId as Id<'_storage'>);

    return { success: true };
  },
});

// Delete photo record and file (complete cleanup)
export const deletePhoto = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // Find and soft delete the photo record
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (photo) {
      await ctx.db.patch(photo._id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    }

    // Delete from storage
    try {
      await ctx.storage.delete(args.storageId as Id<'_storage'>);
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      // Continue even if storage deletion fails
    }

    return { success: true };
  },
});

// ─── Payment Proof Mutations ─────────────────────────────────────────────────

// Create a payment proof and transition the subscription request to pending_approval
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
    const subscriptionRequest = await ctx.db.get(
      args.subscriptionRequestId as Id<'subscriptionRequests'>
    );
    if (!subscriptionRequest) {
      throw new Error('Subscription request not found');
    }
    if (subscriptionRequest.status !== 'pending_payment') {
      throw new Error('Subscription request is not awaiting payment');
    }

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

    // Transition subscription request → pending_approval so it appears in the super admin queue
    await ctx.db.patch(
      args.subscriptionRequestId as Id<'subscriptionRequests'>,
      { status: 'pending_approval' }
    );

    return id;
  },
});

// Return all payment proofs awaiting super admin review
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('paymentProofs')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .collect();
  },
});

// Approve a payment proof — activates the subscription and the school admin account
export const approve = mutation({
  args: {
    id: v.id('paymentProofs'),
    reviewedBy: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) throw new Error('Payment proof not found');
    if (proof.status !== 'pending') throw new Error('Payment proof is not pending');

    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      status: 'approved',
      reviewedBy: args.reviewedBy,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
    });

    // Approve the linked subscription request
    const subscriptionRequest = await ctx.db.get(
      proof.subscriptionRequestId as Id<'subscriptionRequests'>
    );
    if (!subscriptionRequest) {
      throw new Error('Linked subscription request not found');
    }

    await ctx.db.patch(
      proof.subscriptionRequestId as Id<'subscriptionRequests'>,
      {
        status: 'approved',
        approvedBy: args.reviewedBy,
        approvedAt: now,
      }
    );

    // Activate the school admin
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('email'), subscriptionRequest.schoolAdminEmail))
      .first();

    if (admin) {
      await ctx.db.patch(admin._id, {
        hasActiveSubscription: true,
        status: 'active',
      });
    }

    // Notify school admin
    await ctx.db.insert('notifications', {
      title: 'Subscription Approved',
      message: `Your payment has been verified and your subscription to ${subscriptionRequest.planName} has been approved. You can now create your school.`,
      type: 'success',
      timestamp: now,
      read: false,
      recipientId: subscriptionRequest.schoolAdminId,
      recipientRole: 'school_admin',
      actionUrl: '/school-admin/create-school',
    });

    return args.id;
  },
});

// Reject a payment proof — resets the subscription request so the admin can resubmit
export const reject = mutation({
  args: {
    id: v.id('paymentProofs'),
    reviewedBy: v.string(),
    reviewNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.id);
    if (!proof) throw new Error('Payment proof not found');
    if (proof.status !== 'pending') throw new Error('Payment proof is not pending');

    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      status: 'rejected',
      reviewedBy: args.reviewedBy,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
    });

    // Reset subscription request back to pending_payment so the admin can resubmit
    const subscriptionRequest = await ctx.db.get(
      proof.subscriptionRequestId as Id<'subscriptionRequests'>
    );
    if (subscriptionRequest) {
      await ctx.db.patch(
        proof.subscriptionRequestId as Id<'subscriptionRequests'>,
        { status: 'pending_payment' }
      );

      // Notify school admin with the rejection reason
      await ctx.db.insert('notifications', {
        title: 'Payment Rejected',
        message: `Your payment proof for ${subscriptionRequest.planName} has been rejected. Reason: ${args.reviewNotes}. Please resubmit with the correct details.`,
        type: 'error',
        timestamp: now,
        read: false,
        recipientId: subscriptionRequest.schoolAdminId,
        recipientRole: 'school_admin',
        actionUrl: '/school-admin/payment',
      });
    }

    return args.id;
  },
});
