import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import bcrypt from "bcryptjs";

// GES (Ghana Education Service): 13 classes from Nursery 1 to Basic 9 / JHS 3
// Preschool 2y, Kindergarten 2y, Primary 6y, Junior 3y (Basic 7–9 or JHS 1–3)
// Schools may use "Basic 1–9" or "Primary 1–6" then "JHS 1–3"
const GES_YEARS_REMAINING: Record<string, number> = {
  "Nursery 1": 13,
  "Nursery 2": 12,
  "KG 1": 11,
  "Kindergarten 1": 11,
  "KG 2": 10,
  "Kindergarten 2": 10,
  "Basic 1": 8,
  "Basic 2": 7,
  "Basic 3": 6,
  "Basic 4": 5,
  "Basic 5": 4,
  "Basic 6": 3,
  "Basic 7": 2,
  "Basic 8": 1,
  "Basic 9": 0,
  "Primary 1": 8,
  "Primary 2": 7,
  "Primary 3": 6,
  "Primary 4": 5,
  "Primary 5": 4,
  "Primary 6": 3,
  "JHS 1": 2,
  "JHS 2": 1,
  "JHS 3": 0,
};

function getYearsRemaining(className: string): number | null {
  const key = className.trim();
  if (key in GES_YEARS_REMAINING) return GES_YEARS_REMAINING[key];
  return null;
}

function getAdmissionYear(admissionDate: string): number {
  const d = new Date(admissionDate);
  if (!isNaN(d.getTime())) return d.getFullYear();
  return new Date().getFullYear();
}

/** Last two digits of expected completion year (when student finishes Basic 9). */
function getCompletionYearSuffix(
  className: string,
  admissionDate: string,
): number | null {
  const years = getYearsRemaining(className);
  if (years === null) return null;
  const admissionYear = getAdmissionYear(admissionDate);
  const completionYear = admissionYear + years;
  return completionYear % 100;
}

