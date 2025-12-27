import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    return schools;
  },
});

export const getById = query({
  args: { id: v.id("schools") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("schools"),
    status: v.union(
      v.literal("pending_payment"),
      v.literal("pending_approval"),
      v.literal("active"),
      v.literal("suspended")
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

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    const admins = await ctx.db.query("schoolAdmins").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();

    return {
      totalSchools: schools.length,
      activeSchools: schools.filter((s) => s.status === "active").length,
      pendingApproval: schools.filter((s) => s.status === "pending_approval")
        .length,
      totalStudents: schools.reduce((sum, s) => sum + s.studentCount, 0),
      totalRevenue: subscriptions.reduce(
        (sum, s) => sum + (s.status === "verified" ? s.totalAmount : 0),
        0
      ),
      monthlyRevenue: subscriptions
        .filter((s) => s.status === "verified")
        .reduce((sum, s) => sum + s.totalAmount, 0),
      activeAdmins: admins.filter((a) => a.status === "active").length,
      pendingPayments: subscriptions.filter((s) => s.status === "pending")
        .length,
    };
  },
});
