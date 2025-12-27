import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("subscriptions").collect();
    return subscriptions;
  },
});

export const getBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .first();
    return subscription;
  },
});

export const verifyPayment = mutation({
  args: {
    id: v.id("subscriptions"),
    verifiedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "verified",
      verifiedBy: args.verifiedBy,
      verifiedDate: new Date().toISOString(),
    });
    return args.id;
  },
});