/** Generate student ID. With GES class + admissionDate, last two digits = completion year. */
function generateStudentId(
  firstName: string,
  lastName: string,
  className?: string,
  admissionDate?: string,
): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  const suffix = className && admissionDate
    ? getCompletionYearSuffix(className, admissionDate)
    : null;
  if (suffix !== null) {
    const middle = Math.floor(1000 + Math.random() * 9000);
    return `${firstInitial}${lastInitial}${middle}${suffix.toString().padStart(2, "0")}`;
  }
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${firstInitial}${lastInitial}${randomDigits}`;
}

// Generate admission number: ADM + year + sequence
async function generateAdmissionNumber(
  ctx: MutationCtx,
  schoolId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const students = await ctx.db
    .query("students")
    .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
    .collect();

  const sequence = students.length + 1;
  return `ADM${year}${sequence.toString().padStart(3, "0")}`;
}

// Verify the caller is a school admin and return their schoolId
async function getVerifiedSchoolId(
  ctx: MutationCtx,
  adminId: string,
): Promise<string> {
  const admin = await ctx.db.get(adminId as Id<"schoolAdmins">);
  if (!admin) {
    throw new Error("Unauthorized: Admin not found");
  }
  return admin.schoolId;
}

// Query: Get all students for a school
export const getStudentsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    return students;
  },
});

// Query: Get graduated students (alumni) for a school
export const getGraduatesBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "graduated"))
      .collect();

    return students;
  },
});

// Query: Get student by ID
export const getStudentById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // Fetch photo URL if storage ID exists
    let photoUrl: string | null = null;
    if (student.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(
        student.photoStorageId as Id<"_storage">,
      );
    }

    return {
      ...student,
      photoUrl,
    };
  },
});

export const getStudentByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .first();
    return student;
  },
});

/** Single student by email for portal login; rejects ambiguous duplicates. Tries exact trim then lowercase. */
export const getStudentByEmailForLogin = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.email.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    let matches = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", trimmed))
      .collect();
    if (matches.length === 0 && lower !== trimmed) {
      matches = await ctx.db
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", lower))
        .collect();
    }
    if (matches.length !== 1) return null;
    return matches[0];
  },
});

// Query: Get students by class
export const getStudentsByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    return students;
  },
});

// Query: Get students by department
export const getStudentsByDepartment = query({
  args: {
    schoolId: v.string(),
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
      .collect();

    return students;
  },
});

// Query: Get student statistics
export const getStudentStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const activeStudents = students.filter((s) => s.status === "active").length;
    const inactiveStudents = students.filter(
      (s) => s.status === "inactive",
    ).length;
    const fresherStudents = students.filter(
      (s) => s.status === "fresher",
    ).length;
    const continuingStudents = students.filter(
      (s) => s.status === "continuing",
    ).length;
    const transferredStudents = students.filter(
      (s) => s.status === "transferred",
    ).length;
    const graduatedStudents = students.filter(
      (s) => s.status === "graduated",
    ).length;

    // Current students only (exclude graduated) for total and breakdowns
    const currentStudents = students.filter((s) => s.status !== "graduated");

    const byDepartment: Record<string, number> = {};
    for (const s of currentStudents) {
      const id = s.departmentId;
      byDepartment[id] = (byDepartment[id] ?? 0) + 1;
    }

    // Count by class (current students only)
    const classCounts = currentStudents.reduce(
      (acc: Record<string, number>, student) => {
        acc[student.className] = (acc[student.className] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      total: currentStudents.length,
      active: activeStudents,
      inactive: inactiveStudents,
      fresher: fresherStudents,
      continuing: continuingStudents,
      transferred: transferredStudents,
      graduated: graduatedStudents,
      byDepartment,
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
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        (student.middleName &&
          student.middleName.toLowerCase().includes(searchLower)) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        student.admissionNumber.toLowerCase().includes(searchLower) ||
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        student.parentEmail.toLowerCase().includes(searchLower),
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
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    nationality: v.optional(v.string()),
    religion: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.string(),
    classId: v.string(),
    className: v.string(),
    departmentId: v.id("departments"),
    rollNumber: v.optional(v.string()),
    admissionDate: v.string(),
    parentName: v.string(),
    parentEmail: v.string(),
    parentPhone: v.string(),
    parentOccupation: v.optional(v.string()),
    relationship: v.union(
      v.literal("father"),
      v.literal("mother"),
      v.literal("guardian"),
    ),
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
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("fresher"),
        v.literal("continuing"),
        v.literal("transferred"),
        v.literal("graduated"),
      ),
    ),
    houseId: v.optional(v.id("houses")),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error("Unauthorized: You do not have access to this school");
    }

    // Check if email already exists (if provided)
    if (args.email) {
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
        .first();

      if (existingStudent) {
        throw new Error(
          "A student with this email already exists in your school",
        );
      }
    }

    // Generate unique student ID (GES: last two digits = completion year when class is known)
    let studentId = generateStudentId(
      args.firstName,
      args.lastName,
      args.className,
      args.admissionDate,
    );
    let existingId = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", studentId))
      .first();

    while (existingId) {
      studentId = generateStudentId(
        args.firstName,
        args.lastName,
        args.className,
        args.admissionDate,
      );
      existingId = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", studentId))
        .first();
    }

    // Generate admission number
    const admissionNumber = await generateAdmissionNumber(ctx, args.schoolId);

    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(studentId, 12);

    const studentDbId = await ctx.db.insert("students", {
      schoolId: args.schoolId,
      studentId,
      admissionNumber,
      password: hashedPassword, // Default login: studentId, stored like teachers (bcrypt)
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
      departmentId: args.departmentId,
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
      status: args.status || "fresher",
      houseId: args.houseId,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Update class student count
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", args.classId))
      .first();

    if (classData) {
      await ctx.db.patch(classData._id, {
        currentStudentCount: classData.currentStudentCount + 1,
        updatedAt: now,
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      timestamp: now,
      userId: args.createdBy,
      userName: "School Admin",
      action: "CREATE",
      entity: "Student",
      entityId: studentDbId,
      details: `Added student: ${args.firstName} ${args.lastName} (${studentId})`,
      ipAddress: "0.0.0.0",
    });

    return {
      studentId: studentDbId,
      generatedStudentId: studentId,
      admissionNumber,
    };
  },
});

// Mutation: Update student
export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    nationality: v.optional(v.string()),
    religion: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    classId: v.optional(v.string()),
    className: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    rollNumber: v.optional(v.string()),
    admissionDate: v.optional(v.string()),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    parentOccupation: v.optional(v.string()),
    relationship: v.optional(
      v.union(v.literal("father"), v.literal("mother"), v.literal("guardian")),
    ),
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
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("fresher"),
        v.literal("continuing"),
        v.literal("transferred"),
        v.literal("graduated"),
      ),
    ),
    houseId: v.optional(v.id("houses")),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Student not found");
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (student.schoolId !== callerSchoolId) {
      throw new Error("Unauthorized: You do not have access to this student");
    }

    // If email is being updated, check for duplicates
    if (args.email && args.email !== student.email) {
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .filter((q) => q.eq(q.field("schoolId"), student.schoolId))
        .first();

      if (existingStudent && existingStudent._id !== args.studentId) {
        throw new Error(
          "A student with this email already exists in your school",
        );
      }
    }

    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.middleName !== undefined) updateData.middleName = args.middleName;
    if (args.dateOfBirth !== undefined)
      updateData.dateOfBirth = args.dateOfBirth;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.nationality !== undefined)
      updateData.nationality = args.nationality;
    if (args.religion !== undefined) updateData.religion = args.religion;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.classId !== undefined) updateData.classId = args.classId;
    if (args.className !== undefined) updateData.className = args.className;
    if (args.departmentId !== undefined) updateData.departmentId = args.departmentId;
    if (args.rollNumber !== undefined) updateData.rollNumber = args.rollNumber;
    if (args.admissionDate !== undefined)
      updateData.admissionDate = args.admissionDate;
    if (args.parentName !== undefined) updateData.parentName = args.parentName;
    if (args.parentEmail !== undefined)
      updateData.parentEmail = args.parentEmail;
    if (args.parentPhone !== undefined)
      updateData.parentPhone = args.parentPhone;
    if (args.parentOccupation !== undefined)
      updateData.parentOccupation = args.parentOccupation;
    if (args.relationship !== undefined)
      updateData.relationship = args.relationship;
    if (args.secondaryContactName !== undefined)
      updateData.secondaryContactName = args.secondaryContactName;
    if (args.secondaryContactPhone !== undefined)
      updateData.secondaryContactPhone = args.secondaryContactPhone;
    if (args.secondaryContactRelationship !== undefined)
      updateData.secondaryContactRelationship =
        args.secondaryContactRelationship;
    if (args.emergencyContactName !== undefined)
      updateData.emergencyContactName = args.emergencyContactName;
    if (args.emergencyContactPhone !== undefined)
      updateData.emergencyContactPhone = args.emergencyContactPhone;
    if (args.emergencyContactRelationship !== undefined)
      updateData.emergencyContactRelationship =
        args.emergencyContactRelationship;
    if (args.medicalConditions !== undefined)
      updateData.medicalConditions = args.medicalConditions;
    if (args.allergies !== undefined) updateData.allergies = args.allergies;
    if (args.photoStorageId !== undefined)
      updateData.photoStorageId = args.photoStorageId;
    if (args.birthCertificateStorageId !== undefined)
      updateData.birthCertificateStorageId = args.birthCertificateStorageId;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.houseId !== undefined) updateData.houseId = args.houseId;

    await ctx.db.patch(args.studentId, updateData);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      timestamp: now,
      userId: args.updatedBy,
      userName: "School Admin",
      action: "UPDATE",
      entity: "Student",
      entityId: args.studentId,
      details: `Updated student: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: "0.0.0.0",
    });

    return { success: true };
  },
});

