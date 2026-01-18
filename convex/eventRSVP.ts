import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Query: Get RSVPs by event
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

// Query: Get RSVP stats
export const getRSVPStats = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args): Promise<{
    total: number;
    attending: number;
    notAttending: number;
    maybe: number;
    pending: number;
  }> => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .collect();

    return {
      total: rsvps.length,
      attending: rsvps.filter((r) => r.rsvpStatus === 'attending').length,
      notAttending: rsvps.filter((r) => r.rsvpStatus === 'not_attending').length,
      maybe: rsvps.filter((r) => r.rsvpStatus === 'maybe').length,
      pending: rsvps.filter((r) => r.rsvpStatus === 'pending').length,
    };
  },
});

// Query: Get my RSVPs
export const getMyRSVPs = query({
  args: {
    schoolId: v.string(),
    respondentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rsvps = await ctx.db
      .query('eventRSVPs')
      .withIndex('by_respondent', (q) => 
        q.eq('schoolId', args.schoolId).eq('respondentId', args.respondentId)
      )
      .collect();
    return rsvps;
  },
});

// Mutation: Submit RSVP
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
      v.literal('maybe')
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
    }

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
  },
});

// Mutation: Update RSVP
export const updateRSVP = mutation({
  args: {
    rsvpId: v.id('eventRSVPs'),
    rsvpStatus: v.union(
      v.literal('attending'),
      v.literal('not_attending'),
      v.literal('maybe')
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
