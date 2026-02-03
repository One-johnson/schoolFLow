import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import bcrypt from 'bcryptjs';

// Generate teacher ID: teacher initials + 6 random digits
function generateTeacherId(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${firstInitial}${lastInitial}${randomDigits}`;
}

// Verify the caller is a school admin and return their schoolId
async function getVerifiedSchoolId(ctx: MutationCtx, adminId: string): Promise<string> {
  const admin = await ctx.db.get(adminId as Id<'schoolAdmins'>);
  if (!admin) {
    throw new Error('Unauthorized: Admin not found');
  }
  return admin.schoolId;
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
    photoUrl: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not have access to this school');
    }

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

    const hashedPassword = await bcrypt.hashSync(teacherId, 12);
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
      photoUrl: args.photoUrl,
      emergencyContact: args.emergencyContact,
      emergencyContactName: args.emergencyContactName,
      emergencyContactRelationship: args.emergencyContactRelationship,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
      password: hashedPassword,
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

// Mutation: Add multiple teachers in bulk
export const addBulkTeachers = mutation({
  args: {
    schoolId: v.string(),
    teachers: v.array(
      v.object({
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
        photoUrl: v.optional(v.string()),
        emergencyContact: v.optional(v.string()),
        emergencyContactName: v.optional(v.string()),
        emergencyContactRelationship: v.optional(v.string()),
      })
    ),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not have access to this school');
    }

    const now = new Date().toISOString();
    const results = [];
    const errors = [];

    // Get all existing emails for this school to check for duplicates
    const existingTeachers = await ctx.db
      .query('teachers')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    
    const existingEmails = new Set(existingTeachers.map(t => t.email.toLowerCase()));

    for (let i = 0; i < args.teachers.length; i++) {
      const teacher = args.teachers[i];
      
      try {
        // Check if email already exists
        if (existingEmails.has(teacher.email.toLowerCase())) {
          errors.push({
            index: i,
            email: teacher.email,
            name: `${teacher.firstName} ${teacher.lastName}`,
            error: 'Email already exists in your school',
          });
          continue;
        }

        // Generate unique teacher ID
        let teacherId = generateTeacherId(teacher.firstName, teacher.lastName);
        let existingId = await ctx.db
          .query('teachers')
          .withIndex('by_teacher_id', (q) => q.eq('teacherId', teacherId))
          .first();

        // Ensure unique ID
        while (existingId) {
          teacherId = generateTeacherId(teacher.firstName, teacher.lastName);
          existingId = await ctx.db
            .query('teachers')
            .withIndex('by_teacher_id', (q) => q.eq('teacherId', teacherId))
            .first();
        }

        const hashedPassword = await bcrypt.hash(teacherId, 12);
        const teacherDbId = await ctx.db.insert('teachers', {
          schoolId: args.schoolId,
          teacherId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          dateOfBirth: teacher.dateOfBirth,
          gender: teacher.gender,
          qualifications: teacher.qualifications,
          subjects: teacher.subjects,
          employmentDate: teacher.employmentDate,
          employmentType: teacher.employmentType,
          salary: teacher.salary,
          status: 'active',
          photoUrl: teacher.photoUrl,
          emergencyContact: teacher.emergencyContact,
          emergencyContactName: teacher.emergencyContactName,
          emergencyContactRelationship: teacher.emergencyContactRelationship,
          createdAt: now,
          updatedAt: now,
          createdBy: args.createdBy,
          password: hashedPassword,
        });

        // Add to existing emails set to prevent duplicates within the same bulk operation
        existingEmails.add(teacher.email.toLowerCase());

        results.push({
          teacherId: teacherDbId,
          generatedTeacherId: teacherId,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
        });
      } catch (error) {
        errors.push({
          index: i,
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create audit log for bulk operation
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.createdBy,
      userName: 'School Admin',
      action: 'CREATE',
      entity: 'Teacher',
      entityId: 'bulk',
      details: `Bulk added ${results.length} teachers (${errors.length} failed)`,
      ipAddress: '0.0.0.0',
    });

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
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
    photoUrl: v.optional(v.string()),
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

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (teacher.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not have access to this teacher');
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== teacher.email) {
      const existingTeacher = await ctx.db
        .query('teachers')
        .withIndex('by_email', (q) => q.eq('email', args.email!))
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
    if (args.photoUrl !== undefined) updateData.photoUrl = args.photoUrl;
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

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (teacher.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not have access to this teacher');
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

// Mutation: Delete multiple teachers in bulk
export const deleteBulkTeachers = mutation({
  args: {
    teacherIds: v.array(v.id('teachers')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    const now = new Date().toISOString();
    const results = [];
    const errors = [];

    for (let i = 0; i < args.teacherIds.length; i++) {
      const teacherId = args.teacherIds[i];
      
      try {
        const teacher = await ctx.db.get(teacherId);

        if (!teacher || teacher.schoolId !== callerSchoolId) {
          errors.push({
            teacherId,
            error: !teacher ? 'Teacher not found' : 'Unauthorized',
          });
          continue;
        }

        await ctx.db.delete(teacherId);

        results.push({
          teacherId,
          name: `${teacher.firstName} ${teacher.lastName}`,
          teacherCode: teacher.teacherId,
        });
      } catch (error) {
        errors.push({
          teacherId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create audit log for bulk operation
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Teacher',
      entityId: 'bulk',
      details: `Bulk deleted ${results.length} teachers (${errors.length} failed)`,
      ipAddress: '0.0.0.0',
    });

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
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

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (teacher.schoolId !== callerSchoolId) {
      throw new Error('Unauthorized: You do not have access to this teacher');
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

// Query: Get teacher by email (for login)
export const getTeacherByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const teacher = await ctx.db
      .query('teachers')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
    return teacher;
  },
});

// Query: Get classes where this teacher is the class teacher
export const getTeacherClasses = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query('classes')
      .collect();
    return classes.filter((cls) => cls.classTeacherId === args.teacherId);
  },
});

// Mutation: Update teacher password
export const updateTeacherPassword = mutation({
  args: {
    teacherId: v.id('teachers'),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    await ctx.db.patch(args.teacherId, {
      password: args.hashedPassword,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Mutation: Update teacher's own photo (for teacher portal)
export const updateTeacherPhoto = mutation({
  args: {
    teacherId: v.id('teachers'),
    photoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    await ctx.db.patch(args.teacherId, {
      photoUrl: args.photoUrl,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Query: Get full teacher details by ID (for teacher portal)
export const getTeacherFullDetails = query({
  args: { teacherId: v.id('teachers') },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) return null;

    // Get assigned classes
    const classes = await ctx.db
      .query('classes')
      .collect();
    const assignedClasses = classes.filter((cls) => cls.classTeacherId === teacher._id);

    return {
      ...teacher,
      assignedClasses: assignedClasses.map(c => ({
        id: c._id,
        className: c.className,
        classCode: c.classCode,
      })),
    };
  },
});