// Mutation: Update student password (portal self-service; hashed server-side via API)
export const updateStudentPassword = mutation({
  args: {
    studentId: v.id("students"),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    await ctx.db.patch(args.studentId, {
      password: args.hashedPassword,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Mutation: Delete student
export const deleteStudent = mutation({
  args: {
    studentId: v.id("students"),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Student not found");
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (student.schoolId !== callerSchoolId) {
      throw new Error("Unauthorized: You do not have access to this student");
    }

    // Delete photo from storage if exists
    if (student.photoStorageId) {
      try {
        await ctx.storage.delete(student.photoStorageId as Id<"_storage">);
      } catch (error) {
        console.error("Failed to delete photo:", error);
      }
    }

    // Delete birth certificate from storage if exists
    if (student.birthCertificateStorageId) {
      try {
        await ctx.storage.delete(
          student.birthCertificateStorageId as Id<"_storage">,
        );
      } catch (error) {
        console.error("Failed to delete birth certificate:", error);
      }
    }

    // Update class student count
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
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
    await ctx.db.insert("auditLogs", {
      timestamp: now,
      userId: args.deletedBy,
      userName: "School Admin",
      action: "DELETE",
      entity: "Student",
      entityId: args.studentId,
      details: `Deleted student: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: "0.0.0.0",
    });

    return { success: true };
  },
});

// Mutation: Bulk delete students
export const bulkDeleteStudents = mutation({
  args: {
    studentIds: v.array(v.id("students")),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student || student.schoolId !== callerSchoolId) {
          failCount++;
          continue;
        }

        // Update class student count
        const classData = await ctx.db
          .query("classes")
          .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
          .first();

        if (classData && classData.currentStudentCount > 0) {
          await ctx.db.patch(classData._id, {
            currentStudentCount: classData.currentStudentCount - 1,
            updatedAt: now,
          });
        }

        await ctx.db.delete(studentId);

        // Create audit log
        await ctx.db.insert("auditLogs", {
          timestamp: now,
          userId: args.deletedBy,
          userName: "School Admin",
          action: "DELETE",
          entity: "Student",
          entityId: studentId,
          details: `Deleted student: ${student.firstName} ${student.lastName} (${student.studentId})`,
          ipAddress: "0.0.0.0",
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
    studentId: v.id("students"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("fresher"),
      v.literal("continuing"),
      v.literal("transferred"),
      v.literal("graduated"),
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Student not found");
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (student.schoolId !== callerSchoolId) {
      throw new Error("Unauthorized: You do not have access to this student");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.studentId, {
      status: args.status,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      timestamp: now,
      userId: args.updatedBy,
      userName: "School Admin",
      action: "UPDATE",
      entity: "Student",
      entityId: args.studentId,
      details: `Changed student status to ${args.status}: ${student.firstName} ${student.lastName} (${student.studentId})`,
      ipAddress: "0.0.0.0",
    });

    return { success: true };
  },
});

// Mutation: Transfer student to different class
export const transferStudent = mutation({
  args: {
    studentId: v.id("students"),
    newClassId: v.string(),
    newClassName: v.string(),
    newDepartmentId: v.id("departments"),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);

    if (!student) {
      throw new Error("Student not found");
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (student.schoolId !== callerSchoolId) {
      throw new Error("Unauthorized: You do not have access to this student");
    }

    const now = new Date().toISOString();

    // Update old class count
    const oldClass = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
      .first();

    if (oldClass && oldClass.currentStudentCount > 0) {
      await ctx.db.patch(oldClass._id, {
        currentStudentCount: oldClass.currentStudentCount - 1,
        updatedAt: now,
      });
    }

    // Update new class count
    const newClass = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", args.newClassId))
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
      departmentId: args.newDepartmentId,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      timestamp: now,
      userId: args.updatedBy,
      userName: "School Admin",
      action: "UPDATE",
      entity: "Student",
      entityId: args.studentId,
      details: `Transferred student ${student.firstName} ${student.lastName} from ${student.className} to ${args.newClassName}`,
      ipAddress: "0.0.0.0",
    });

    return { success: true };
  },
});

// Mutation: Promote students (bulk)
export const promoteStudents = mutation({
  args: {
    studentIds: v.array(v.id("students")),
    newClassId: v.string(),
    newClassName: v.string(),
    newDepartmentId: v.id("departments"),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student || student.schoolId !== callerSchoolId) {
          failCount++;
          continue;
        }

        // Update old class count
        const oldClass = await ctx.db
          .query("classes")
          .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
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
          departmentId: args.newDepartmentId,
          status: "continuing",
          updatedAt: now,
        });

        // Create audit log
        await ctx.db.insert("auditLogs", {
          timestamp: now,
          userId: args.updatedBy,
          userName: "School Admin",
          action: "UPDATE",
          entity: "Student",
          entityId: studentId,
          details: `Promoted student ${student.firstName} ${student.lastName} from ${student.className} to ${args.newClassName}`,
          ipAddress: "0.0.0.0",
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to promote student ${studentId}:`, error);
      }
    }

    // Update new class count
    const newClass = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", args.newClassId))
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
    studentIds: v.array(v.id("students")),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("fresher"),
      v.literal("continuing"),
      v.literal("transferred"),
      v.literal("graduated"),
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db.get(studentId);

        if (!student || student.schoolId !== callerSchoolId) {
          failCount++;
          continue;
        }

        // Update student status
        await ctx.db.patch(studentId, {
          status: args.status,
          updatedAt: now,
        });

        // Create audit log
        await ctx.db.insert("auditLogs", {
          timestamp: now,
          userId: args.updatedBy,
          userName: "School Admin",
          action: "UPDATE",
          entity: "Student",
          entityId: studentId,
          details: `Changed student status to ${args.status}: ${student.firstName} ${student.lastName} (${student.studentId})`,
          ipAddress: "0.0.0.0",
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

// Get student photo URL from storage
export const getStudentPhotoUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as Id<"_storage">);
    return url;
  },
});
// Query: Get students by class ID (for teacher portal)
// classId here is the Convex document _id of the class
export const getStudentsByClassId = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    // First, get the class to find its classCode
    const classDoc = await ctx.db.get(args.classId as Id<"classes">);

    if (!classDoc) {
      return [];
    }

    // Students store classCode as their classId field
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", classDoc.classCode))
      .collect();

    // Fetch photo URLs for each student
    const studentsWithPhotos = await Promise.all(
      students.map(async (student) => {
        let photoUrl: string | null = null;
        if (student.photoStorageId) {
          photoUrl = await ctx.storage.getUrl(
            student.photoStorageId as Id<"_storage">,
          );
        }
        return {
          ...student,
          photoUrl,
        };
      }),
    );

    return studentsWithPhotos;
  },
});

// --- Student portal (no password in responses) ---

export const getStudentPortalProfile = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    let photoUrl: string | null = null;
    if (student.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(
        student.photoStorageId as Id<"_storage">,
      );
    }

    const { password: _pw, ...rest } = student;
    void _pw;
    return { ...rest, photoUrl };
  },
});

