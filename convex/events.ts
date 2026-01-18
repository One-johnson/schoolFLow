import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate random event code
function generateEventCode(): string {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `EVT${randomNum}`;
}

// Get default color based on event type
function getDefaultColor(eventType: string): string {
  const colors: Record<string, string> = {
    holiday: '#10b981', // Green
    exam: '#ef4444', // Red
    sports: '#3b82f6', // Blue
    parent_meeting: '#f59e0b', // Amber
    assembly: '#8b5cf6', // Purple
    cultural: '#ec4899', // Pink
    field_trip: '#06b6d4', // Cyan
    workshop: '#84cc16', // Lime
    other: '#6b7280', // Gray
  };
  return colors[eventType] || colors.other;
}

// Query: Get all events by school
export const getEventsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args): Promise<Array<{
    _id: Id<'events'>;
    _creationTime: number;
    schoolId: string;
    eventCode: string;
    eventTitle: string;
    eventDescription?: string;
    eventType: 'holiday' | 'exam' | 'sports' | 'parent_meeting' | 'assembly' | 'cultural' | 'field_trip' | 'workshop' | 'other';
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    location?: string;
    venueType: 'on_campus' | 'off_campus' | 'virtual';
    audienceType: 'all_school' | 'specific_classes' | 'specific_departments' | 'staff_only' | 'custom';
    targetClasses?: string[];
    targetDepartments?: Array<'creche' | 'kindergarten' | 'primary' | 'junior_high'>;
    isRecurring: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'termly' | 'yearly';
    recurrenceEndDate?: string;
    recurrenceDays?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
    parentEventId?: string;
    sendNotification: boolean;
    requiresRSVP: boolean;
    rsvpDeadline?: string;
    maxAttendees?: number;
    color?: string;
    academicYearId?: string;
    termId?: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    cancellationReason?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy?: string;
  }>> => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    return events;
  },
});

// Query: Get event by ID
export const getEventById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

// Query: Get upcoming events
export const getUpcomingEvents = query({
  args: { 
    schoolId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const events = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => 
        q.and(
          q.gte(q.field('startDate'), now),
          q.eq(q.field('status'), 'upcoming')
        )
      )
      .order('asc')
      .take(args.limit || 10);
    return events;
  },
});

// Query: Get events by date range
export const getEventsByDateRange = query({
  args: {
    schoolId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.gte(q.field('startDate'), args.startDate),
          q.lte(q.field('endDate'), args.endDate)
        )
      )
      .collect();
    return events;
  },
});

// Query: Get events by type
export const getEventsByType = query({
  args: {
    schoolId: v.string(),
    eventType: v.union(
      v.literal('holiday'),
      v.literal('exam'),
      v.literal('sports'),
      v.literal('parent_meeting'),
      v.literal('assembly'),
      v.literal('cultural'),
      v.literal('field_trip'),
      v.literal('workshop'),
      v.literal('other')
    ),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_type', (q) => 
        q.eq('schoolId', args.schoolId).eq('eventType', args.eventType)
      )
      .collect();
    return events;
  },
});

// Query: Get event stats
export const getEventStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    eventsByType: Record<string, number>;
  }> => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const stats = {
      totalEvents: events.length,
      upcomingEvents: events.filter((e) => e.status === 'upcoming').length,
      ongoingEvents: events.filter((e) => e.status === 'ongoing').length,
      completedEvents: events.filter((e) => e.status === 'completed').length,
      cancelledEvents: events.filter((e) => e.status === 'cancelled').length,
      eventsByType: events.reduce((acc: Record<string, number>, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  },
});

