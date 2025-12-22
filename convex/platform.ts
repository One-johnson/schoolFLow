import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all schools (super admin only)
export const getAllSchools = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    
    // Get user count for each school
    const schoolsWithStats = await Promise.all(
      schools.map(async (school) => {
        const userCount = await ctx.db
          .query("users")
          .withIndex("by_school", (q) => q.eq("schoolId", school._id))
          .collect();
        
        return {
          ...school,
          userCount: userCount.length,
        };
      })
    );
    
    return schoolsWithStats;
  },
});

// Get all users across all schools (super admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Get school info for each user
    const usersWithSchool = await Promise.all(
      users.map(async (user) => {
        const school = await ctx.db.get(user.schoolId);
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          schoolName: school?.name || "Unknown",
          schoolId: user.schoolId,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        };
      })
    );
    
    return usersWithSchool;
  },
});

// Get platform statistics (super admin only)
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    const users = await ctx.db.query("users").collect();
    const sessions = await ctx.db.query("sessions").collect();
    
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    // Active sessions (not expired)
    const activeSessions = sessions.filter(s => s.expiresAt > now);
    
    // Users created in last 7 days
    const newUsersThisWeek = users.filter(u => u.createdAt > oneWeekAgo);
    
    // Schools created in last 7 days
    const newSchoolsThisWeek = schools.filter(s => s.createdAt > oneWeekAgo);
    
    // Active schools
    const activeSchools = schools.filter(s => s.status === "active");
    
    // Users by role
    const usersByRole = users.reduce((acc: Record<string, number>, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Schools by subscription plan
    const schoolsByPlan = schools.reduce((acc: Record<string, number>, school) => {
      const plan = school.subscriptionPlan || "free";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalSchools: schools.length,
      activeSchools: activeSchools.length,
      totalUsers: users.length,
      activeSessions: activeSessions.length,
      newUsersThisWeek: newUsersThisWeek.length,
      newSchoolsThisWeek: newSchoolsThisWeek.length,
      usersByRole,
      schoolsByPlan,
    };
  },
});

// Update school status (super admin only)
export const updateSchoolStatus = mutation({
  args: {
    schoolId: v.id("schools"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.schoolId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update school subscription plan (super admin only)
export const updateSchoolPlan = mutation({
  args: {
    schoolId: v.id("schools"),
    plan: v.union(
      v.literal("free"),
      v.literal("basic"),
      v.literal("premium"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.schoolId, {
      subscriptionPlan: args.plan,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Get audit logs (super admin only)
export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // For now, we'll return session creation as audit logs
    // In a real app, you'd have a dedicated audit_logs table
    const sessions = await ctx.db.query("sessions")
      .order("desc")
      .take(limit);
    
    const logsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        const school = await ctx.db.get(session.schoolId);
        
        return {
          _id: session._id,
          action: "login",
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          userEmail: user?.email || "Unknown",
          schoolName: school?.name || "Unknown",
          timestamp: session.createdAt,
        };
      })
    );
    
    return logsWithDetails;
  },
});

// Get school details by ID
export const getSchoolById = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) return null;
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();
    
    return {
      ...school,
      userCount: users.length,
      users: users.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        status: u.status,
      })),
    };
  },
});
