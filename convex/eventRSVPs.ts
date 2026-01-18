import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Query: Get all RSVPs for an event
export const getRSVPsByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();
    return rsvps;
  },
});

// Query: Get RSVP by respondent
export const getRSVPByRespondent = query({
  args: {
    eventId: v.id('events'),
    respondentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .filter((q) => q.eq(q.field('respondentId'), args.respondentId))
      .first();
    return rsvps;
  },
});

// Query: Get RSVP stats for an event
export const getRSVPStats = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args): Promise<{
    totalResponses: number;
    attending: number;
    notAttending: number;
    maybe: number;
    pending: number;
    totalGuests: number;
    responseRate: number;
  }> => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();

    const stats = {
      totalResponses: rsvps.length,
      attending: rsvps.filter((r) => r.rsvpStatus === 'attending').length,
      notAttending: rsvps.filter((r) => r.rsvpStatus === 'not_attending').length,
      maybe: rsvps.filter((r) => r.rsvpStatus === 'maybe').length,
      pending: rsvps.filter((r) => r.rsvpStatus === 'pending').length,
      totalGuests: rsvps.reduce((sum, r) => sum + (r.numberOfGuests || 0), 0),
      responseRate: 0,
    };

    // Calculate response rate (non-pending responses / total)
    const nonPending = stats.totalResponses - stats.pending;
    stats.responseRate = stats.totalResponses > 0 
      ? Math.round((nonPending / stats.totalResponses) * 100) 
      : 0;

    return stats;
  },
});

// Query: Get RSVPs by status
export const getRSVPsByStatus = query({
  args: {
    eventId: v.id('events'),
    status: v.union(
      v.literal('attending'),
      v.literal('not_attending'),
      v.literal('maybe'),
      v.literal('pending')
    ),
  },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_status', (q) => 
        q.eq('eventId', args.eventId).eq('rsvpStatus', args.status)
      )
      .collect();
    return rsvps;
  },
});

// Mutation: Create or update RSVP
export const submitRSVP = mutation({
  args: {
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(),
    eventTitle: v.string(),
    respondentType: v.union(v.literal('student'), v.literal('parent'), v.literal('teacher')),
    respondentId: v.string(),
    respondentName: v.string(),
    respondentEmail: v.optional(v.string()),
    rsvpStatus: v.union(
      v.literal('attending'),
      v.literal('not_attending'),
      v.literal('maybe'),
      v.literal('pending')
    ),
    numberOfGuests: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<'eventRSVPs'>> => {
    const now = new Date().toISOString();

    // Check if RSVP already exists
    const existingRSVP = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .filter((q) => q.eq(q.field('respondentId'), args.respondentId))
      .first();

    if (existingRSVP) {
      // Update existing RSVP
      await ctx.db.patch(existingRSVP._id, {
        rsvpStatus: args.rsvpStatus,
        numberOfGuests: args.numberOfGuests,
        notes: args.notes,
        respondedAt: now,
      });
      return existingRSVP._id;
    } else {
      // Create new RSVP
      const rsvpId = await ctx.db.insert('eventRSVPs', {
        schoolId: args.schoolId,
        eventId: args.eventId,
        eventCode: args.eventCode,
        eventTitle: args.eventTitle,
        respondentType: args.respondentType,
        respondentId: args.respondentId,
        respondentName: args.respondentName,
        respondentEmail: args.respondentEmail,
        rsvpStatus: args.rsvpStatus,
        numberOfGuests: args.numberOfGuests,
        notes: args.notes,
        respondedAt: now,
        createdAt: now,
      });
      return rsvpId;
    }
  },
});

// Mutation: Update RSVP status
export const updateRSVPStatus = mutation({
  args: {
    rsvpId: v.id('eventRSVPs'),
    rsvpStatus: v.union(
      v.literal('attending'),
      v.literal('not_attending'),
      v.literal('maybe'),
      v.literal('pending')
    ),
    numberOfGuests: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.rsvpId, {
      rsvpStatus: args.rsvpStatus,
      numberOfGuests: args.numberOfGuests,
      notes: args.notes,
      respondedAt: now,
    });
  },
});

// Mutation: Delete RSVP
export const deleteRSVP = mutation({
  args: { rsvpId: v.id('eventRSVPs') },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.delete(args.rsvpId);
  },
});

// Mutation: Bulk create RSVPs (for auto-generating pending RSVPs)
export const bulkCreateRSVPs = mutation({
  args: {
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(),
    eventTitle: v.string(),
    respondents: v.array(v.object({
      respondentType: v.union(v.literal('student'), v.literal('parent'), v.literal('teacher')),
      respondentId: v.string(),
      respondentName: v.string(),
      respondentEmail: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args): Promise<number> => {
    const now = new Date().toISOString();
    let created = 0;

    for (const respondent of args.respondents) {
      // Check if RSVP already exists
      const existing = await ctx.db
        .query('eventRSVPs')
        .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
        .filter((q) => q.eq(q.field('respondentId'), respondent.respondentId))
        .first();

      if (!existing) {
        await ctx.db.insert('eventRSVPs', {
          schoolId: args.schoolId,
          eventId: args.eventId,
          eventCode: args.eventCode,
          eventTitle: args.eventTitle,
          respondentType: respondent.respondentType,
          respondentId: respondent.respondentId,
          respondentName: respondent.respondentName,
          respondentEmail: respondent.respondentEmail,
          rsvpStatus: 'pending',
          createdAt: now,
        });
        created++;
      }
    }

    return created;
  },
});

// Query: Get respondents who haven't responded
export const getPendingRespondents = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_status', (q) => 
        q.eq('eventId', args.eventId).eq('rsvpStatus', 'pending')
      )
      .collect();
    return rsvps;
  },
});
