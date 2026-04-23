import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const create = mutation({
  args: {
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    schoolName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    studentCount: v.number(),
    schoolType: v.optional(v.union(v.literal('private'), v.literal('public'))),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('schoolCreationRequests', {
      schoolAdminId: args.schoolAdminId,
      schoolAdminEmail: args.schoolAdminEmail,
      schoolName: args.schoolName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      studentCount: args.studentCount,
      schoolType: args.schoolType,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Create notification for super admin
    await ctx.db.insert('notifications', {
      title: 'New School Creation Request',
      message: `${args.schoolAdminEmail} has submitted a request to create school "${args.schoolName}".`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      recipientRole: 'super_admin',
      actionUrl: '/super-admin/schools',
    });

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'School Creation Request Submitted',
      message: 'Your school creation request has been submitted and is pending approval by the administrator.',
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
    const requests = await ctx.db
      .query('schoolCreationRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .order('desc')
      .collect();
    return requests;
  },
});

export const getByAdmin = query({
  args: { schoolAdminId: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query('schoolCreationRequests')
      .withIndex('by_admin', (q) => q.eq('schoolAdminId', args.schoolAdminId))
      .order('desc')
      .collect();
    return requests;
  },
});

export const approve = mutation({
  args: {
    id: v.id('schoolCreationRequests'),
    approvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error('School creation request not found');

    await ctx.db.patch(args.id, {
      status: 'approved',
      approvedBy: args.approvedBy,
      approvedAt: new Date().toISOString(),
    });

    const schoolType = (request.schoolType ?? 'private') as 'private' | 'public';
    const subscriptionRequest =
      schoolType === 'private'
        ? await ctx.db
            .query('subscriptionRequests')
            .withIndex('by_admin', (q) => q.eq('schoolAdminId', request.schoolAdminId))
            .filter((q) => q.eq(q.field('status'), 'approved'))
            .first()
        : null;

    // Use the school admin's existing school ID (set when super admin created them) — do not change it
    const admin = await ctx.db.get(request.schoolAdminId as Id<'schoolAdmins'>);
    if (!admin) throw new Error('School admin not found');
    if (!admin.schoolId) throw new Error('School admin has no school ID');

    // Create the school with the admin's existing school ID
    const schoolId = await ctx.db.insert('schools', {
      schoolId: admin.schoolId,
      name: request.schoolName,
      email: request.email,
      phone: request.phone,
      address: request.address,
      status: 'active',
      schoolType,
      adminId: request.schoolAdminId,
      adminName: request.schoolAdminEmail,
      studentCount: request.studentCount,
      subscriptionPlan:
        schoolType === 'public'
          ? 'Public'
          : subscriptionRequest?.planName || 'Trial',
      monthlyFee: schoolType === 'public' ? 0 : subscriptionRequest?.totalAmount || 0,
      registrationDate: new Date().toISOString(),
      approvalDate: new Date().toISOString(),
      paymentVerified: schoolType === 'public' ? false : true,
      paymentDate: schoolType === 'public' ? undefined : new Date().toISOString(),
    });

    // Mark that the admin has created their school (do not overwrite their schoolId)
    await ctx.db.patch(admin._id, {
      hasCreatedSchool: true,
    });

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'School Approved',
      message: `Your school "${request.schoolName}" has been approved. Welcome to SchoolFlow!`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: request.schoolAdminId,
      recipientRole: 'school_admin',
      actionUrl: '/school-admin',
    });

    return schoolId;
  },
});

export const reject = mutation({
  args: {
    id: v.id('schoolCreationRequests'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error('School creation request not found');

    await ctx.db.patch(args.id, {
      status: 'rejected',
      rejectionReason: args.reason,
    });

    // Create notification for school admin
    await ctx.db.insert('notifications', {
      title: 'School Request Rejected',
      message: `Your school creation request has been rejected. Reason: ${args.reason}`,
      type: 'error',
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: request.schoolAdminId,
      recipientRole: 'school_admin',
    });

    return args.id;
  },
});
