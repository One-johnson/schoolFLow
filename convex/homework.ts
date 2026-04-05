import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { scheduleWebPushForRecipient } from './webPush';

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

    await notifyClassAboutNewHomework(ctx, args.classId, args.title, id);

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

async function notifyParentsOfHomeworkSubmission(
  ctx: MutationCtx,
  studentId: Id<'students'>,
  homeworkTitle: string
) {
  const links = await ctx.db
    .query('parentStudents')
    .withIndex('by_student', (q) => q.eq('studentId', studentId))
    .collect();

  const now = new Date().toISOString();
  const actionUrl = '/parent/homework';
  for (const link of links) {
    await ctx.db.insert('notifications', {
      title: 'Homework submitted',
      message: `"${homeworkTitle}" was submitted by your child.`,
      type: 'info',
      timestamp: now,
      read: false,
      recipientId: link.parentId as string,
      recipientRole: 'parent',
      actionUrl,
    });
    await scheduleWebPushForRecipient(ctx, {
      recipientRole: 'parent',
      recipientId: link.parentId as string,
      title: 'Homework submitted',
      body: `"${homeworkTitle}" was submitted by your child.`,
      url: actionUrl,
    });
  }
}

// Submit homework: upload a file and/or written answer in the student portal.
// Pass storageId+fileName for a file update; pass portalAnswer to set/clear written work (empty string clears).
export const submitHomeworkAsStudent = mutation({
  args: {
    schoolId: v.string(),
    homeworkId: v.id('homework'),
    studentId: v.id('students'),
    storageId: v.optional(v.string()),
    fileName: v.optional(v.string()),
    portalAnswer: v.optional(v.string()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error('Student not found');
    if (student.schoolId !== args.schoolId) throw new Error('Unauthorized');

    const hw = await ctx.db.get(args.homeworkId);
    if (!hw || hw.schoolId !== args.schoolId) throw new Error('Homework not found');
    if (hw.status !== 'active') throw new Error('This homework is no longer active');

    const classDoc = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', student.classId))
      .first();
    if (!classDoc || classDoc._id !== hw.classId) {
      throw new Error('This assignment is not for your class');
    }

    const hasFile = Boolean(args.storageId && args.fileName);
    if (args.storageId && !args.fileName) throw new Error('File name is required with upload');
    if (!args.storageId && args.fileName) throw new Error('Upload is incomplete');

    const wantsPortalUpdate = args.portalAnswer !== undefined;
    const portalValue = wantsPortalUpdate ? args.portalAnswer!.trim() || undefined : undefined;

    const studentIdStr = args.studentId as string;
    const studentName = `${student.firstName} ${student.lastName}`;

    const existing = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) =>
        q.eq('homeworkId', args.homeworkId).eq('studentId', studentIdStr)
      )
      .first();

    const now = new Date().toISOString();

    const ensureHasContent = (
      nextStorageId: string | undefined,
      nextFileName: string | undefined,
      nextPortal: string | undefined
    ) => {
      const hasStoredFile = Boolean(nextStorageId && nextFileName);
      const hasStoredText = Boolean(nextPortal && nextPortal.length > 0);
      if (!hasStoredFile && !hasStoredText) {
        throw new Error('Add a file or write your answer in the portal before submitting');
      }
    };

    if (existing) {
      if (existing.status === 'marked') {
        throw new Error('This homework has already been marked and cannot be changed');
      }
      if (!hasFile && !wantsPortalUpdate && args.remarks === undefined) {
        throw new Error('Nothing to update');
      }

      const nextStorageId = hasFile ? args.storageId : existing.storageId;
      const nextFileName = hasFile ? args.fileName : existing.fileName;
      const nextPortal = wantsPortalUpdate ? portalValue : existing.portalAnswer;

      if (hasFile || wantsPortalUpdate) {
        ensureHasContent(nextStorageId, nextFileName, nextPortal);
      }

      const patch: Record<string, unknown> = {
        submittedBy: studentIdStr,
        submittedByName: studentName,
        submittedByRole: 'student',
      };
      if (hasFile) {
        patch.storageId = args.storageId;
        patch.fileName = args.fileName;
      }
      if (wantsPortalUpdate) {
        patch.portalAnswer = portalValue;
      }
      if (args.remarks !== undefined) {
        patch.remarks = args.remarks;
      }

      await ctx.db.patch(existing._id, patch);
      await notifyParentsOfHomeworkSubmission(ctx, args.studentId, hw.title);
      return existing._id;
    }

    ensureHasContent(
      hasFile ? args.storageId : undefined,
      hasFile ? args.fileName : undefined,
      portalValue
    );

    const id = await ctx.db.insert('homeworkSubmissions', {
      schoolId: args.schoolId,
      homeworkId: args.homeworkId,
      studentId: studentIdStr,
      studentName,
      submittedBy: studentIdStr,
      submittedByName: studentName,
      submittedByRole: 'student',
      storageId: hasFile ? args.storageId : undefined,
      fileName: hasFile ? args.fileName : undefined,
      portalAnswer: portalValue,
      remarks: args.remarks,
      status: 'submitted',
      createdAt: now,
    });
    await notifyParentsOfHomeworkSubmission(ctx, args.studentId, hw.title);
    return id;
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
      await notifyStudentHomeworkMarked(
        ctx,
        sub.studentId,
        sub.homeworkId,
        hw.title,
        args.grade
      );
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
    await notifyStudentHomeworkMarked(
      ctx,
      sub.studentId,
      sub.homeworkId,
      hw.title,
      args.grade
    );
    return args.id;
  },
});

