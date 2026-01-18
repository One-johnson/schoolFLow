import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Query: Get notifications by event
export const getNotificationsByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('eventNotifications')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();
    return notifications;
  },
});

// Query: Get my event notifications
export const getMyEventNotifications = query({
  args: {
    schoolId: v.string(),
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('eventNotifications')
      .withIndex('by_recipient', (q) => 
        q.eq('schoolId', args.schoolId).eq('recipientId', args.recipientId)
      )
      .collect();
    return notifications;
  },
});

// Mutation: Send event notification
export const sendEventNotification = mutation({
  args: {
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(),
    eventTitle: v.string(),
    recipientType: v.union(v.literal('student'), v.literal('parent'), v.literal('teacher'), v.literal('admin')),
    recipientId: v.string(),
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    notificationType: v.union(
      v.literal('event_created'),
      v.literal('event_updated'),
      v.literal('event_cancelled'),
      v.literal('rsvp_reminder'),
      v.literal('event_reminder')
    ),
    reminderType: v.optional(v.union(
      v.literal('1_day_before'),
      v.literal('3_hours_before'),
      v.literal('1_hour_before'),
      v.literal('start_time')
    )),
    deliveryMethod: v.union(v.literal('in_app'), v.literal('email'), v.literal('sms')),
  },
  handler: async (ctx, args): Promise<Id<'eventNotifications'>> => {
    const now = new Date().toISOString();

    const notificationId = await ctx.db.insert('eventNotifications', {
      schoolId: args.schoolId,
      eventId: args.eventId,
      eventCode: args.eventCode,
      eventTitle: args.eventTitle,
      recipientType: args.recipientType,
      recipientId: args.recipientId,
      recipientName: args.recipientName,
      recipientEmail: args.recipientEmail,
      recipientPhone: args.recipientPhone,
      notificationType: args.notificationType,
      reminderType: args.reminderType,
      deliveryMethod: args.deliveryMethod,
      deliveryStatus: 'pending',
      createdAt: now,
    });

    // Mark as sent immediately for in-app notifications
    if (args.deliveryMethod === 'in_app') {
      await ctx.db.patch(notificationId, {
        deliveryStatus: 'sent',
        sentAt: now,
      });
    }

    return notificationId;
  },
});

// Mutation: Bulk send notifications to school admins
export const sendBulkAdminNotifications = mutation({
  args: {
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(),
    eventTitle: v.string(),
    notificationType: v.union(
      v.literal('event_created'),
      v.literal('event_updated'),
      v.literal('event_cancelled'),
      v.literal('rsvp_reminder'),
      v.literal('event_reminder')
    ),
  },
  handler: async (ctx, args): Promise<number> => {
    const now = new Date().toISOString();

    // Get all school admins for this school
    const schoolAdmins = await ctx.db
      .query('schoolAdmins')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    let count = 0;
    for (const admin of schoolAdmins) {
      const notificationId = await ctx.db.insert('eventNotifications', {
        schoolId: args.schoolId,
        eventId: args.eventId,
        eventCode: args.eventCode,
        eventTitle: args.eventTitle,
        recipientType: 'admin',
        recipientId: admin._id.toString(),
        recipientName: admin.name,
        recipientEmail: admin.email,
        notificationType: args.notificationType,
        deliveryMethod: 'in_app',
        deliveryStatus: 'sent',
        sentAt: now,
        createdAt: now,
      });
      count++;
    }

    return count;
  },
});

// Mutation: Mark notification as read
export const markNotificationAsRead = mutation({
  args: { notificationId: v.id('eventNotifications') },
  handler: async (ctx, args): Promise<void> => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.notificationId, {
      readAt: now,
    });
  },
});
