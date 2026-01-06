import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate student ID: initials + 6 random digits
function generateStudentId(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${firstInitial}${lastInitial}${randomDigits}`;
}

// Generate admission number: ADM + year + sequence
async function generateAdmissionNumber(ctx: any, schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const students = await ctx.db
    .query('students')
    .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
    .collect();
  
  const sequence = students.length + 1;
  return `ADM${year}${sequence.toString().padStart(3, '0')}`;
}

// Query: Get all students for a school
export const getStudentsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return students;
  },
});

// Query: Get student by ID
export const getStudentById = query({
  args: { studentId: v.id('students') },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    return student;
  },
});

// Query: Get students by class
export const getStudentsByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_class', (q) => q.eq('classId', args.classId))
      .collect();

    return students;
  },
});

// Query: Get students by department
export const getStudentsByDepartment = query({
  args: { 
    schoolId: v.string(),
    department: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high'))
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_department', (q) => q.eq('department', args.department))
      .filter((q) => q.eq(q.field('schoolId'), args.schoolId))
      .collect();

    return students;
  },
});

// Query: Get student statistics
export const getStudentStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const activeStudents = students.filter((s) => s.status === 'active').length;
    const inactiveStudents = students.filter((s) => s.status === 'inactive').length;
    const fresherStudents = students.filter((s) => s.status === 'fresher').length;
    const continuingStudents = students.filter((s) => s.status === 'continuing').length;
    const transferredStudents = students.filter((s) => s.status === 'transferred').length;
    const graduatedStudents = students.filter((s) => s.status === 'graduated').length;

    const crecheStudents = students.filter((s) => s.department === 'creche').length;
    const kindergartenStudents = students.filter((s) => s.department === 'kindergarten').length;
    const primaryStudents = students.filter((s) => s.department === 'primary').length;
    const juniorHighStudents = students.filter((s) => s.department === 'junior_high').length;

    // Count by class
    const classCounts = students.reduce((acc: Record<string, number>, student) => {
      acc[student.className] = (acc[student.className] || 0) + 1;
      return acc;
    }, {});

    return {
      total: students.length,
      active: activeStudents,
      inactive: inactiveStudents,
      fresher: fresherStudents,
      continuing: continuingStudents,
      transferred: transferredStudents,
      graduated: graduatedStudents,
      byDepartment: {
        creche: crecheStudents,
        kindergarten: kindergartenStudents,
        primary: primaryStudents,
        juniorHigh: juniorHighStudents,
      },
      byClass: classCounts,
    };
  },
});

// Query: Search students
export const searchStudents = query({
  args: {
    schoolId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        (student.middleName && student.middleName.toLowerCase().includes(searchLower)) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        student.admissionNumber.toLowerCase().includes(searchLower) ||
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        student.parentEmail.toLowerCase().includes(searchLower)
    );
  },
});

// Mutation: Add new student
export const addStudent = mutation({
  args: {
    schoolId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    nationality: v.optional(v.string()),
    religion: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.string(),
    classId: v.string(),
    className: v.string(),
    department: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    rollNumber: v.optional(v.string()),
    admissionDate: v.string(),
    parentName: v.string(),
    parentEmail: v.string(),
    parentPhone: v.string(),
    parentOccupation: v.optional(v.string()),
    relationship: v.union(v.literal('father'), v.literal('mother'), v.literal('guardian')),
    secondaryContactName: v.optional(v.string()),
    secondaryContactPhone: v.optional(v.string()),
    secondaryContactRelationship: v.optional(v.string()),
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    emergencyContactRelationship: v.string(),
    medicalConditions: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    photoStorageId: v.optional(v.string()),
    birthCertificateStorageId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('fresher'),
      v.literal('continuing'),
      v.literal('transferred'),
      v.literal('graduated')
    )),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists (if provided)
    if (args.email) {
      const existingStudent = await ctx.db
        .query('students')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .filter((q) => q.eq(q.field('schoolId'), args.schoolId))
        .first();

      if (existingStudent) {
        throw new Error('A student with this email already exists in your school');
      }
    }

    // Generate unique student ID
    let studentId = generateStudentId(args.firstName, args.lastName);
    let existingId = await ctx.db
      .query('students')
      .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
      .first();

    while (existingId) {
      studentId = generateStudentId(args.firstName, args.lastName);
      existingId = await ctx.db
        .query('students')
        .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
        .first();
    }

    // Generate admission number
    const admissionNumber = await generateAdmissionNumber(ctx, args.schoolId);

    const now = new Date().toISOString();

    const studentDbId = await ctx.db.insert('students', {
      schoolId: args.schoolId,
      studentId,
      admissionNumber,
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      nationality: args.nationality,
      religion: args.religion,
      email: args.email,
      phone: args.phone,
      address: args.address,
      classId: args.classId,
      className: args.className,
      department: args.department,
      rollNumber: args.rollNumber,
      admissionDate: args.admissionDate,
      parentName: args.parentName,
      parentEmail: args.parentEmail,
      parentPhone: args.parentPhone,
      parentOccupation: args.parentOccupation,
      relationship: args.relationship,
      secondaryContactName: args.secondaryContactName,
      secondaryContactPhone: args.secondaryContactPhone,
      secondaryContactRelationship: args.secondaryContactRelationship,
      emergencyContactName: args.emergencyContactName,
      emergencyContactPhone: args.emergencyContactPhone,
      emergencyContactRelationship: args.emergencyContactRelationship,
      medicalConditions: args.medicalConditions || [],
      allergies: args.allergies || [],
      photoStorageId: args.photoStorageId,
      birthCertificateStorageId: args.birthCertificateStorageId,
      status: args.status || 'fresher',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Update class student count
    const classData = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', args.classId))
      .first();

    if (classData) {
      await ctx.db.patch(classData._id, {
        currentStudentCount: classData.currentStudentCount + 1,
        updatedAt: now,
      });
    }

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.createdBy,
      userName: 'School Admin',
      action: 'CREATE',
      entity: 'Student',
      entityId: studentDbId,
      details: `Added student: ${args.firstName} ${args.lastName} (${studentId})`,
      ipAddress: '0.0.0.0',
    });

    return { studentId: studentDbId, generatedStudentId: studentId, admissionNumber };
  },
});

// Mutation: Update student
export const updateStudent = mutation({
  args: {
    studentId: v.id('students'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    nationality: v.optional(v.string()),
    religion: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    department: v.optional(v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high'))),
    rollNumber: v.optional(v.string()),
    admissionDate: v.optional(v.string()),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    parentOccupation: v.optional(v.string()),
    relationship: v.optional(v.union(v.literal('father'), v.literal('mother'), v.literal('guardian'))),
    secondaryContactName: v.optional(v.string()),
    secondaryContactPhone: v.optional(v.string()),
    secondaryContactRelationship: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    medicalConditions: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    photoStorageId: v.optional(v.string()),
    birthCertificateStorageId: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('fresher'),
      v.literal('continuing'),
      v.literal('transferred'),
      v.literal('graduated')
    )),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== student.email) {
      const existingStudent = await ctx.db
        .query('students')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .filter((q) => q.eq(q.field('schoolId'), student.schoolId))
        .first();

      if (existingStudent && existingStudent._id !== args.studentId) {
        throw new Error('A student with this email already exists in your school');
      }
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.middleName !== undefined) updateData.middleName = args.middleName;
    if (args.dateOfBirth !== undefined) updateData.dateOfBirth = args.dateOfBirth;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.nationality !== undefined) updateData.nationality = args.nationality;
    if (args.religion !== undefined) updateData.religion = args.religion;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.classId !== undefined) updateData.classId = args.classId;
    if (args.className !== undefined) updateData.className = args.className;
    if (args.department !== undefined) updateData.department = args.department;
    if (args.rollNumber !== undefined) updateData.rollNumber = args.rollNumber;
    if (args.admissionDate !== undefined) updateData.admissionDate = args.admissionDate;
    if (args.parentName !== undefined) updateData.parentName = args.parentName;
    if (args.parentEmail !== undefined) updateData.parentEmail = args.parentEmail;
    if (args.parentPhone !== undefined) updateData.parentPhone = args.parentPhone;
    if (args.parentOccupation !== undefined) updateData.parentOccupation = args.parentOccupation;
    if (args.relationship !== undefined) updateData.relationship = args.relationship;
    if (args.secondaryContactName !== undefined) updateData.secondaryContactName = args.secondaryContactName;
    if (args.secondaryContactPhone !== undefined) updateData.secondaryContactPhone = args.secondaryContactPhone;
    if (args.secondaryContactRelationship !== undefined) updateData.secondaryContactRelationship = args.secondaryContactRelationship;
    if (args.emergencyContactName !== undefined) updateData.emergencyContactName = args.emergencyContactName;
    if (args.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = args.emergencyContactPhone;
    if (args.emergencyContactRelationship !== undefined) updateData.emergencyContactRelationship = args.emergencyContactRelationship;
    if (args.medicalConditions !== undefined) updateData.medicalConditions = args.medicalConditions;
    if (args.allergies !== undefined) updateData.allergies = args.allergies;
    if (args.photoStorageId !== undefined) updateData.photoStorageId = args.photoStorageId;
    if (args.birthCertificateStorageId !== undefined) updateData.birthCertificateStorageId = args.birthCertificateStorageId;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.studentId, updateData);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Student',
      entityId: args.studentId,
      details: `Updated student: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Delete student
export const deleteStudent = mutation({
  args: {
    studentId: v.id('students'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    // Delete photo from storage if exists
    if (student.photoStorageId) {
      try {
        await ctx.storage.delete(student.photoStorageId as Id<'_storage'>);
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }

    // Delete birth certificate from storage if exists
    if (student.birthCertificateStorageId) {
      try {
        await ctx.storage.delete(student.birthCertificateStorageId as Id<'_storage'>);
      } catch (error) {
        console.error('Failed to delete birth certificate:', error);
      }
    }

    // Update class student count
    const classData = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', student.classId))
      .first();

    if (classData && classData.currentStudentCount > 0) {
      await ctx.db.patch(classData._id, {
        currentStudentCount: classData.currentStudentCount - 1,
        updatedAt: new Date().toISOString(),
      });
    }

    await ctx.db.delete(args.studentId);

    const now = new Date().toISOString();

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'Student',
      entityId: args.studentId,
      details: `Deleted student: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Bulk delete students
export const bulkDeleteStudents = mutation({
  args: {
    studentIds: v.array(v.id('students')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student) {
          failCount++;
          continue;
        }

        // Update class student count
        const classData = await ctx.db
          .query('classes')
          .withIndex('by_class_code', (q) => q.eq('classCode', student.classId))
          .first();

        if (classData && classData.currentStudentCount > 0) {
          await ctx.db.patch(classData._id, {
            currentStudentCount: classData.currentStudentCount - 1,
            updatedAt: now,
          });
        }

        await ctx.db.delete(studentId);

        // Create audit log
        await ctx.db.insert('auditLogs', {
          timestamp: now,
          userId: args.deletedBy,
          userName: 'School Admin',
          action: 'DELETE',
          entity: 'Student',
          entityId: studentId,
          details: `Deleted student: ${student.firstName} ${student.lastName} (${student.studentId})`,
          ipAddress: '0.0.0.0',
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to delete student ${studentId}:`, error);
      }
    }

    return { success: true, successCount, failCount };
  },
});

