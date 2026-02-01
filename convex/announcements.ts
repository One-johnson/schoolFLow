import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin and return their schoolId
async function getVerifiedSchoolId(ctx: MutationCtx, adminId: string): Promise<string> {
  const admin = await ctx.db.get(adminId as Id<'schoolAdmins'>);
  if (!admin) {
    throw new Error('Unauthorized: Admin not found');
  }
  return admin.schoolId;
}

// Query: Get announcements by school, optionally filtered by status
export const getBySchool = query({
  args: {
    schoolId: v.string(),
    status: v.optional(v.union(v.literal('draft'), v.literal('published'), v.literal('archived'))),
  },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query('announcements')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const filtered = args.status
      ? announcements.filter((a) => a.status === args.status)
      : announcements;

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

// Query: Get announcement by ID
export const getById = query({
  args: { id: v.id('announcements') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation: Create a new announcement (as draft)
export const create = mutation({
  args: {
    schoolId: v.string(),
    title: v.string(),
    content: v.string(),
    targetType: v.union(v.literal('school'), v.literal('class'), v.literal('department'), v.literal('teachers')),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    const id = await ctx.db.insert('announcements', {
      schoolId: args.schoolId,
      title: args.title,
      content: args.content,
      targetType: args.targetType,
      targetId: args.targetId,
      targetName: args.targetName,
      status: 'draft',
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.createdBy,
      userName: 'School Admin',
      action: 'CREATE',
      entity: 'Announcement',
      entityId: id,
      details: `Created announcement: ${args.title} (target: ${args.targetType})`,
      ipAddress: '0.0.0.0',
    });

    return id;
  },
});

// Mutation: Update an announcement (draft only)
export const update = mutation({
  args: {
    id: v.id('announcements'),
    title: v.string(),
    content: v.string(),
    targetType: v.union(v.literal('school'), v.literal('class'), v.literal('department'), v.literal('teachers')),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'draft') {
      throw new Error('Only draft announcements can be edited');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      targetType: args.targetType,
      targetId: args.targetId,
      targetName: args.targetName,
      updatedAt: now,
    });

    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Updated announcement: ${args.title}`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Publish an announcement (draft → published)
export const publish = mutation({
  args: {
    id: v.id('announcements'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'draft') {
      throw new Error('Only draft announcements can be published');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Published announcement: ${announcement.title}`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Archive an announcement (published → archived)
export const archive = mutation({
  args: {
    id: v.id('announcements'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'published') {
      throw new Error('Only published announcements can be archived');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      status: 'archived',
      updatedAt: now,
    });

    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Archived announcement: ${announcement.title}`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete an announcement (draft only)
export const deleteSingle = mutation({
  args: {
    id: v.id('announcements'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'draft') {
      throw new Error('Only draft announcements can be deleted');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    await ctx.db.delete(args.id);

    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Deleted draft announcement: ${announcement.title}`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