async function notifyStudentHomeworkMarked(
  ctx: MutationCtx,
  studentId: string,
  homeworkId: Id<'homework'>,
  homeworkTitle: string,
  grade?: string
) {
  const message = grade
    ? `"${homeworkTitle}" has been marked. Grade: ${grade}. Open it to see your teacher's feedback.`
    : `"${homeworkTitle}" has been marked. Open it to see your teacher's feedback.`;
  await ctx.db.insert('notifications', {
    title: 'Homework marked',
    message,
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false,
    recipientId: studentId,
    recipientRole: 'student',
    actionUrl: `/student/homework/${homeworkId}`,
  });
  await scheduleWebPushForRecipient(ctx, {
    recipientRole: 'student',
    recipientId: studentId,
    title: 'Homework marked',
    body: message,
    url: `/student/homework/${homeworkId}`,
  });
}

// Helper: Notify parents and students when new homework is assigned
async function notifyClassAboutNewHomework(
  ctx: MutationCtx,
  classId: string,
  title: string,
  homeworkId: Id<'homework'>
) {
  const classDoc = await ctx.db.get(classId as Id<'classes'>);
  if (!classDoc) return;

  const students = await ctx.db
    .query('students')
    .withIndex('by_class', (q) => q.eq('classId', classDoc.classCode))
    .collect();

  const now = new Date().toISOString();
  const studentActionUrl = `/student/homework/${homeworkId}`;

  for (const student of students) {
    await ctx.db.insert('notifications', {
      title: 'New homework',
      message: `"${title}" was assigned. Open it to read instructions and submit when you're ready.`,
      type: 'info',
      timestamp: now,
      read: false,
      recipientId: student._id as string,
      recipientRole: 'student',
      actionUrl: studentActionUrl,
    });
    await scheduleWebPushForRecipient(ctx, {
      recipientRole: 'student',
      recipientId: student._id as string,
      title: 'New homework',
      body: `"${title}" was assigned. Open it to read instructions and submit when you're ready.`,
      url: studentActionUrl,
    });
  }

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

  const actionUrl = '/parent/homework';
  for (const parentId of parentIds) {
    await ctx.db.insert('notifications', {
      title: 'New Homework Assigned',
      message: `"${title}" has been assigned. Your child can view and submit it from their student portal.`,
      type: 'info',
      timestamp: now,
      read: false,
      recipientId: parentId,
      recipientRole: 'parent',
      actionUrl,
    });
    await scheduleWebPushForRecipient(ctx, {
      recipientRole: 'parent',
      recipientId: parentId,
      title: 'New Homework Assigned',
      body: `"${title}" has been assigned. Your child can view and submit it from their student portal.`,
      url: actionUrl,
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

      const parentActionUrl = `/parent/homework?hw=${hw._id}`;
      for (const parentId of parentIds) {
        const existing = await ctx.db
          .query('notifications')
          .filter((q) => q.eq(q.field('recipientId'), parentId))
          .filter((q) => q.eq(q.field('actionUrl'), parentActionUrl))
          .filter((q) => q.gte(q.field('timestamp'), today))
          .first();
        if (existing) continue;

        await ctx.db.insert('notifications', {
          title: 'Homework Due Soon',
          message: `"${hw.title}" is due ${hw.dueDate === tomorrowStr ? 'tomorrow' : 'in 2 days'}. Your child can submit it from their student portal.`,
          type: 'warning',
          timestamp: now.toISOString(),
          read: false,
          recipientId: parentId,
          recipientRole: 'parent',
          actionUrl: parentActionUrl,
        });
        await scheduleWebPushForRecipient(ctx, {
          recipientRole: 'parent',
          recipientId: parentId,
          title: 'Homework Due Soon',
          body: `"${hw.title}" is due ${hw.dueDate === tomorrowStr ? 'tomorrow' : 'in 2 days'}. Your child can submit it from their student portal.`,
          url: parentActionUrl,
        });
        sent++;
      }

      const studentActionUrl = `/student/homework/${hw._id}`;
      for (const s of students) {
        const sub = await ctx.db
          .query('homeworkSubmissions')
          .withIndex('by_homework_student', (q) =>
            q.eq('homeworkId', hw._id).eq('studentId', s._id as string)
          )
          .first();
        if (sub && (sub.status === 'submitted' || sub.status === 'marked')) continue;

        const existingStu = await ctx.db
          .query('notifications')
          .filter((q) => q.eq(q.field('recipientId'), s._id as string))
          .filter((q) => q.eq(q.field('actionUrl'), studentActionUrl))
          .filter((q) => q.gte(q.field('timestamp'), today))
          .first();
        if (existingStu) continue;

        await ctx.db.insert('notifications', {
          title: 'Homework due soon',
          message: `"${hw.title}" is due ${hw.dueDate === tomorrowStr ? 'tomorrow' : 'in 2 days'}. Submit from your homework page when you're ready.`,
          type: 'warning',
          timestamp: now.toISOString(),
          read: false,
          recipientId: s._id as string,
          recipientRole: 'student',
          actionUrl: studentActionUrl,
        });
        await scheduleWebPushForRecipient(ctx, {
          recipientRole: 'student',
          recipientId: s._id as string,
          title: 'Homework due soon',
          body: `"${hw.title}" is due ${hw.dueDate === tomorrowStr ? 'tomorrow' : 'in 2 days'}. Submit from your homework page when you're ready.`,
          url: studentActionUrl,
        });
        sent++;
      }
    }
    return { sent, homeworkCount: dueSoon.length };
  },
});
