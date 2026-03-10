import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Get homework for teacher (their classes only)
export const getByTeacher = query({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
    teacherClassIds: v.array(v.string()),
    classIdFilter: v.optional(v.string()),
    statusFilter: v.optional(v.union(v.literal('active'), v.literal('archived'))),
    searchQuery: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal('newest'), v.literal('due_asc'), v.literal('due_desc'))),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db
      .query('homework')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    items = items.filter(
      (h) =>
        h.teacherId === args.teacherId &&
        args.teacherClassIds.includes(h.classId)
    );

    if (args.classIdFilter) {
      items = items.filter((h) => h.classId === args.classIdFilter);
    }
    if (args.statusFilter) {
      items = items.filter((h) => h.status === args.statusFilter);
    }
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase().trim();
      items = items.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.description?.toLowerCase().includes(q) ?? false) ||
          (h.subjectName?.toLowerCase().includes(q) ?? false)
      );
    }

    const order = args.sortOrder ?? 'newest';
    if (order === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (order === 'due_asc') {
      items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else {
      items.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }
    return items;
  },
});

// Get homework for parent (children's classes)
// studentClassIds = classCodes from parent's students
// homework.classId = class document _id
export const getForParent = query({
  args: {
    schoolId: v.string(),
    studentClassIds: v.array(v.string()),
    subjectIdFilter: v.optional(v.string()),
    classIdFilter: v.optional(v.string()), // class document _id or className for filter
    classNameFilter: v.optional(v.string()), // filter by className (for parent view)
    searchQuery: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal('due_asc'), v.literal('due_desc'), v.literal('newest'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const classCodeSet = new Set(args.studentClassIds);
    let items = await ctx.db
      .query('homework')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const filtered: typeof items = [];
    for (const h of items) {
      if (h.status !== 'active') continue;
      if (args.classIdFilter && h.classId !== args.classIdFilter) continue;
      const classDoc = await ctx.db.get(h.classId as Id<'classes'>);
      if (classDoc && classCodeSet.has(classDoc.classCode)) {
        filtered.push(h);
      }
    }

    items = filtered;
    if (args.subjectIdFilter) {
      items = items.filter((h) => h.subjectId === args.subjectIdFilter);
    }
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase().trim();
      items = items.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          (h.description?.toLowerCase().includes(q) ?? false) ||
          (h.subjectName?.toLowerCase().includes(q) ?? false)
      );
    }

    const order = args.sortOrder ?? 'due_asc';
    if (order === 'due_asc') {
      items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (order === 'due_desc') {
      items.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (args.limit) {
      items = items.slice(0, args.limit);
    }
    return items;
  },
});

// Get upcoming homework for parent dashboard (next 5)
export const getUpcomingForParent = query({
  args: {
    schoolId: v.string(),
    studentClassIds: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const classCodeSet = new Set(args.studentClassIds);
    let items = await ctx.db
      .query('homework')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const filtered: typeof items = [];
    for (const h of items) {
      if (h.status !== 'active' || h.dueDate < today) continue;
      const classDoc = await ctx.db.get(h.classId as Id<'classes'>);
      if (classDoc && classCodeSet.has(classDoc.classCode)) {
        filtered.push(h);
      }
    }

    items = filtered;
    items.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const limit = args.limit ?? 5;
    return items.slice(0, limit);
  },
});

// Get homework by ID
export const getById = query({
  args: { id: v.id('homework') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get submissions for a homework (teacher view)
export const getSubmissionsByHomework = query({
  args: { homeworkId: v.id('homework') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework', (q) => q.eq('homeworkId', args.homeworkId))
      .collect();
  },
});

// Get submission for parent's child
export const getSubmissionByHomeworkAndStudent = query({
  args: {
    homeworkId: v.id('homework'),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) =>
        q.eq('homeworkId', args.homeworkId).eq('studentId', args.studentId)
      )
      .first();
  },
});

// Create homework (teacher only - validated via teacherId and classIds)
export const create = mutation({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
    teacherName: v.string(),
    classId: v.string(),
    className: v.string(),
    subjectId: v.optional(v.string()),
    subjectName: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    attachmentStorageIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const id = await ctx.db.insert('homework', {
      schoolId: args.schoolId,
      teacherId: args.teacherId,
      teacherName: args.teacherName,
      classId: args.classId,
      className: args.className,
      subjectId: args.subjectId,
      subjectName: args.subjectName,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      attachmentStorageIds: args.attachmentStorageIds,
    });

    // Notify parents of students in this class
    await notifyParentsOfNewHomework(ctx, args.schoolId, args.classId, args.title);

    return id;
  },
});

// Update homework
export const update = mutation({
  args: {
    id: v.id('homework'),
    teacherId: v.string(),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    subjectId: v.optional(v.string()),
    subjectName: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    attachmentStorageIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const hw = await ctx.db.get(args.id);
    if (!hw) throw new Error('Homework not found');
    if (hw.teacherId !== args.teacherId) throw new Error('Unauthorized');

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (args.classId !== undefined) updates.classId = args.classId;
    if (args.className !== undefined) updates.className = args.className;
    if (args.subjectId !== undefined) updates.subjectId = args.subjectId;
    if (args.subjectName !== undefined) updates.subjectName = args.subjectName;
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.attachmentStorageIds !== undefined)
      updates.attachmentStorageIds = args.attachmentStorageIds;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Archive homework
export const archive = mutation({
  args: {
    id: v.id('homework'),
    teacherId: v.string(),
  },
  handler: async (ctx, args) => {
    const hw = await ctx.db.get(args.id);
    if (!hw) throw new Error('Homework not found');
    if (hw.teacherId !== args.teacherId) throw new Error('Unauthorized');

    await ctx.db.patch(args.id, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
    return args.id;
  },
});

// Submit homework (parent uploads on behalf of student)
export const submitHomework = mutation({
  args: {
    schoolId: v.string(),
    homeworkId: v.id('homework'),
    studentId: v.string(),
    studentName: v.string(),
    submittedBy: v.string(),
    submittedByName: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) =>
        q.eq('homeworkId', args.homeworkId).eq('studentId', args.studentId)
      )
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        submittedBy: args.submittedBy,
        submittedByName: args.submittedByName,
        storageId: args.storageId,
        fileName: args.fileName,
        remarks: args.remarks,
      });
      return existing._id;
    }

    return await ctx.db.insert('homeworkSubmissions', {
      schoolId: args.schoolId,
      homeworkId: args.homeworkId,
      studentId: args.studentId,
      studentName: args.studentName,
      submittedBy: args.submittedBy,
      submittedByName: args.submittedByName,
      submittedByRole: 'parent',
      storageId: args.storageId,
      fileName: args.fileName,
      remarks: args.remarks,
      status: 'submitted',
      createdAt: now,
    });
  },
});

