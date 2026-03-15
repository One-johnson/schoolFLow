import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate parent ID: PRT + 6 random digits
function generateParentId(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PRT${randomDigits}`;
}

// Query: Get parent by email
export const getParentByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const parent = await ctx.db
      .query('parents')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase().trim()))
      .first();
    return parent;
  },
});

// Query: Get parent by ID
export const getParentById = query({
  args: { parentId: v.id('parents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.parentId);
  },
});

// Query: Get parent with linked students (for session)
export const getParentWithStudents = query({
  args: { parentId: v.id('parents') },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) return null;

    const links = await ctx.db
      .query('parentStudents')
      .withIndex('by_parent', (q) => q.eq('parentId', args.parentId))
      .collect();

    const students = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        return student
          ? {
              id: student._id,
              studentId: student.studentId,
              firstName: student.firstName,
              lastName: student.lastName,
              className: student.className,
              classId: student.classId,
              photoStorageId: student.photoStorageId,
            }
          : null;
      })
    );

    return {
      parent,
      students: students.filter((s): s is NonNullable<typeof s> => s !== null),
    };
  },
});

export const markOnboardingSeen = mutation({
  args: { parentId: v.id('parents') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.parentId, {
      hasSeenOnboarding: true,
    });
    return args.parentId;
  },
});

// Query: Get parent's student IDs only
export const getParentStudentIds = query({
  args: { parentId: v.id('parents') },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query('parentStudents')
      .withIndex('by_parent', (q) => q.eq('parentId', args.parentId))
      .collect();
    return links.map((l) => l.studentId);
  },
});

// Mutation: Update parent profile (name, email, phone)
export const updateParentProfile = mutation({
  args: {
    parentId: v.id('parents'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) {
      throw new Error('Parent not found');
    }

    const updates: Record<string, unknown> = {};
    const now = new Date().toISOString();

    if (args.name !== undefined && args.name.trim()) {
      updates.name = args.name.trim();
    }
    if (args.phone !== undefined) {
      updates.phone = (typeof args.phone === "string" && args.phone.trim())
        ? args.phone.trim()
        : undefined;
    }
    if (args.email !== undefined) {
      const emailLower = args.email.trim().toLowerCase();
      if (!emailLower) {
        throw new Error('Email cannot be empty');
      }
      // Check if email is taken by another parent (excluding self)
      const existing = await ctx.db
        .query('parents')
        .withIndex('by_email', (q) => q.eq('email', emailLower))
        .first();
      if (existing && existing._id !== args.parentId) {
        throw new Error('This email is already in use by another account');
      }
      updates.email = emailLower;
    }

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    updates.updatedAt = now;
    await ctx.db.patch(args.parentId, updates);
    return { success: true };
  },
});

// Mutation: Update parent password
export const updateParentPassword = mutation({
  args: {
    parentId: v.id('parents'),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) {
      throw new Error('Parent not found');
    }
    await ctx.db.patch(args.parentId, {
      password: args.hashedPassword,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Mutation: Create parent (for registration - links to students by matching parentEmail)
export const registerParent = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    password: v.string(), // Will be hashed by API before calling
  },
  handler: async (ctx, args) => {
    const emailLower = args.email.toLowerCase().trim();

    // Check if parent already exists
    const existing = await ctx.db
      .query('parents')
      .withIndex('by_email', (q) => q.eq('email', emailLower))
      .first();
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    // Find students with matching parentEmail (need schoolId from first match)
    const students = await ctx.db.query('students').collect();
    const matchingStudents = students.filter(
      (s) => s.parentEmail?.toLowerCase().trim() === emailLower
    );

    if (matchingStudents.length === 0) {
      throw new Error('No students found with this parent email. Please contact your school.');
    }

    const schoolId = matchingStudents[0].schoolId;
    const now = new Date().toISOString();
    const parentId = generateParentId();

    const parentDocId = await ctx.db.insert('parents', {
      schoolId,
      parentId,
      name: args.name,
      email: emailLower,
      phone: args.phone,
      password: args.password,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Link to all matching students
    for (const student of matchingStudents) {
      await ctx.db.insert('parentStudents', {
        parentId: parentDocId,
        studentId: student._id,
        createdAt: now,
      });
    }

    return {
      parentId: parentDocId,
      schoolId,
      studentCount: matchingStudents.length,
    };
  },
});
