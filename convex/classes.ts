import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate class code: CLS + 6 random digits
function generateClassCode(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `CLS${randomDigits}`;
}

// Query: Get all classes for a school
export const getClassesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return classes;
  },
});

// Query: Get class by ID
export const getClassById = query({
  args: { classId: v.id('classes') },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);
    return classData;
  },
});

// Query: Get class statistics for a school
export const getClassStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const activeClasses = classes.filter((c) => c.status === 'active').length;
    const inactiveClasses = classes.filter((c) => c.status === 'inactive').length;
    const kindergartenClasses = classes.filter((c) => c.department === 'kindergarten').length;
    const primaryClasses = classes.filter((c) => c.department === 'primary').length;
    const juniorHighClasses = classes.filter((c) => c.department === 'junior_high').length;
    const totalStudents = classes.reduce((sum, c) => sum + c.currentStudentCount, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);

    return {
      total: classes.length,
      active: activeClasses,
      inactive: inactiveClasses,
      kindergarten: kindergartenClasses,
      primary: primaryClasses,
      juniorHigh: juniorHighClasses,
      totalStudents,
      totalCapacity,
    };
  },
});

// Mutation: Add new class
export const addClass = mutation({
  args: {
    schoolId: v.string(),
    className: v.string(),
    grade: v.string(),
    section: v.optional(v.string()),
    department: v.union(v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    classTeacherId: v.optional(v.string()),
    capacity: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if class name already exists for this school
    const existingClass = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('className'), args.className))
      .first();

    if (existingClass) {
      throw new Error('A class with this name already exists in your school');
    }

    // Generate unique class code
    let classCode = generateClassCode();
    let existingCode = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', classCode))
      .first();

    // Ensure unique code
    while (existingCode) {
      classCode = generateClassCode();
      existingCode = await ctx.db
        .query('classes')
        .withIndex('by_class_code', (q) => q.eq('classCode', classCode))
        .first();
    }

    const now = new Date().toISOString();

    const classId = await ctx.db.insert('classes', {
      schoolId: args.schoolId,
      classCode,
      className: args.className,
      grade: args.grade,
      section: args.section,
      department: args.department,
      classTeacherId: args.classTeacherId,
      capacity: args.capacity,
      currentStudentCount: 0,
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
      entity: 'Class',
      entityId: classId,
      details: `Added class: ${args.className} (${classCode})`,
      ipAddress: '0.0.0.0',
    });

    return { classId, generatedClassCode: classCode };
  },
});

// Mutation: Add multiple classes (bulk)
export const addBulkClasses = mutation({
  args: {
    schoolId: v.string(),
    classes: v.array(v.object({
      className: v.string(),
      grade: v.string(),
      section: v.optional(v.string()),
      department: v.union(v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
      classTeacherId: v.optional(v.string()),
      capacity: v.optional(v.number()),
    })),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = new Date().toISOString();

    for (const classData of args.classes) {
      // Check if class name already exists
      const existingClass = await ctx.db
        .query('classes')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .filter((q) => q.eq(q.field('className'), classData.className))
        .first();

      if (existingClass) {
        results.push({
          className: classData.className,
          success: false,
          error: 'Class name already exists',
        });
        continue;
      }

      // Generate unique class code
      let classCode = generateClassCode();
      let existingCode = await ctx.db
        .query('classes')
        .withIndex('by_class_code', (q) => q.eq('classCode', classCode))
        .first();

      while (existingCode) {
        classCode = generateClassCode();
        existingCode = await ctx.db
          .query('classes')
          .withIndex('by_class_code', (q) => q.eq('classCode', classCode))
          .first();
      }

      const classId = await ctx.db.insert('classes', {
        schoolId: args.schoolId,
        classCode,
        className: classData.className,
        grade: classData.grade,
        section: classData.section,
        department: classData.department,
        classTeacherId: classData.classTeacherId,
        capacity: classData.capacity,
        currentStudentCount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy: args.createdBy,
      });

      results.push({
        className: classData.className,
        classCode,
        success: true,
        classId,
      });

      // Create audit log
      await ctx.db.insert('auditLogs', {
        timestamp: now,
        userId: args.createdBy,
        userName: 'School Admin',
        action: 'CREATE',
        entity: 'Class',
        entityId: classId,
        details: `Bulk added class: ${classData.className} (${classCode})`,
        ipAddress: '0.0.0.0',
      });
    }

    return results;
  },
});

// Mutation: Update class
export const updateClass = mutation({
  args: {
    classId: v.id('classes'),
    className: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    department: v.optional(v.union(v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high'))),
    classTeacherId: v.optional(v.string()),
    capacity: v.optional(v.number()),
    currentStudentCount: v.optional(v.number()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error('Class not found');
    }

    // If class name is being updated, check for duplicates
    if (args.className && args.className !== classData.className) {
      const existingClass = await ctx.db
        .query('classes')
        .withIndex('by_school', (q) => q.eq('schoolId', classData.schoolId))
        .filter((q) => q.eq(q.field('className'), args.className))
        .first();

      if (existingClass && existingClass._id !== args.classId) {
        throw new Error('A class with this name already exists in your school');
      }
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (args.className !== undefined) updateData.className = args.className;
    if (args.grade !== undefined) updateData.grade = args.grade;
    if (args.section !== undefined) updateData.section = args.section;
    if (args.department !== undefined) updateData.department = args.department;
    if (args.classTeacherId !== undefined) updateData.classTeacherId = args.classTeacherId;
    if (args.capacity !== undefined) updateData.capacity = args.capacity;
    if (args.currentStudentCount !== undefined) updateData.currentStudentCount = args.currentStudentCount;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.classId, updateData);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Class',
      entityId: args.classId,
      details: `Updated class: ${classData.className} (${classData.classCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete class
export const deleteClass = mutation({
  args: {
    classId: v.id('classes'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check if class has students
    if (classData.currentStudentCount > 0) {
      throw new Error('Cannot delete a class with students. Please reassign students first.');
    }

    await ctx.db.delete(args.classId);

    const now = new Date().toISOString();

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Class',
      entityId: args.classId,
      details: `Deleted class: ${classData.className} (${classData.classCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete multiple classes (bulk)
export const deleteBulkClasses = mutation({
  args: {
    classIds: v.array(v.id('classes')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = new Date().toISOString();

    for (const classId of args.classIds) {
      const classData = await ctx.db.get(classId);

      if (!classData) {
        results.push({
          classId,
          success: false,
          error: 'Class not found',
        });
        continue;
      }

      if (classData.currentStudentCount > 0) {
        results.push({
          classId,
          className: classData.className,
          success: false,
          error: 'Class has students',
        });
        continue;
      }

      await ctx.db.delete(classId);

      results.push({
        classId,
        className: classData.className,
        success: true,
      });

      // Create audit log
      await ctx.db.insert('auditLogs', {
        timestamp: now,
        userId: args.deletedBy,
        userName: 'School Admin',
        action: 'DELETE',
        entity: 'Class',
        entityId: classId,
        details: `Bulk deleted class: ${classData.className} (${classData.classCode})`,
        ipAddress: '0.0.0.0',
      });
    }

    return results;
  },
});

// Mutation: Update class status
export const updateClassStatus = mutation({
  args: {
    classId: v.id('classes'),
    status: v.union(v.literal('active'), v.literal('inactive')),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error('Class not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.classId, {
      status: args.status,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Class',
      entityId: args.classId,
      details: `Changed class status to ${args.status}: ${classData.className} (${classData.classCode})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
