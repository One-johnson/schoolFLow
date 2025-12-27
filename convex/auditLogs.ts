import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLogs").order("desc").collect();
    return logs;
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    details: v.string(),
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("auditLogs", {
      timestamp: new Date().toISOString(),
      userId: args.userId,
      userName: args.userName,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      details: args.details,
      ipAddress: args.ipAddress,
    });

    return id;
  },
});