export const getHomeworkForStudentPortal = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return [];

    const classDoc = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
      .first();

    if (!classDoc || classDoc.schoolId !== student.schoolId) return [];

    const limit = args.limit ?? 50;
    const rows = await ctx.db
      .query("homework")
      .withIndex("by_class", (q) =>
        q.eq("schoolId", student.schoolId).eq("classId", classDoc._id),
      )
      .collect();

    const active = rows.filter((h) => h.status === "active");
    active.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    return active.slice(0, limit);
  },
});

export const getTimetableForStudentPortal = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const classDoc = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
      .first();

    if (!classDoc || classDoc.schoolId !== student.schoolId) {
      return null;
    }

    const timetable = await ctx.db
      .query("timetables")
      .withIndex("by_class", (q) =>
        q.eq("schoolId", student.schoolId).eq("classId", classDoc._id),
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!timetable) {
      return { timetable: null, periods: [], assignments: [] };
    }

    const periods = await ctx.db
      .query("periods")
      .withIndex("by_timetable", (q) => q.eq("timetableId", timetable._id))
      .collect();

    const assignments = await ctx.db
      .query("timetableAssignments")
      .withIndex("by_timetable", (q) => q.eq("timetableId", timetable._id))
      .collect();

    return { timetable, periods, assignments };
  },
});

