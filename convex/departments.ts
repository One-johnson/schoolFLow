import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Query: Get all departments for a school
export const getDepartmentsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const departments = await ctx.db
      .query('departments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return departments.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  },
});

// Query: Get department by ID
export const getDepartmentById = query({
  args: { departmentId: v.id('departments') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.departmentId);
  },
});

// Mutation: Add department
export const addDepartment = mutation({
  args: {
    schoolId: v.string(),
    name: v.string(),
    code: v.string(),
    sortOrder: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Validate code: 2-3 chars, uppercase
    const code = args.code.trim().toUpperCase().slice(0, 3);
    if (code.length < 2) {
      throw new Error('Department code must be 2-3 characters');
    }

    // Check for duplicate name in same school
    const existing = await ctx.db
      .query('departments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    if (existing.some((d) => d.name.toLowerCase() === args.name.trim().toLowerCase())) {
      throw new Error('A department with this name already exists');
    }

    if (existing.some((d) => d.code === code)) {
      throw new Error('A department with this code already exists');
    }

    return ctx.db.insert('departments', {
      schoolId: args.schoolId,
      name: args.name.trim(),
      code,
      sortOrder: args.sortOrder ?? existing.length,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });
  },
});

// Mutation: Update department
export const updateDepartment = mutation({
  args: {
    departmentId: v.id('departments'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();
      const existing = await ctx.db
        .query('departments')
        .withIndex('by_school', (q) => q.eq('schoolId', department.schoolId))
        .collect();

      if (existing.some((d) => d._id !== args.departmentId && d.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('A department with this name already exists');
      }
      updateData.name = name;
    }

    if (args.code !== undefined) {
      const code = args.code.trim().toUpperCase().slice(0, 3);
      if (code.length < 2) {
        throw new Error('Department code must be 2-3 characters');
      }

      const existing = await ctx.db
        .query('departments')
        .withIndex('by_school', (q) => q.eq('schoolId', department.schoolId))
        .collect();

      if (existing.some((d) => d._id !== args.departmentId && d.code === code)) {
        throw new Error('A department with this code already exists');
      }
      updateData.code = code;
    }

    if (args.sortOrder !== undefined) {
      updateData.sortOrder = args.sortOrder;
    }

    await ctx.db.patch(args.departmentId, updateData);
    return args.departmentId;
  },
});

// Mutation: Seed default departments for a new school
export const seedDefaultDepartments = mutation({
  args: {
    schoolId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('departments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .first();

    if (existing) {
      return; // Already has departments
    }

    const now = new Date().toISOString();
    const defaults = [
      { name: 'Creche', code: 'CR', sortOrder: 0 },
      { name: 'Kindergarten', code: 'KG', sortOrder: 1 },
      { name: 'Primary', code: 'PR', sortOrder: 2 },
      { name: 'Junior High', code: 'JH', sortOrder: 3 },
    ];

    for (const d of defaults) {
      await ctx.db.insert('departments', {
        schoolId: args.schoolId,
        name: d.name,
        code: d.code,
        sortOrder: d.sortOrder,
        createdAt: now,
        updatedAt: now,
        createdBy: args.createdBy,
      });
    }
  },
});

// Mutation: Delete department
export const deleteDepartment = mutation({
  args: {
    departmentId: v.id('departments'),
  },
  handler: async (ctx, args) => {
    const department = await ctx.db.get(args.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if any classes use this department
    const classes = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', department.schoolId))
      .collect();

    if (classes.some((c) => c.departmentId === args.departmentId)) {
      throw new Error('Cannot delete department: it has classes assigned. Reassign or remove those classes first.');
    }

    // Check if any students use this department
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', department.schoolId))
      .collect();

    if (students.some((s) => s.departmentId === args.departmentId)) {
      throw new Error('Cannot delete department: it has students assigned. Reassign those students first.');
    }

    // Check if any subjects use this department
    const subjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', department.schoolId))
      .collect();

    if (subjects.some((s) => s.departmentId === args.departmentId)) {
      throw new Error('Cannot delete department: it has subjects assigned. Reassign those subjects first.');
    }

    await ctx.db.delete(args.departmentId);
    return args.departmentId;
  },
});
