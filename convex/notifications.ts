import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query('notifications').order('desc').collect();
    return notifications;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal('info'), v.literal('warning'), v.literal('success'), v.literal('error')),
    recipientId: v.optional(v.string()),
    recipientRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('notifications', {
      title: args.title,
      message: args.message,
      type: args.type,
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: args.recipientId,
      recipientRole: args.recipientRole,
      actionUrl: args.actionUrl,
    });
    return id;
  },
});

export const markAsRead = mutation({
  args: { id: v.id('notifications') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      read: true,
    });
    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: { recipientId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query('notifications').filter((q) => q.eq(q.field('read'), false));
    
    if (args.recipientId) {
      query = query.filter((q) => q.eq(q.field('recipientId'), args.recipientId));
    }
    
    const notifications = await query.collect();
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }
    return notifications.length;
  },
});

export const deleteSingle = mutation({
  args: { id: v.id('notifications') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const deleteAll = mutation({
  args: { recipientId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query('notifications');
    
    if (args.recipientId) {
      query = query.filter((q) => q.eq(q.field('recipientId'), args.recipientId));
    }
    
    const notifications = await query.collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    return notifications.length;
  },
});

export const bulkDelete = mutation({
  args: { ids: v.array(v.id('notifications')) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return args.ids.length;
  },
});

// Query: Get notifications for a specific teacher
export const getNotificationsByTeacher = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .order('desc')
      .collect();
    return notifications.filter(
      (n) => n.recipientId === args.teacherId || n.recipientRole === 'teacher'
    );
  },
});

// Get unread notification count for a teacher
export const getTeacherUnreadCount = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    const teacherNotifications = notifications.filter(
      (n) => n.recipientId === args.teacherId || n.recipientRole === 'teacher'
    );

    return teacherNotifications.length;
  },
});

// Create notification for teacher
export const createTeacherNotification = mutation({
  args: {
    teacherId: v.string(),
    schoolId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal('info'), v.literal('warning'), v.literal('success'), v.literal('error')),
    actionUrl: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal('attendance'),
      v.literal('grades'),
      v.literal('message'),
      v.literal('event'),
      v.literal('announcement'),
      v.literal('system')
    )),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('notifications', {
      title: args.title,
      message: args.message,
      type: args.type,
      timestamp: new Date().toISOString(),
      read: false,
      recipientId: args.teacherId,
      recipientRole: 'teacher',
      actionUrl: args.actionUrl,
    });
    return id;
  },
});

// Mark all teacher notifications as read
export const markAllTeacherNotificationsAsRead = mutation({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    const teacherNotifications = notifications.filter(
      (n) => n.recipientId === args.teacherId || n.recipientRole === 'teacher'
    );

    for (const notification of teacherNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return teacherNotifications.length;
  },
});
