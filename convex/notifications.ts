import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .order("desc")
      .collect();
    return notifications;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      read: true,
    });
    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }
    return notifications.length;
  },
});
