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

export const updateSchoolInfo = mutation({
  args: {
    id: v.id('schools'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, string> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.email !== undefined) {
      updates.email = args.email;
    }
    if (args.phone !== undefined) {
      updates.phone = args.phone;
    }
    if (args.address !== undefined) {
      updates.address = args.address;
    }

    if (Object.keys(updates).length === 0) {
      return args.id;
    }

    await ctx.db.patch(args.id, updates);
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

type SchoolKind = 'private' | 'public';

function effectiveSchoolType(school: { schoolType?: SchoolKind }): SchoolKind {
  return school.schoolType ?? 'private';
}

function emptyBySchoolTypeStats() {
  return {
    totalSchools: 0,
    activeSchools: 0,
    pendingApproval: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeAdmins: 0,
  };
}

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    const admins = await ctx.db.query('schoolAdmins').collect();
    const subscriptions = await ctx.db.query('subscriptions').collect();

    const schoolTypeBySchoolId = new Map(
      schools.map((s) => [s.schoolId, effectiveSchoolType(s)] as const)
    );

    const activeSchoolsList = schools.filter((s) => s.status === 'active');
    const totalStudents = activeSchoolsList.reduce((sum, s) => sum + s.studentCount, 0);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const bySchoolType = {
      private: emptyBySchoolTypeStats(),
      public: emptyBySchoolTypeStats(),
    } satisfies Record<SchoolKind, ReturnType<typeof emptyBySchoolTypeStats>>;

    for (const s of schools) {
      const t = effectiveSchoolType(s);
      bySchoolType[t].totalSchools++;
      if (s.status === 'active') {
        bySchoolType[t].activeSchools++;
        bySchoolType[t].totalStudents += s.studentCount;
      }
      if (s.status === 'pending_approval') {
        bySchoolType[t].pendingApproval++;
      }
    }

    for (const a of admins) {
      if (a.status !== 'active') continue;
      const school = schools.find((sch) => sch.schoolId === a.schoolId);
      const t = school ? effectiveSchoolType(school) : 'private';
      bySchoolType[t].activeAdmins++;
    }

    const monthlyRevenue = subscriptions
      .filter((s) => s.status === 'verified')
      .reduce((sum, s) => {
        const dateStr = s.verifiedDate ?? s.paymentDate;
        if (!dateStr) return sum;
        const d = new Date(dateStr);
        if (d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth) return sum + (s.totalAmount ?? 0);
        return sum;
      }, 0);

    for (const sub of subscriptions) {
      const t = schoolTypeBySchoolId.get(sub.schoolId) ?? 'private';
      if (sub.status === 'verified') {
        bySchoolType[t].totalRevenue += sub.totalAmount ?? 0;
        const dateStr = sub.verifiedDate ?? sub.paymentDate;
        if (dateStr) {
          const d = new Date(dateStr);
          if (d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth) {
            bySchoolType[t].monthlyRevenue += sub.totalAmount ?? 0;
          }
        }
      }
      if (sub.status === 'pending') {
        bySchoolType[t].pendingPayments++;
      }
    }

    return {
      totalSchools: schools.length,
      activeSchools: activeSchoolsList.length,
      pendingApproval: schools.filter((s) => s.status === 'pending_approval').length,
      totalStudents,
      totalRevenue: subscriptions.reduce((sum, s) => sum + (s.status === 'verified' ? s.totalAmount : 0), 0),
      monthlyRevenue,
      activeAdmins: admins.filter((a) => a.status === 'active').length,
      pendingPayments: subscriptions.filter((s) => s.status === 'pending').length,
      bySchoolType,
    };
  },
});

/** Last 12 months in YYYY-MM format, most recent first */
function last12MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys.reverse();
}

/** Format YYYY-MM as short label e.g. "Jan 25" */
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export const getDashboardChartData = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query('schools').collect();
    const subscriptions = await ctx.db.query('subscriptions').collect();
    const months = last12MonthKeys();

    const schoolTypeBySchoolId = new Map(
      schools.map((s) => [s.schoolId, effectiveSchoolType(s)] as const)
    );

    const revenueByMonth = months.map((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      let revenuePrivate = 0;
      let revenuePublic = 0;
      for (const s of subscriptions) {
        if (s.status !== 'verified') continue;
        const dateStr = s.verifiedDate ?? s.paymentDate;
        if (!dateStr) continue;
        const d = new Date(dateStr);
        if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
        const amt = s.totalAmount ?? 0;
        const t = schoolTypeBySchoolId.get(s.schoolId) ?? 'private';
        if (t === 'public') revenuePublic += amt;
        else revenuePrivate += amt;
      }
      const revenue = revenuePrivate + revenuePublic;
      return {
        month: monthLabel(monthKey),
        monthKey,
        revenue,
        revenuePrivate,
        revenuePublic,
      };
    });

    const schoolGrowthByMonth = months.map((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const newSchools = schools.filter((s) => {
        const d = new Date(s.registrationDate);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      const activePrivate = newSchools.filter(
        (s) => s.status === 'active' && effectiveSchoolType(s) === 'private'
      ).length;
      const activePublic = newSchools.filter(
        (s) => s.status === 'active' && effectiveSchoolType(s) === 'public'
      ).length;
      const pendingPrivate = newSchools.filter(
        (s) =>
          (s.status === 'pending_approval' || s.status === 'pending_payment') &&
          effectiveSchoolType(s) === 'private'
      ).length;
      const pendingPublic = newSchools.filter(
        (s) =>
          (s.status === 'pending_approval' || s.status === 'pending_payment') &&
          effectiveSchoolType(s) === 'public'
      ).length;
      const active = activePrivate + activePublic;
      const pending = pendingPrivate + pendingPublic;
      return {
        month: monthLabel(monthKey),
        monthKey,
        active,
        pending,
        activePrivate,
        activePublic,
        pendingPrivate,
        pendingPublic,
        newSchools: newSchools.length,
      };
    });

    const platformSettings = await ctx.db.query('platformSettings').order('desc').first();
    const enrollmentTarget = platformSettings?.monthlyEnrollmentTarget ?? 0;

    const enrollmentByMonth = months.map((monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const endOfMonth = new Date(year, month, 0);
      const activeAtMonth = schools.filter(
        (s) => s.status === 'active' && new Date(s.registrationDate) <= endOfMonth
      );
      const enrolledPrivate = activeAtMonth
        .filter((s) => effectiveSchoolType(s) === 'private')
        .reduce((sum, s) => sum + s.studentCount, 0);
      const enrolledPublic = activeAtMonth
        .filter((s) => effectiveSchoolType(s) === 'public')
        .reduce((sum, s) => sum + s.studentCount, 0);
      const enrolled = enrolledPrivate + enrolledPublic;
      return {
        month: monthLabel(monthKey),
        monthKey,
        enrolled,
        enrolledPrivate,
        enrolledPublic,
        target: enrollmentTarget,
      };
    });

    return {
      revenueByMonth,
      schoolGrowthByMonth,
      enrollmentByMonth,
    };
  },
});
