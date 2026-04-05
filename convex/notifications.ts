import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { scheduleWebPushForRecipient } from './webPush';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query('notifications').order('desc').collect();
    return notifications;
  },
});

// Notifications for super admin only (recipientRole === 'super_admin')
export const getNotificationsBySuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query('notifications').order('desc').collect();
    return notifications.filter((n) => n.recipientRole === 'super_admin');
  },
});

// Notifications for school admin (recipientRole === 'school_admin', with optional recipientId)
export const getNotificationsBySchoolAdmin = query({
  args: { recipientId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const notifications = await ctx.db.query('notifications').order('desc').collect();
    return notifications.filter(
      (n) =>
        n.recipientRole === 'school_admin' &&
        (!n.recipientId || (args.recipientId && n.recipientId === args.recipientId))
    );
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
    if (
      args.recipientRole === 'school_admin' &&
      args.recipientId &&
      args.recipientId.length > 0
    ) {
      await scheduleWebPushForRecipient(ctx, {
        recipientRole: 'school_admin',
        recipientId: args.recipientId,
        title: args.title,
        body: args.message,
        url: args.actionUrl ?? '/school-admin/notifications',
      });
    }
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
  args: {
    recipientId: v.optional(v.string()),
    recipientRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
  },
  handler: async (ctx, args) => {
    let notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    if (args.recipientRole) {
      notifications = notifications.filter((n) => n.recipientRole === args.recipientRole);
    }
    if (args.recipientId) {
      notifications = notifications.filter(
        (n) => !n.recipientId || n.recipientId === args.recipientId
      );
    }

    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { read: true });
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
  args: {
    recipientId: v.optional(v.string()),
    recipientRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
  },
  handler: async (ctx, args) => {
    let notifications = await ctx.db.query('notifications').collect();

    if (args.recipientRole) {
      notifications = notifications.filter((n) => n.recipientRole === args.recipientRole);
    }
    if (args.recipientId) {
      notifications = notifications.filter(
        (n) => !n.recipientId || n.recipientId === args.recipientId
      );
    }

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

// Clear all notifications (for reset/fix - new ones will be created as events occur)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query('notifications').collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }
    return notifications.length;
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
    await scheduleWebPushForRecipient(ctx, {
      recipientRole: 'teacher',
      recipientId: args.teacherId,
      title: args.title,
      body: args.message,
      url: args.actionUrl ?? '/teacher/notifications',
    });
    return id;
  },
});

// Query: Get notifications for a specific parent
export const getNotificationsByParent = query({
  args: { parentId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .order('desc')
      .collect();
    return notifications.filter(
      (n) =>
        (n.recipientRole === 'parent' && (!n.recipientId || n.recipientId === args.parentId))
    );
  },
});

// Query: In-app notifications for a student (homework, etc.)
export const getNotificationsByStudent = query({
  args: { studentId: v.id('students'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const sid = args.studentId as string;
    const limit = args.limit ?? 80;
    const notifications = await ctx.db
      .query('notifications')
      .order('desc')
      .collect();
    return notifications
      .filter((n) => n.recipientRole === 'student' && n.recipientId === sid)
      .slice(0, limit);
  },
});

export const getStudentUnreadNotificationCount = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    const sid = args.studentId as string;
    const notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('read'), false))
      .collect();
    return notifications.filter(
      (n) => n.recipientRole === 'student' && n.recipientId === sid
    ).length;
  },
});

export const markStudentNotificationAsRead = mutation({
  args: { id: v.id('notifications'), studentId: v.id('students') },
  handler: async (ctx, args) => {
    const n = await ctx.db.get(args.id);
    const sid = args.studentId as string;
    if (
      !n ||
      n.recipientRole !== 'student' ||
      n.recipientId !== sid
    ) {
      throw new Error('Unauthorized');
    }
    await ctx.db.patch(args.id, { read: true });
    return args.id;
  },
});

export const markAllStudentNotificationsAsRead = mutation({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    const sid = args.studentId as string;
    const notifications = await ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('read'), false))
      .collect();
    let n = 0;
    for (const row of notifications) {
      if (row.recipientRole === 'student' && row.recipientId === sid) {
        await ctx.db.patch(row._id, { read: true });
        n++;
      }
    }
    return n;
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
