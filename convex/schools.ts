import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    return schools;
  },
});

export const getById = query({
  args: { id: v.id('schools') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAdminId = query({
  args: { adminId: v.string() },
  handler: async (ctx, args) => {
    const school = await ctx.db
      .query('schools')
      .filter((q) => q.eq(q.field('adminId'), args.adminId))
      .first();
    return school;
  },
});

export const getBySchoolId = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const school = await ctx.db
      .query('schools')
      .withIndex('by_school_id', (q) => q.eq('schoolId', args.schoolId))
      .first();
    return school;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('schools'),
    status: v.union(
      v.literal('pending_payment'),
      v.literal('pending_approval'),
      v.literal('active'),
      v.literal('suspended')
    ),
    approvalDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, string> = {
      status: args.status,
    };

    if (args.approvalDate) {
      updates.approvalDate = args.approvalDate;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const suspendSchool = mutation({
  args: {
    id: v.id('schools'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.id);
    if (!school) throw new Error('School not found');

    // Update school status to suspended
    await ctx.db.patch(args.id, {
      status: 'suspended',
    });

    // Get school admin
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('schoolId'), school.adminId))
      .first();

    if (admin) {
      // Send notification to school admin
      await ctx.db.insert('notifications', {
        title: 'School Suspended',
        message: args.reason
          ? `Your school "${school.name}" has been suspended. Reason: ${args.reason}`
          : `Your school "${school.name}" has been suspended by an administrator. Please contact support for assistance.`,
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: admin._id,
        recipientRole: 'school_admin',
      });
    }

    return args.id;
  },
});

export const deleteSchool = mutation({
  args: {
    id: v.id('schools'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.id);
    if (!school) throw new Error('School not found');

    // Get school admin before deletion
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('schoolId'), school.adminId))
      .first();

    if (admin) {
      // Send notification before deletion
      await ctx.db.insert('notifications', {
        title: 'School Deleted',
        message: args.reason
          ? `Your school "${school.name}" has been deleted. Reason: ${args.reason}`
          : `Your school "${school.name}" has been deleted by an administrator.`,
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        recipientId: admin._id,
        recipientRole: 'school_admin',
      });

      // Update admin's hasCreatedSchool flag
      await ctx.db.patch(admin._id, {
        hasCreatedSchool: false,
      });

      // Cancel associated subscriptions
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

    // Delete the school
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const bulkSuspend = mutation({
  args: {
    ids: v.array(v.id('schools')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const school = await ctx.db.get(id);
      if (!school) continue;

      // Update school status
      await ctx.db.patch(id, {
        status: 'suspended',
      });

      // Get school admin
      const admin = await ctx.db
        .query('schoolAdmins')
        .filter((q) => q.eq(q.field('schoolId'), school.adminId))
        .first();

      if (admin) {
        // Send notification
        await ctx.db.insert('notifications', {
          title: 'School Suspended',
          message: args.reason
            ? `Your school "${school.name}" has been suspended. Reason: ${args.reason}`
            : `Your school "${school.name}" has been suspended by an administrator. Please contact support for assistance.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          read: false,
          recipientId: admin._id,
          recipientRole: 'school_admin',
        });
      }
    }

    return args.ids.length;
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id('schools')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const school = await ctx.db.get(id);
      if (!school) continue;

      // Get school admin
      const admin = await ctx.db
        .query('schoolAdmins')
        .filter((q) => q.eq(q.field('schoolId'), school.adminId))
        .first();

      if (admin) {
        // Send notification before deletion
        await ctx.db.insert('notifications', {
          title: 'School Deleted',
          message: args.reason
            ? `Your school "${school.name}" has been deleted. Reason: ${args.reason}`
            : `Your school "${school.name}" has been deleted by an administrator.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          read: false,
          recipientId: admin._id,
          recipientRole: 'school_admin',
        });

        // Update admin's flag
        await ctx.db.patch(admin._id, {
          hasCreatedSchool: false,
        });

        // Cancel subscriptions
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

      // Delete the school
      await ctx.db.delete(id);
    }

    return args.ids.length;
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    const admins = await ctx.db.query('schoolAdmins').collect();
    const subscriptions = await ctx.db.query('subscriptions').collect();

    return {
      totalSchools: schools.length,
      activeSchools: schools.filter((s) => s.status === 'active').length,
      pendingApproval: schools.filter((s) => s.status === 'pending_approval').length,
      totalStudents: 0, // No students enrolled yet - studentCount is subscription capacity, not actual enrollments
      totalRevenue: subscriptions.reduce((sum, s) => sum + (s.status === 'verified' ? s.totalAmount : 0), 0),
      monthlyRevenue: subscriptions
        .filter((s) => s.status === 'verified')
        .reduce((sum, s) => sum + s.totalAmount, 0),
      activeAdmins: admins.filter((a) => a.status === 'active').length,
      pendingPayments: subscriptions.filter((s) => s.status === 'pending').length,
    };
  },
});