// Mutation: Create event
export const createEvent = mutation({
  args: {
    schoolId: v.string(),
    eventTitle: v.string(),
    eventDescription: v.optional(v.string()),
    eventType: v.union(
      v.literal('holiday'),
      v.literal('exam'),
      v.literal('sports'),
      v.literal('parent_meeting'),
      v.literal('assembly'),
      v.literal('cultural'),
      v.literal('field_trip'),
      v.literal('workshop'),
      v.literal('other')
    ),
    startDate: v.string(),
    endDate: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    venueType: v.union(v.literal('on_campus'), v.literal('off_campus'), v.literal('virtual')),
    audienceType: v.union(
      v.literal('all_school'),
      v.literal('specific_classes'),
      v.literal('specific_departments'),
      v.literal('staff_only'),
      v.literal('custom')
    ),
    targetClasses: v.optional(v.array(v.string())),
    targetDepartments: v.optional(v.array(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    ))),
    isRecurring: v.boolean(),
    recurrencePattern: v.optional(v.union(
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('monthly'),
      v.literal('termly'),
      v.literal('yearly')
    )),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceDays: v.optional(v.array(v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday'),
      v.literal('saturday'),
      v.literal('sunday')
    ))),
    sendNotification: v.boolean(),
    requiresRSVP: v.boolean(),
    rsvpDeadline: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    color: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'events'>> => {
    const eventCode = generateEventCode();
    const now = new Date().toISOString();
    const color = args.color || getDefaultColor(args.eventType);

    const eventId = await ctx.db.insert('events', {
      schoolId: args.schoolId,
      eventCode,
      eventTitle: args.eventTitle,
      eventDescription: args.eventDescription,
      eventType: args.eventType,
      startDate: args.startDate,
      endDate: args.endDate,
      startTime: args.startTime,
      endTime: args.endTime,
      isAllDay: args.isAllDay,
      location: args.location,
      venueType: args.venueType,
      audienceType: args.audienceType,
      targetClasses: args.targetClasses,
      targetDepartments: args.targetDepartments,
      isRecurring: args.isRecurring,
      recurrencePattern: args.recurrencePattern,
      recurrenceEndDate: args.recurrenceEndDate,
      recurrenceDays: args.recurrenceDays,
      sendNotification: args.sendNotification,
      requiresRSVP: args.requiresRSVP,
      rsvpDeadline: args.rsvpDeadline,
      maxAttendees: args.maxAttendees,
      color,
      academicYearId: args.academicYearId,
      termId: args.termId,
      status: 'upcoming',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Send notifications if requested
    if (args.sendNotification) {
      console.log('[EVENT CREATE] Sending notifications for event:', eventId);
      console.log('[EVENT CREATE] School ID:', args.schoolId);
      
      // First, check all admins for this school (without status filter)
      const allSchoolAdmins = await ctx.db
        .query('schoolAdmins')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .collect();
      
      console.log('[EVENT CREATE] Total admins for school:', allSchoolAdmins.length);
      if (allSchoolAdmins.length > 0) {
        console.log('[EVENT CREATE] Admin statuses:', allSchoolAdmins.map(a => ({ name: a.name, status: a.status })));
      }
      
      // Get all school admins with active status
      const schoolAdmins = await ctx.db
        .query('schoolAdmins')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .filter((q) => q.eq(q.field('status'), 'active'))
        .collect();

      console.log('[EVENT CREATE] Active admins found:', schoolAdmins.length);

      if (schoolAdmins.length === 0) {
        console.warn('[EVENT CREATE] No active school admins found. Attempting to notify all admins regardless of status.');
        // Fall back to notifying all admins if no active ones found
        for (const admin of allSchoolAdmins) {
          try {
            console.log('[EVENT CREATE] Creating notification for admin (fallback):', admin.name, admin._id, 'status:', admin.status);
            const notificationId = await ctx.db.insert('eventNotifications', {
              schoolId: args.schoolId,
              eventId: eventId,
              eventCode: eventCode,
              eventTitle: args.eventTitle,
              recipientType: 'admin',
              recipientId: admin._id.toString(),
              recipientName: admin.name,
              recipientEmail: admin.email,
              notificationType: 'event_created',
              deliveryMethod: 'in_app',
              deliveryStatus: 'sent',
              sentAt: now,
              createdAt: now,
            });
            console.log('[EVENT CREATE] Notification created (fallback):', notificationId);
          } catch (error) {
            console.error('[EVENT CREATE] Failed to create notification for admin (fallback):', admin.name, error);
          }
        }
      } else {
        // Send notification to each active admin
        for (const admin of schoolAdmins) {
          try {
            console.log('[EVENT CREATE] Creating notification for active admin:', admin.name, admin._id);
            const notificationId = await ctx.db.insert('eventNotifications', {
              schoolId: args.schoolId,
              eventId: eventId,
              eventCode: eventCode,
              eventTitle: args.eventTitle,
              recipientType: 'admin',
              recipientId: admin._id.toString(),
              recipientName: admin.name,
              recipientEmail: admin.email,
              notificationType: 'event_created',
              deliveryMethod: 'in_app',
              deliveryStatus: 'sent',
              sentAt: now,
              createdAt: now,
            });
            console.log('[EVENT CREATE] Notification created:', notificationId);
          } catch (error) {
            console.error('[EVENT CREATE] Failed to create notification for admin:', admin.name, error);
          }
        }
      }
    } else {
      console.log('[EVENT CREATE] Notifications disabled for this event');
    }

    return eventId;
  },
});

// Mutation: Update event
export const updateEvent = mutation({
  args: {
    eventId: v.id('events'),
    eventTitle: v.optional(v.string()),
    eventDescription: v.optional(v.string()),
    eventType: v.optional(v.union(
      v.literal('holiday'),
      v.literal('exam'),
      v.literal('sports'),
      v.literal('parent_meeting'),
      v.literal('assembly'),
      v.literal('cultural'),
      v.literal('field_trip'),
      v.literal('workshop'),
      v.literal('other')
    )),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isAllDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    venueType: v.optional(v.union(v.literal('on_campus'), v.literal('off_campus'), v.literal('virtual'))),
    audienceType: v.optional(v.union(
      v.literal('all_school'),
      v.literal('specific_classes'),
      v.literal('specific_departments'),
      v.literal('staff_only'),
      v.literal('custom')
    )),
    targetClasses: v.optional(v.array(v.string())),
    targetDepartments: v.optional(v.array(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    ))),
    requiresRSVP: v.optional(v.boolean()),
    rsvpDeadline: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    color: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('upcoming'),
      v.literal('ongoing'),
      v.literal('completed'),
      v.literal('cancelled')
    )),
    lastModifiedBy: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updatedAt: now,
      lastModifiedBy: args.lastModifiedBy,
    };

    // Get the event before updating
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error('Event not found');

    // Only include fields that are provided
    if (args.eventTitle !== undefined) updates.eventTitle = args.eventTitle;
    if (args.eventDescription !== undefined) updates.eventDescription = args.eventDescription;
    if (args.eventType !== undefined) updates.eventType = args.eventType;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.isAllDay !== undefined) updates.isAllDay = args.isAllDay;
    if (args.location !== undefined) updates.location = args.location;
    if (args.venueType !== undefined) updates.venueType = args.venueType;
    if (args.audienceType !== undefined) updates.audienceType = args.audienceType;
    if (args.targetClasses !== undefined) updates.targetClasses = args.targetClasses;
    if (args.targetDepartments !== undefined) updates.targetDepartments = args.targetDepartments;
    if (args.requiresRSVP !== undefined) updates.requiresRSVP = args.requiresRSVP;
    if (args.rsvpDeadline !== undefined) updates.rsvpDeadline = args.rsvpDeadline;
    if (args.maxAttendees !== undefined) updates.maxAttendees = args.maxAttendees;
    if (args.color !== undefined) updates.color = args.color;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.eventId, updates);

    // Send update notifications to school admins
    console.log('[EVENT UPDATE] Sending update notifications for event:', args.eventId);
    const schoolAdmins = await ctx.db
      .query('schoolAdmins')
      .withIndex('by_school', (q) => q.eq('schoolId', event.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    console.log('[EVENT UPDATE] Found admins:', schoolAdmins.length);

    for (const admin of schoolAdmins) {
      try {
        const notificationId = await ctx.db.insert('eventNotifications', {
          schoolId: event.schoolId,
          eventId: args.eventId,
          eventCode: event.eventCode,
          eventTitle: args.eventTitle || event.eventTitle,
          recipientType: 'admin',
          recipientId: admin._id.toString(),
          recipientName: admin.name,
          recipientEmail: admin.email,
          notificationType: 'event_updated',
          deliveryMethod: 'in_app',
          deliveryStatus: 'sent',
          sentAt: now,
          createdAt: now,
        });
        console.log('[EVENT UPDATE] Notification created:', notificationId);
      } catch (error) {
        console.error('[EVENT UPDATE] Failed to create notification:', error);
      }
    }
  },
});