function deriveStudentPortalEventStatus(
  startDate: string,
  endDate: string,
  startTime: string | undefined,
  endTime: string | undefined,
  isAllDay: boolean,
  storedStatus: "upcoming" | "ongoing" | "completed" | "cancelled",
): "upcoming" | "ongoing" | "completed" | "cancelled" {
  if (storedStatus === "cancelled") return "cancelled";
  const startStr =
    isAllDay || !startTime ? startDate : `${startDate}T${startTime}`;
  const endStr = isAllDay || !endTime ? endDate : `${endDate}T${endTime}`;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "completed";
}

/** Published announcements visible to this student (school-wide, their class, or their department). */
export const getAnnouncementsForStudentPortal = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return [];

    const classDoc = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
      .first();
    if (!classDoc || classDoc.schoolId !== student.schoolId) return [];

    const cap = args.limit ?? 15;
    const rows = await ctx.db
      .query("announcements")
      .withIndex("by_school_status", (q) =>
        q.eq("schoolId", student.schoolId).eq("status", "published"),
      )
      .order("desc")
      .take(100);

    const visible = rows.filter((a) => {
      if (a.targetType === "school") return true;
      if (a.targetType === "class") return a.targetId === classDoc._id;
      if (a.targetType === "department")
        return a.targetId === student.departmentId;
      return false;
    });
    return visible.slice(0, cap);
  },
});

