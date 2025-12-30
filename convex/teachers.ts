import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate teacher ID: teacher initials + 6 random digits
function generateTeacherId(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${firstInitial}${lastInitial}${randomDigits}`;
}

// Query: Get all teachers for a school
export const getTeachersBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return teachers;
  },
});

// Query: Get teacher by ID
export const getTeacherById = query({
  args: { teacherId: v.id('teachers') },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    return teacher;
  },
});

// Query: Get teacher statistics for a school
export const getTeacherStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const activeTeachers = teachers.filter((t) => t.status === 'active').length;
    const onLeaveTeachers = teachers.filter((t) => t.status === 'on_leave').length;
    const inactiveTeachers = teachers.filter((t) => t.status === 'inactive').length;
    const fullTimeTeachers = teachers.filter((t) => t.employmentType === 'full_time').length;
    const partTimeTeachers = teachers.filter((t) => t.employmentType === 'part_time').length;
    const contractTeachers = teachers.filter((t) => t.employmentType === 'contract').length;

    return {
      total: teachers.length,
      active: activeTeachers,
      onLeave: onLeaveTeachers,
      inactive: inactiveTeachers,
      fullTime: fullTimeTeachers,
      partTime: partTimeTeachers,
      contract: contractTeachers,
    };
  },
});

// Query: Search teachers
export const searchTeachers = query({
  args: {
    schoolId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return teachers.filter(
      (teacher) =>
        teacher.firstName.toLowerCase().includes(searchLower) ||
        teacher.lastName.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        teacher.teacherId.toLowerCase().includes(searchLower)
    );
  },
});

// Mutation: Add new teacher
export const addTeacher = mutation({
  args: {
    schoolId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    qualifications: v.array(v.string()),
    subjects: v.array(v.string()),
    employmentDate: v.string(),
    employmentType: v.union(v.literal('full_time'), v.literal('part_time'), v.literal('contract')),
    salary: v.optional(v.number()),
    emergencyContact: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists for this school
    const existingTeacher = await ctx.db
      .query('teachers')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .filter((q) => q.eq(q.field('schoolId'), args.schoolId))
      .first();

    if (existingTeacher) {
      throw new Error('A teacher with this email already exists in your school');
    }

    // Generate unique teacher ID
    let teacherId = generateTeacherId(args.firstName, args.lastName);
    let existingId = await ctx.db
      .query('teachers')
      .withIndex('by_teacher_id', (q) => q.eq('teacherId', teacherId))
      .first();

    // Ensure unique ID
    while (existingId) {
      teacherId = generateTeacherId(args.firstName, args.lastName);
      existingId = await ctx.db
        .query('teachers')
        .withIndex('by_teacher_id', (q) => q.eq('teacherId', teacherId))
        .first();
    }

    const now = new Date().toISOString();

    const teacherDbId = await ctx.db.insert('teachers', {
      schoolId: args.schoolId,
      teacherId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      qualifications: args.qualifications,
      subjects: args.subjects,
      employmentDate: args.employmentDate,
      employmentType: args.employmentType,
      salary: args.salary,
      status: 'active',
      emergencyContact: args.emergencyContact,
      emergencyContactName: args.emergencyContactName,
      emergencyContactRelationship: args.emergencyContactRelationship,
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
      entity: 'Teacher',
      entityId: teacherDbId,
      details: `Added teacher: ${args.firstName} ${args.lastName} (${teacherId})`,
      ipAddress: '0.0.0.0',
    });

    return { teacherId: teacherDbId, generatedTeacherId: teacherId };
  },
});

// Mutation: Update teacher
export const updateTeacher = mutation({
  args: {
    teacherId: v.id('teachers'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    qualifications: v.optional(v.array(v.string())),
    subjects: v.optional(v.array(v.string())),
    employmentDate: v.optional(v.string()),
    employmentType: v.optional(v.union(v.literal('full_time'), v.literal('part_time'), v.literal('contract'))),
    salary: v.optional(v.number()),
    status: v.optional(v.union(v.literal('active'), v.literal('on_leave'), v.literal('inactive'))),
    emergencyContact: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== teacher.email) {
      const existingTeacher = await ctx.db
        .query('teachers')
        .withIndex('by_email', (q) => q.eq('email', args.email as string))
        .filter((q) => q.eq(q.field('schoolId'), teacher.schoolId))
        .first();

      if (existingTeacher && existingTeacher._id !== args.teacherId) {
        throw new Error('A teacher with this email already exists in your school');
      }
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.dateOfBirth !== undefined) updateData.dateOfBirth = args.dateOfBirth;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.qualifications !== undefined) updateData.qualifications = args.qualifications;
    if (args.subjects !== undefined) updateData.subjects = args.subjects;
    if (args.employmentDate !== undefined) updateData.employmentDate = args.employmentDate;
    if (args.employmentType !== undefined) updateData.employmentType = args.employmentType;
    if (args.salary !== undefined) updateData.salary = args.salary;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.emergencyContact !== undefined) updateData.emergencyContact = args.emergencyContact;
    if (args.emergencyContactName !== undefined) updateData.emergencyContactName = args.emergencyContactName;
    if (args.emergencyContactRelationship !== undefined) updateData.emergencyContactRelationship = args.emergencyContactRelationship;

    await ctx.db.patch(args.teacherId, updateData);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: args.teacherId,
      details: `Updated teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete teacher
export const deleteTeacher = mutation({
  args: {
    teacherId: v.id('teachers'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    await ctx.db.delete(args.teacherId);

    const now = new Date().toISOString();

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Teacher',
      entityId: args.teacherId,
      details: `Deleted teacher: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Update teacher status
export const updateTeacherStatus = mutation({
  args: {
    teacherId: v.id('teachers'),
    status: v.union(v.literal('active'), v.literal('on_leave'), v.literal('inactive')),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.teacherId, {
      status: args.status,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: args.teacherId,
      details: `Changed teacher status to ${args.status}: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});