// Mutation: Delete event
export const deleteEvent = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args): Promise<void> => {
    // Delete associated RSVPs
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();
    
    for (const rsvp of rsvps) {
      await ctx.db.delete(rsvp._id);
    }

    // Delete associated notifications
    const notifications = await ctx.db
      .query('eventNotifications')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);
  },
});

// Mutation: Cancel event
export const cancelEvent = mutation({
  args: {
    eventId: v.id('events'),
    cancellationReason: v.string(),
    lastModifiedBy: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = new Date().toISOString();
    
    // Get the event before cancelling
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error('Event not found');

    await ctx.db.patch(args.eventId, {
      status: 'cancelled',
      cancellationReason: args.cancellationReason,
      updatedAt: now,
      lastModifiedBy: args.lastModifiedBy,
    });

    // Send cancellation notifications to school admins
    console.log('[EVENT CANCEL] Sending cancellation notifications for event:', args.eventId);
    const schoolAdmins = await ctx.db
      .query('schoolAdmins')
      .withIndex('by_school', (q) => q.eq('schoolId', event.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    console.log('[EVENT CANCEL] Found admins:', schoolAdmins.length);

    for (const admin of schoolAdmins) {
      try {
        const notificationId = await ctx.db.insert('eventNotifications', {
          schoolId: event.schoolId,
          eventId: args.eventId,
          eventCode: event.eventCode,
          eventTitle: event.eventTitle,
          recipientType: 'admin',
          recipientId: admin._id.toString(),
          recipientName: admin.name,
          recipientEmail: admin.email,
          notificationType: 'event_cancelled',
          deliveryMethod: 'in_app',
          deliveryStatus: 'sent',
          sentAt: now,
          createdAt: now,
        });
        console.log('[EVENT CANCEL] Notification created:', notificationId);
      } catch (error) {
        console.error('[EVENT CANCEL] Failed to create notification:', error);
      }
    }
  },
});

// Mutation: Duplicate event
export const duplicateEvent = mutation({
  args: {
    eventId: v.id('events'),
    newStartDate: v.string(),
    newEndDate: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'events'>> => {
    const originalEvent = await ctx.db.get(args.eventId);
    if (!originalEvent) {
      throw new Error('Event not found');
    }

    const eventCode = generateEventCode();
    const now = new Date().toISOString();

    const newEventId = await ctx.db.insert('events', {
      ...originalEvent,
      eventCode,
      startDate: args.newStartDate,
      endDate: args.newEndDate,
      status: 'upcoming',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
      lastModifiedBy: undefined,
      cancellationReason: undefined,
    });

    return newEventId;
  },
});
