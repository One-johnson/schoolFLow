import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin and return their schoolId.
// adminIdOrEmail may be a Convex document Id (from session) or email (from useAuth).
async function getVerifiedSchoolId(ctx: MutationCtx, adminIdOrEmail: string): Promise<string> {
  if (adminIdOrEmail.length === 32 && /^[a-zA-Z0-9_-]+$/.test(adminIdOrEmail)) {
    const adminById = await ctx.db.get(adminIdOrEmail as Id<'schoolAdmins'>);
    if (adminById) return adminById.schoolId;
  }
  const adminByEmail = await ctx.db
    .query('schoolAdmins')
    .withIndex('by_email', (q) => q.eq('email', adminIdOrEmail))
    .first();
  if (!adminByEmail) {
    throw new Error('Unauthorized: Admin not found');
  }
  return adminByEmail.schoolId;
}

// Query: Get announcements by school, optionally filtered by status
export const getBySchool = query({
  args: {
    schoolId: v.string(),
    status: v.optional(v.union(v.literal('draft'), v.literal('published'), v.literal('archived'))),
  },
  handler: async (ctx, args) => {
    const announcements = args.status
      ? await ctx.db
          .query('announcements')
          .withIndex('by_school_status', (q) =>
            q.eq('schoolId', args.schoolId).eq('status', args.status!)
          )
          .collect()
      : await ctx.db
          .query('announcements')
          .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
          .collect();

    return announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

// Query: Get announcement by ID
export const getById = query({
  args: { id: v.id('announcements') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query: Get published announcements relevant to a teacher (school-wide, teachers, or their classes)
export const getPublishedForTeacher = query({
  args: {
    schoolId: v.string(),
    teacherClassIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query('announcements')
      .withIndex('by_school_status', (q) =>
        q.eq('schoolId', args.schoolId).eq('status', 'published')
      )
      .collect();
    const filtered = announcements.filter((a) => {
      if (a.targetType === 'school' || a.targetType === 'teachers') return true;
      if (a.targetType === 'class' && a.targetId && args.teacherClassIds.includes(a.targetId))
        return true;
      if (a.targetType === 'department') return true; // show department announcements to all for now
      return false;
    });
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

// Query: Get published announcements relevant to a parent (school-wide or their children's classes)
export const getPublishedForParent = query({
  args: {
    schoolId: v.string(),
    studentClassIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query('announcements')
      .withIndex('by_school_status', (q) =>
        q.eq('schoolId', args.schoolId).eq('status', 'published')
      )
      .collect();
    const filtered = announcements.filter((a) => {
      if (a.targetType === 'school') return true;
      if (a.targetType === 'class' && a.targetId && args.studentClassIds.includes(a.targetId))
        return true;
      if (a.targetType === 'department') return true;
      return false;
    });
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

// Mutation: Unarchive an announcement (archived → published)
export const unarchive = mutation({
  args: {
    id: v.id('announcements'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }
    if (announcement.status !== 'archived') {
      throw new Error('Only archived announcements can be restored');
    }
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }
    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: 'published',
      updatedAt: now,
    });
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Restored announcement to published: ${announcement.title}`,
      ipAddress: '0.0.0.0',
    });
    return { success: true };
  },
});

// Mutation: Unpublish an announcement (published → draft)
export const unpublish = mutation({
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
      throw new Error('Only published announcements can be unpublished');
    }
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (announcement.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }
    const now = new Date().toISOString();
    await ctx.db.patch(args.id, {
      status: 'draft',
      updatedAt: now,
    });
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: args.id,
      details: `Unpublished announcement to draft: ${announcement.title}`,
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
