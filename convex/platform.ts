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

// Get all users across all schools
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const usersWithSchools = await Promise.all(
      users.map(async (user) => {
        const school = await ctx.db.get(user.schoolId);

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
        const school = await ctx.db.get(session.schoolId);

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