// Mutation: Update student status
export const updateStudentStatus = mutation({
  args: {
    studentId: v.id('students'),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('fresher'),
      v.literal('continuing'),
      v.literal('transferred'),
      v.literal('graduated')
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.studentId, {
      status: args.status,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Student',
      entityId: args.studentId,
      details: `Changed student status to ${args.status}: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Transfer student to different class
export const transferStudent = mutation({
  args: {
    studentId: v.id('students'),
    newClassId: v.string(),
    newClassName: v.string(),
    newDepartment: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const now = new Date().toISOString();

    // Update old class count
    const oldClass = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', student.classId))
      .first();

    if (oldClass && oldClass.currentStudentCount > 0) {
      await ctx.db.patch(oldClass._id, {
        currentStudentCount: oldClass.currentStudentCount - 1,
        updatedAt: now,
      });
    }

    // Update new class count
    const newClass = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', args.newClassId))
      .first();

    if (newClass) {
      await ctx.db.patch(newClass._id, {
        currentStudentCount: newClass.currentStudentCount + 1,
        updatedAt: now,
      });
    }

    // Update student
    await ctx.db.patch(args.studentId, {
      classId: args.newClassId,
      className: args.newClassName,
      department: args.newDepartment,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'Student',
      entityId: args.studentId,
      details: `Transferred student ${student.firstName} ${student.lastName} from ${student.className} to ${args.newClassName}`,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  },
});

// Mutation: Promote students (bulk)
export const promoteStudents = mutation({
  args: {
    studentIds: v.array(v.id('students')),
    newClassId: v.string(),
    newClassName: v.string(),
    newDepartment: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student) {
          failCount++;
          continue;
        }

        // Update old class count
        const oldClass = await ctx.db
          .query('classes')
          .withIndex('by_class_code', (q) => q.eq('classCode', student.classId))
          .first();

        if (oldClass && oldClass.currentStudentCount > 0) {
          await ctx.db.patch(oldClass._id, {
            currentStudentCount: oldClass.currentStudentCount - 1,
            updatedAt: now,
          });
        }

        // Update student
        await ctx.db.patch(studentId, {
          classId: args.newClassId,
          className: args.newClassName,
          department: args.newDepartment,
          status: 'continuing',
          updatedAt: now,
        });

        // Create audit log
        await ctx.db.insert('auditLogs', {
          timestamp: now,
          userId: args.updatedBy,
          userName: 'School Admin',
          action: 'UPDATE',
          entity: 'Student',
          entityId: studentId,
          details: `Promoted student ${student.firstName} ${student.lastName} from ${student.className} to ${args.newClassName}`,
          ipAddress: '0.0.0.0',
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to promote student ${studentId}:`, error);
      }
    }

    // Update new class count
    const newClass = await ctx.db
      .query('classes')
      .withIndex('by_class_code', (q) => q.eq('classCode', args.newClassId))
      .first();

    if (newClass) {
      await ctx.db.patch(newClass._id, {
        currentStudentCount: newClass.currentStudentCount + successCount,
        updatedAt: now,
      });
    }

    return { success: true, successCount, failCount };
  },
});

// Mutation: Bulk update student status
export const bulkUpdateStudentStatus = mutation({
  args: {
    studentIds: v.array(v.id('students')),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('fresher'),
      v.literal('continuing'),
      v.literal('transferred'),
      v.literal('graduated')
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student) {
          failCount++;
          continue;
        }

        // Update student status
        await ctx.db.patch(studentId, {
          status: args.status,
          updatedAt: now,
        });

        // Create audit log
        await ctx.db.insert('auditLogs', {
          timestamp: now,
          userId: args.updatedBy,
          userName: 'School Admin',
          action: 'UPDATE',
          entity: 'Student',
          entityId: studentId,
          details: `Changed student status to ${args.status}: ${student.firstName} ${student.lastName} (${student.studentId})`,
          ipAddress: '0.0.0.0',
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to update student status ${studentId}:`, error);
      }
    }

    return { success: true, successCount, failCount };
  },
});

