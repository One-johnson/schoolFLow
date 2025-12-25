import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all schools for super admin
export const getAllSchools = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();

    // Get user count for each school
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => {
        const users = await ctx.db
          .query("users")
          .withIndex("by_school", (q) => q.eq("schoolId", school._id))
          .collect();

        return {
          _id: school._id,
          name: school.name,
          email: school.email,
          userCount: users.length,
          subscriptionPlan: school.subscriptionPlan || "free",
          status: school.status,
          createdAt: school.createdAt,
        };
      })
    );

    return schoolsWithCounts;
  },
});

// Get detailed school information
export const getSchoolDetails = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // Get all users for this school
    const users = await ctx.db
      .query("users")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get students
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get teachers
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get classes
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get subjects
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get current subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .first();

    let subscriptionDetails = null;
    if (subscription) {
      const plan = await ctx.db.get(subscription.planId);
      subscriptionDetails = {
        ...subscription,
        planName: plan?.displayName || "Unknown",
        planPrice: plan?.price || 0,
      };
    }

    // Get subscription history
    const subscriptionHistory = await ctx.db
      .query("subscriptions")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const subscriptionHistoryWithDetails = await Promise.all(
      subscriptionHistory.map(async (sub) => {
        const plan = await ctx.db.get(sub.planId);
        return {
          ...sub,
          planName: plan?.displayName || "Unknown",
          planPrice: plan?.price || 0,
        };
      })
    );

    // Get payment history
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const recorder = await ctx.db.get(payment.recordedBy);
        return {
          ...payment,
          recorderName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
        };
      })
    );

    // Get admin user
    const admin = users.find((u) => u.role === "school_admin");

    // Calculate user statistics by role
    const usersByRole = users.reduce(
      (acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeUsers = users.filter(
      (u) => u.lastLogin && u.lastLogin > thirtyDaysAgo
    ).length;

    // Calculate student statistics
    const activeStudents = students.filter((s) => s.status === "fresher" || s.status === "continuing").length;
    const graduatedStudents = students.filter((s) => s.status === "graduated").length;

    // Calculate teacher statistics
    const activeTeachers = teachers.filter((t) => t.status === "active").length;
    const onLeaveTeachers = teachers.filter((t) => t.status === "on_leave").length;

    // Recent activity (last 10 users who logged in)
    const recentActivity = users
      .filter((u) => u.lastLogin)
      .sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0))
      .slice(0, 10)
      .map((u) => ({
        userId: u._id,
        userName: `${u.firstName} ${u.lastName}`,
        userEmail: u.email,
        userRole: u.role,
        action: "Login",
        timestamp: u.lastLogin || Date.now(),
      }));

    return {
      school,
      admin: admin
        ? {
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            phone: admin.phone,
            lastLogin: admin.lastLogin,
          }
        : null,
      statistics: {
        totalUsers: users.length,
        activeUsers,
        totalStudents: students.length,
        activeStudents,
        graduatedStudents,
        totalTeachers: teachers.length,
        activeTeachers,
        onLeaveTeachers,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        usersByRole,
      },
      subscription: subscriptionDetails,
      subscriptionHistory: subscriptionHistoryWithDetails,
      paymentHistory: paymentsWithDetails,
      recentActivity,
    };
  },
});

// Get all users across all schools
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const usersWithSchools = await Promise.all(
      users.map(async (user) => {
        const school = await ctx.db.get(user.schoolId!);

        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          schoolName: school?.name || "Unknown",
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin,
        };
      })
    );

    return usersWithSchools;
  },
});

// Get all school administrators
export const getSchoolAdmins = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "school_admin"))
      .collect();

    const adminsWithSchools = await Promise.all(
      users.map(async (user) => {
        const school = await ctx.db.get(user.schoolId!);

        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          schoolId: user.schoolId,
          schoolName: school?.name || "Unknown",
          schoolStatus: school?.status || "unknown",
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        };
      })
    );

    return adminsWithSchools;
  },
});

// Get platform statistics
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    const users = await ctx.db.query("users").collect();
    const sessions = await ctx.db.query("sessions").collect();

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activeSchools = schools.filter((s) => s.status === "active").length;
    const newSchoolsThisWeek = schools.filter((s) => s.createdAt > weekAgo).length;
    const newUsersThisWeek = users.filter((u) => u.createdAt > weekAgo).length;
    const activeSessions = sessions.filter((s) => s.expiresAt > now).length;

    const usersByRole = users.reduce(
      (acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const schoolsByPlan = schools.reduce(
      (acc: Record<string, number>, school) => {
        const plan = school.subscriptionPlan || "free";
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalSchools: schools.length,
      activeSchools,
      totalUsers: users.length,
      activeSessions,
      newSchoolsThisWeek,
      newUsersThisWeek,
      usersByRole,
      schoolsByPlan,
    };
  },
});

// Update school status
export const updateSchoolStatus = mutation({
  args: {
    schoolId: v.id("schools"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.schoolId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update school subscription plan
export const updateSchoolPlan = mutation({
  args: {
    schoolId: v.id("schools"),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.schoolId, {
      subscriptionPlan: args.plan,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get audit logs (placeholder - would need audit logs table)
export const getAuditLogs = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // For now, return login events from sessions
    const sessions = await ctx.db
      .query("sessions")
      .order("desc")
      .take(args.limit);

    const logs = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        const school = await ctx.db.get(session.schoolId!);

        return {
          _id: session._id,
          action: "login",
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email || "unknown@email.com",
          schoolName: school?.name || "Unknown",
          timestamp: session.createdAt,
        };
      })
    );

    return logs;
  },
});
