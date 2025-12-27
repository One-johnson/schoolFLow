import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("schoolAdmins").collect();
    return admins;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    schoolId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending")
    ),
    invitedBy: v.string(),
    tempPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("schoolAdmins", {
      name: args.name,
      email: args.email,
      schoolId: args.schoolId,
      status: args.status,
      createdAt: new Date().toISOString(),
      invitedBy: args.invitedBy,
      tempPassword: args.tempPassword,
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("schoolAdmins"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
    });
    return args.id;
  },
});
