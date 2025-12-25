import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Query: Get all notifications for a user
export const getNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Query: Get unread notification count
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return notifications.length;
  },
});

// Mutation: Create a new notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      schoolId: args.schoolId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      isRead: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mutation: Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation: Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return { success: true, count: notifications.length };
  },
});

// Mutation: Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

// Mutation: Clear all notifications for a user
export const clearAllNotifications = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return { success: true, count: notifications.length };
  },
});

// Mutation: Bulk create notifications (for system-wide announcements)
export const bulkCreateNotifications = mutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    const notificationIds: Id<"notifications">[] = [];

    for (const userId of args.userIds) {
      const notificationId = await ctx.db.insert("notifications", {
        userId,
        schoolId: args.schoolId,
        type: args.type,
        title: args.title,
        message: args.message,
        link: args.link,
        isRead: false,
        createdAt: Date.now(),
      });
      notificationIds.push(notificationId);
    }

    return { success: true, count: notificationIds.length };
  },
});