/** School events this student may see (audience rules), with derived upcoming/ongoing status. */
export const getEventsForStudentPortal = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return [];

    const classDoc = await ctx.db
      .query("classes")
      .withIndex("by_class_code", (q) => q.eq("classCode", student.classId))
      .first();
    if (!classDoc || classDoc.schoolId !== student.schoolId) return [];

    const classConvexId = classDoc._id;
    const limit = args.limit ?? 40;

    const all = await ctx.db
      .query("events")
      .withIndex("by_school", (q) => q.eq("schoolId", student.schoolId))
      .collect();

    const visible = all.filter((e) => {
      if (e.audienceType === "staff_only") return false;
      if (e.audienceType === "all_school") return true;
      if (e.audienceType === "specific_classes") {
        const targets = e.targetClasses ?? [];
        return (
          targets.includes(classConvexId) ||
          targets.includes(student.classId)
        );
      }
      if (e.audienceType === "specific_departments") {
        const deptIds = (e.targetDepartmentIds ?? []).map((id) => String(id));
        return deptIds.includes(String(student.departmentId));
      }
      return false;
    });

    const enriched = visible.map((e) => ({
      _id: e._id,
      eventTitle: e.eventTitle,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      isAllDay: e.isAllDay,
      location: e.location,
      color: e.color,
      derivedStatus: deriveStudentPortalEventStatus(
        e.startDate,
        e.endDate,
        e.startTime,
        e.endTime,
        e.isAllDay,
        e.status,
      ),
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const active = enriched.filter((e) => {
      if (e.derivedStatus === "cancelled") return false;
      const end = new Date(
        e.isAllDay || !e.endTime ? e.endDate : `${e.endDate}T${e.endTime}`,
      );
      return end.getTime() >= todayStart.getTime();
    });

    active.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    return active.slice(0, limit);
  },
});

/** Published exam marks for the student portal (studentId matches teacher marks entry: Convex `students` document id). */
export const getPublishedMarksForStudentPortal = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return [];

    const cap = args.limit ?? 40;
    const byDocId = await ctx.db
      .query("studentMarks")
      .withIndex("by_student", (q) =>
        q.eq("schoolId", student.schoolId).eq("studentId", student._id),
      )
      .collect();
    const byHumanId = await ctx.db
      .query("studentMarks")
      .withIndex("by_student", (q) =>
        q.eq("schoolId", student.schoolId).eq("studentId", student.studentId),
      )
      .collect();
    const merged = new Map<string, (typeof byDocId)[0]>();
    for (const m of [...byDocId, ...byHumanId]) {
      merged.set(m._id, m);
    }
    const marks = Array.from(merged.values());

    const published = marks.filter((m) => m.submissionStatus === "published");
    published.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return published.slice(0, cap);
  },
});
