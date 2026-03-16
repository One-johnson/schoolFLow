import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Query: Get all houses for a school
export const getHousesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const houses = await ctx.db
      .query('houses')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return houses.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  },
});

// Query: Get house by ID
export const getHouseById = query({
  args: { houseId: v.id('houses') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.houseId);
  },
});

// Mutation: Add house
export const addHouse = mutation({
  args: {
    schoolId: v.string(),
    name: v.string(),
    code: v.string(),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const code = args.code.trim().toUpperCase().slice(0, 6);
    if (code.length < 1) {
      throw new Error('House code must be at least 1 character');
    }

    const existing = await ctx.db
      .query('houses')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    if (existing.some((h) => h.name.toLowerCase() === args.name.trim().toLowerCase())) {
      throw new Error('A house with this name already exists');
    }

    if (existing.some((h) => h.code === code)) {
      throw new Error('A house with this code already exists');
    }

    return ctx.db.insert('houses', {
      schoolId: args.schoolId,
      name: args.name.trim(),
      code,
      color: args.color && /^#[0-9A-Fa-f]{6}$/.test(args.color) ? args.color : undefined,
      sortOrder: args.sortOrder ?? existing.length,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });
  },
});

// Mutation: Update house
export const updateHouse = mutation({
  args: {
    houseId: v.id('houses'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const house = await ctx.db.get(args.houseId);
    if (!house) throw new Error('House not found');

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.color !== undefined) {
      updates.color = args.color && /^#[0-9A-Fa-f]{6}$/.test(args.color) ? args.color : undefined;
    }
    if (args.code !== undefined) {
      const code = args.code.trim().toUpperCase().slice(0, 6);
      if (code.length < 1) throw new Error('House code must be at least 1 character');
      const existing = await ctx.db
        .query('houses')
        .withIndex('by_school', (q) => q.eq('schoolId', house.schoolId))
        .collect();
      if (existing.some((h) => h.code === code && h._id !== args.houseId)) {
        throw new Error('A house with this code already exists');
      }
      updates.code = code;
    }
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.houseId, updates);
    return args.houseId;
  },
});

// Mutation: Delete house
export const deleteHouse = mutation({
  args: {
    houseId: v.id('houses'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const house = await ctx.db.get(args.houseId);
    if (!house) throw new Error('House not found');

    // Clear houseId from students and teachers that reference this house
    const students = await ctx.db
      .query('students')
      .withIndex('by_house', (q) => q.eq('houseId', args.houseId))
      .collect();
    for (const s of students) {
      await ctx.db.patch(s._id, { houseId: undefined, updatedAt: new Date().toISOString() });
    }
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_house', (q) => q.eq('houseId', args.houseId))
      .collect();
    for (const t of teachers) {
      await ctx.db.patch(t._id, { houseId: undefined, updatedAt: new Date().toISOString() });
    }

    await ctx.db.delete(args.houseId);

    const now = new Date().toISOString();
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'House',
      entityId: args.houseId,
      details: `Deleted house: ${house.name} (${house.code})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
