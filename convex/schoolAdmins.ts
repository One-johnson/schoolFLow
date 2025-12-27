import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query('schoolAdmins').collect();
    return admins;
  },
});

export const getById = query({
  args: { id: v.id('schoolAdmins') },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    return admin;
  },
});

export const getBySchoolId = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query('schoolAdmins')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .first();
    return admin;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    schoolId: v.string(),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
    invitedBy: v.string(),
    tempPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('schoolAdmins', {
      name: args.name,
      email: args.email,
      schoolId: args.schoolId,
      status: args.status,
      createdAt: new Date().toISOString(),
      invitedBy: args.invitedBy,
      tempPassword: args.tempPassword,
    });

    return id;
  },
});

export const bulkCreate = mutation({
  args: {
    admins: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        schoolId: v.string(),
        status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
        invitedBy: v.string(),
        tempPassword: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const admin of args.admins) {
      const id = await ctx.db.insert('schoolAdmins', {
        ...admin,
        createdAt: new Date().toISOString(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id('schoolAdmins'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended'))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const bulkUpdate = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id('schoolAdmins'),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended'))),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const { id, ...fields } = update;
      await ctx.db.patch(id, fields);
    }
    return args.updates.length;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('schoolAdmins'),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id('schoolAdmins') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id('schoolAdmins')),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return args.ids.length;
  },
});
