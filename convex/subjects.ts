import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate subject code: department code + 4 random digits
async function generateSubjectCode(ctx: { db: { get: (id: Id<'departments'>) => Promise<{ code: string } | null> } }, departmentId: Id<'departments'>): Promise<string> {
  const department = await ctx.db.get(departmentId);
  const code = department?.code?.slice(0, 3).toUpperCase() ?? 'XX';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${code}${randomDigits}`;
}

// Query: Get all subjects for a school
export const getSubjectsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return subjects;
  },
});

// Alias for simpler access
export const getSubjects = getSubjectsBySchool;

// Query: Get subject by ID
export const getSubjectById = query({
  args: { subjectId: v.id('subjects') },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId);
    return subject;
  },
});

// Query: Get subjects by department
export const getSubjectsByDepartment = query({
  args: { 
    schoolId: v.string(),
    departmentId: v.id('departments'),
  },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('departmentId'), args.departmentId))
      .collect();

    return subjects.filter((s) => s.status === 'active');
  },
});

// Query: Get subject statistics for a school
export const getSubjectStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const activeSubjects = subjects.filter((s) => s.status === 'active').length;
    const inactiveSubjects = subjects.filter((s) => s.status === 'inactive').length;
    const coreSubjects = subjects.filter((s) => s.category === 'core').length;
    const electiveSubjects = subjects.filter((s) => s.category === 'elective').length;
    const extracurricularSubjects = subjects.filter((s) => s.category === 'extracurricular').length;
    const byDepartment: Record<string, number> = {};
    for (const s of subjects) {
      const id = s.departmentId;
      byDepartment[id] = (byDepartment[id] ?? 0) + 1;
    }

    return {
      total: subjects.length,
      active: activeSubjects,
      inactive: inactiveSubjects,
      core: coreSubjects,
      elective: electiveSubjects,
      extracurricular: extracurricularSubjects,
      byDepartment,
    };
  },
});

// Mutation: Add new subject
export const addSubject = mutation({
  args: {
    schoolId: v.string(),
    subjectName: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal('core'), v.literal('elective'), v.literal('extracurricular')),
    departmentId: v.id('departments'),
    color: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if subject name already exists for this school AND department
    const existingSubject = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => 
        q.and(
          q.eq(q.field('subjectName'), args.subjectName),
          q.eq(q.field('departmentId'), args.departmentId)
        )
      )
      .first();

    if (existingSubject) {
      throw new Error('A subject with this name already exists in this department');
    }

    // Generate unique subject code
    let subjectCode = await generateSubjectCode(ctx, args.departmentId);
    let existingCode = await ctx.db
      .query('subjects')
      .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
      .first();

    // Ensure unique code
    while (existingCode) {
      subjectCode = await generateSubjectCode(ctx, args.departmentId);
      existingCode = await ctx.db
        .query('subjects')
        .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
        .first();
    }

    const now = new Date().toISOString();

    const subjectId = await ctx.db.insert('subjects', {
      schoolId: args.schoolId,
      subjectCode,
      subjectName: args.subjectName,
      description: args.description,
      category: args.category,
      departmentId: args.departmentId,
      color: args.color,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.createdBy,
      userName: 'School Admin',
      action: 'CREATE',
      entity: 'Subject',
      entityId: subjectId,
      details: `Added subject: ${args.subjectName} (${subjectCode})`,
      ipAddress: '0.0.0.0',
    });

    return { subjectId, generatedSubjectCode: subjectCode };
  },
});

// Mutation: Add multiple subjects (bulk)
export const addBulkSubjects = mutation({
  args: {
    schoolId: v.string(),
    subjects: v.array(v.object({
      subjectName: v.string(),
      description: v.optional(v.string()),
      category: v.union(v.literal('core'), v.literal('elective'), v.literal('extracurricular')),
      departmentId: v.id('departments'),
      color: v.optional(v.string()),
    })),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = new Date().toISOString();

    for (const subjectData of args.subjects) {
      // Check if subject name already exists in the same department
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .filter((q) => 
          q.and(
            q.eq(q.field('subjectName'), subjectData.subjectName),
            q.eq(q.field('departmentId'), subjectData.departmentId)
          )
        )
        .first();

      if (existingSubject) {
        results.push({
          subjectName: subjectData.subjectName,
          success: false,
          error: 'Subject name already exists in this department',
        });
        continue;
      }

      // Generate unique subject code
      let subjectCode = await generateSubjectCode(ctx, subjectData.departmentId);
      let existingCode = await ctx.db
        .query('subjects')
        .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
        .first();

      while (existingCode) {
        subjectCode = await generateSubjectCode(ctx, subjectData.departmentId);
        existingCode = await ctx.db
          .query('subjects')
          .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
          .first();
      }

      const subjectId = await ctx.db.insert('subjects', {
        schoolId: args.schoolId,
        subjectCode,
        subjectName: subjectData.subjectName,
        description: subjectData.description,
        category: subjectData.category,
        departmentId: subjectData.departmentId,
        color: subjectData.color,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: args.createdBy,
      });

      results.push({
        subjectName: subjectData.subjectName,
        subjectCode,
        success: true,
        subjectId,
      });

      // Create audit log
      await ctx.db.insert('auditLogs', {
        timestamp: now,
        userId: args.createdBy,
        userName: 'School Admin',
        action: 'CREATE',
        entity: 'Subject',
        entityId: subjectId,
        details: `Bulk added subject: ${subjectData.subjectName} (${subjectCode})`,
        ipAddress: '0.0.0.0',
      });
    }

    return results;
  },
});

// Mutation: Update subject
export const updateSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
    subjectName: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(v.literal('core'), v.literal('elective'), v.literal('extracurricular'))),
    departmentId: v.optional(v.id('departments')),
    color: v.optional(v.string()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId);

    if (!subject) {
      throw new Error('Subject not found');
    }

    // If subject name is being updated, check for duplicates in the same department
    if (args.subjectName && args.subjectName !== subject.subjectName) {
      const targetDepartmentId = args.departmentId ?? subject.departmentId;
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', subject.schoolId))
        .filter((q) => 
          q.and(
            q.eq(q.field('subjectName'), args.subjectName),
            q.eq(q.field('departmentId'), targetDepartmentId)
          )
        )
        .first();

      if (existingSubject && existingSubject._id !== args.subjectId) {
        throw new Error('A subject with this name already exists in this department');
      }
    }
    // If only department is being updated, check for duplicates with existing name
    else if (args.departmentId && args.departmentId !== subject.departmentId) {
      const existingSubject = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', subject.schoolId))
        .filter((q) => 
          q.and(
            q.eq(q.field('subjectName'), subject.subjectName),
            q.eq(q.field('departmentId'), args.departmentId)
          )
        )
        .first();

      if (existingSubject && existingSubject._id !== args.subjectId) {
        throw new Error('A subject with this name already exists in this department');
      }
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (args.subjectName !== undefined) updateData.subjectName = args.subjectName;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.color !== undefined) updateData.color = args.color;
    if (args.departmentId !== undefined) {
      updateData.departmentId = args.departmentId;
      // Regenerate subject code if department changes
      let subjectCode = await generateSubjectCode(ctx, args.departmentId);
      let existingCode = await ctx.db
        .query('subjects')
        .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
        .first();

      while (existingCode && existingCode._id !== args.subjectId) {
        subjectCode = await generateSubjectCode(ctx, args.departmentId);
        existingCode = await ctx.db
          .query('subjects')
          .withIndex('by_subject_code', (q) => q.eq('subjectCode', subjectCode))
          .first();
      }
      updateData.subjectCode = subjectCode;
    }
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.subjectId, updateData);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Subject',
      entityId: args.subjectId,
      details: `Updated subject: ${subject.subjectName} (${subject.subjectCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete subject
export const deleteSubject = mutation({
  args: {
    subjectId: v.id('subjects'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId);

    if (!subject) {
      throw new Error('Subject not found');
    }

    await ctx.db.delete(args.subjectId);

    const now = new Date().toISOString();

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Subject',
      entityId: args.subjectId,
      details: `Deleted subject: ${subject.subjectName} (${subject.subjectCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete multiple subjects (bulk)
export const deleteBulkSubjects = mutation({
  args: {
    subjectIds: v.array(v.id('subjects')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = new Date().toISOString();

    for (const subjectId of args.subjectIds) {
      const subject = await ctx.db.get(subjectId);

      if (!subject) {
        results.push({
          subjectId,
          success: false,
          error: 'Subject not found',
        });
        continue;
      }

      await ctx.db.delete(subjectId);

      results.push({
        subjectId,
        subjectName: subject.subjectName,
        success: true,
      });

      // Create audit log
      await ctx.db.insert('auditLogs', {
        timestamp: now,
        userId: args.deletedBy,
        userName: 'School Admin',
        action: 'DELETE',
        entity: 'Subject',
        entityId: subjectId,
        details: `Bulk deleted subject: ${subject.subjectName} (${subject.subjectCode})`,
        ipAddress: '0.0.0.0',
      });
    }

    return results;
  },
});

// Mutation: Update subject status
export const updateSubjectStatus = mutation({
  args: {
    subjectId: v.id('subjects'),
    status: v.union(v.literal('active'), v.literal('inactive')),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId);

    if (!subject) {
      throw new Error('Subject not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.subjectId, {
      status: args.status,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Subject',
      entityId: args.subjectId,
      details: `Changed subject status to ${args.status}: ${subject.subjectName} (${subject.subjectCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