// Bulk mark submissions (teacher)
export const bulkMarkSubmissions = mutation({
  args: {
    ids: v.array(v.id('homeworkSubmissions')),
    teacherId: v.string(),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId as Id<'teachers'>);
    const teacherName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : 'Teacher';

    let count = 0;
    for (const id of args.ids) {
      const sub = await ctx.db.get(id);
      if (!sub) continue;
      const hw = await ctx.db.get(sub.homeworkId);
      if (!hw || hw.teacherId !== args.teacherId) continue;

      await ctx.db.patch(id, {
        status: 'marked',
        grade: args.grade,
        feedback: args.feedback,
        markedBy: args.teacherId,
        markedByName: teacherName,
        markedAt: new Date().toISOString(),
      });
      count++;
    }
    return { count };
  },
});

// Mark submission (teacher)
export const markSubmission = mutation({
  args: {
    id: v.id('homeworkSubmissions'),
    teacherId: v.string(),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.id);
    if (!sub) throw new Error('Submission not found');

    const hw = await ctx.db.get(sub.homeworkId);
    if (!hw || hw.teacherId !== args.teacherId) throw new Error('Unauthorized');

    const teacher = await ctx.db.get(args.teacherId as Id<'teachers'>);
    const teacherName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : 'Teacher';

    await ctx.db.patch(args.id, {
      status: 'marked',
      grade: args.grade,
      feedback: args.feedback,
      markedBy: args.teacherId,
      markedByName: teacherName,
      markedAt: new Date().toISOString(),
    });
    return args.id;
  },
});

// Helper: Notify parents when new homework is assigned
async function notifyParentsOfNewHomework(
  ctx: MutationCtx,
  schoolId: string,
  classId: string,
  title: string
) {
  const classDoc = await ctx.db.get(classId as Id<'classes'>);
  if (!classDoc) return;

  const students = await ctx.db
    .query('students')
    .withIndex('by_class', (q) => q.eq('classId', classDoc.classCode))
    .collect();

  const parentIds = new Set<string>();
  for (const student of students) {
    const links = await ctx.db
      .query('parentStudents')
      .withIndex('by_student', (q) => q.eq('studentId', student._id))
      .collect();
    for (const link of links) {
      parentIds.add(link.parentId);
    }
  }

  const now = new Date().toISOString();
  const actionUrl = '/parent/homework';
  for (const parentId of parentIds) {
    await ctx.db.insert('notifications', {
      title: 'New Homework Assigned',
      message: `"${title}" has been assigned. Due date is coming up.`,
      type: 'info',
      timestamp: now,
      read: false,
      recipientId: parentId,
      recipientRole: 'parent',
      actionUrl,
    });
  }
}

// Internal: Send due date reminders for homework due in 24-48 hours
export const sendHomeworkDueReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    const schools = await ctx.db.query('schools').collect();
    const allHomework: { _id: Id<'homework'>; schoolId: string; classId: string; title: string; dueDate: string; status: string }[] = [];
    for (const school of schools) {
      const hw = await ctx.db
        .query('homework')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .collect();
      allHomework.push(...hw);
    }

    const dueSoon = allHomework.filter(
      (h) =>
        h.status === 'active' &&
        (h.dueDate === tomorrowStr || h.dueDate === dayAfterStr)
    );

    let sent = 0;
    for (const hw of dueSoon) {
      const classDoc = await ctx.db.get(hw.classId as Id<'classes'>);
      if (!classDoc) continue;

      const students = await ctx.db
        .query('students')
        .withIndex('by_class', (q) => q.eq('classId', classDoc.classCode))
        .collect();

      const parentIds = new Set<string>();
      for (const s of students) {
        const links = await ctx.db
          .query('parentStudents')
          .withIndex('by_student', (q) => q.eq('studentId', s._id))
          .collect();
        for (const l of links) parentIds.add(l.parentId);
      }

      const actionUrl = `/parent/homework?hw=${hw._id}`;
      for (const parentId of parentIds) {
        const existing = await ctx.db
          .query('notifications')
          .filter((q) => q.eq(q.field('recipientId'), parentId))
          .filter((q) => q.eq(q.field('actionUrl'), actionUrl))
          .filter((q) => q.gte(q.field('timestamp'), today))
          .first();
        if (existing) continue;

        await ctx.db.insert('notifications', {
          title: 'Homework Due Soon',
          message: `"${hw.title}" is due ${hw.dueDate === tomorrowStr ? 'tomorrow' : 'in 2 days'}. Don't forget to submit!`,
          type: 'warning',
          timestamp: now.toISOString(),
          read: false,
          recipientId: parentId,
          recipientRole: 'parent',
          actionUrl,
        });
        sent++;
      }
    }
    return { sent, homeworkCount: dueSoon.length };
  },
});
