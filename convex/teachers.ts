import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";
import type { Id } from "./_generated/dataModel";

// Get all teachers for a school
export const getSchoolTeachers = query({
  args: {
    schoolId: v.id("schools"),
    department: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let teachersQuery = ctx.db
      .query("teachers")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId));

    let teachers = await teachersQuery.collect();

    // Apply filters
    if (args.department) {
      teachers = teachers.filter((teacher) => teacher.department === args.department);
    }

    if (args.employmentType) {
      teachers = teachers.filter((teacher) => teacher.employmentType === args.employmentType);
    }

    if (args.status) {
      teachers = teachers.filter((teacher) => teacher.status === args.status);
    }

    // Get user details
    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const user = await ctx.db.get(teacher.userId);

        return {
          id: teacher._id,
          userId: teacher.userId,
          schoolId: teacher.schoolId,
          employeeId: teacher.employeeId,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phone: user?.phone,
          photo: user?.photo,
          qualifications: teacher.qualifications,
          subjectSpecializations: teacher.subjectSpecializations,
          yearsOfExperience: teacher.yearsOfExperience,
          employmentType: teacher.employmentType,
          department: teacher.department,
          dateOfJoining: teacher.dateOfJoining,
          salary: teacher.salary,
          emergencyContact: teacher.emergencyContact,
          documents: teacher.documents,
          bio: teacher.bio,
          status: teacher.status,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        };
      })
    );

    return teachersWithDetails.sort((a, b) => 
      a.employeeId.localeCompare(b.employeeId)
    );
  },
});

// Get a single teacher by ID
export const getTeacherById = query({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    
    if (!teacher) {
      return null;
    }

    const user = await ctx.db.get(teacher.userId);

    return {
      id: teacher._id,
      userId: teacher.userId,
      schoolId: teacher.schoolId,
      employeeId: teacher.employeeId,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone,
      photo: user?.photo,
      qualifications: teacher.qualifications,
      subjectSpecializations: teacher.subjectSpecializations,
      yearsOfExperience: teacher.yearsOfExperience,
      employmentType: teacher.employmentType,
      department: teacher.department,
      dateOfJoining: teacher.dateOfJoining,
      salary: teacher.salary,
      emergencyContact: teacher.emergencyContact,
      documents: teacher.documents,
      bio: teacher.bio,
      status: teacher.status,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
  },
});

// Helper function to generate employee ID
function generateEmployeeId(firstName: string, year: number): string {
  // Get first 2 letters of first name (uppercase)
  const initials = firstName.substring(0, 2).toUpperCase();
  
  // Add "TCH" identifier
  const identifier = "TCH";
  
  // Generate 4 random numbers
  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Get last 2 digits of year
  const yearSuffix = year.toString().slice(-2);
  
  return `${initials}${identifier}${randomNumbers}${yearSuffix}`;
}

// Create a new teacher
export const createTeacher = mutation({
  args: {
    schoolId: v.id("schools"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    qualifications: v.array(v.object({
      degree: v.string(),
      subject: v.string(),
      university: v.string(),
      yearObtained: v.number(),
    })),
    subjectSpecializations: v.array(v.string()),
    yearsOfExperience: v.number(),
    employmentType: v.string(),
    department: v.string(),
    dateOfJoining: v.number(),
    salary: v.optional(v.number()),
    emergencyContact: v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    }),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists in the school
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_school_and_email", (q) =>
        q.eq("schoolId", args.schoolId).eq("email", args.email)
      )
      .first();

    if (existingUser) {
      throw new Error("Email already exists in this school");
    }

    const now = Date.now();
    const joiningYear = new Date(args.dateOfJoining).getFullYear();
    
    // Generate employee ID (format: 2 letters + TCH + 4 numbers + 2 digit year)
    const employeeId = generateEmployeeId(args.firstName, joiningYear);

    // Hash employee ID to use as initial password
    const hashedPassword = await bcrypt.hash(employeeId, 10);

    // Create user record
    const userId = await ctx.db.insert("users", {
      schoolId: args.schoolId,
      email: args.email,
      password: hashedPassword,
      role: "teacher",
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      status: "active",
      joiningDate: args.dateOfJoining,
      createdAt: now,
      updatedAt: now,
    });

    // Create teacher record
    const teacherRecordId = await ctx.db.insert("teachers", {
      userId,
      schoolId: args.schoolId,
      employeeId,
      qualifications: args.qualifications,
      subjectSpecializations: args.subjectSpecializations,
      yearsOfExperience: args.yearsOfExperience,
      employmentType: args.employmentType,
      department: args.department,
      dateOfJoining: args.dateOfJoining,
      salary: args.salary,
      emergencyContact: args.emergencyContact,
      bio: args.bio,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { teacherRecordId, employeeId };
  },
});

// Update a teacher
export const updateTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    qualifications: v.optional(v.array(v.object({
      degree: v.string(),
      subject: v.string(),
      university: v.string(),
      yearObtained: v.number(),
    }))),
    subjectSpecializations: v.optional(v.array(v.string())),
    yearsOfExperience: v.optional(v.number()),
    employmentType: v.optional(v.string()),
    department: v.optional(v.string()),
    salary: v.optional(v.number()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
    bio: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { teacherId, firstName, lastName, phone, qualifications, subjectSpecializations, yearsOfExperience, employmentType, department, salary, emergencyContact, bio, status } = args;

    const teacher = await ctx.db.get(teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Update user record
    const userUpdates: Record<string, string | number | undefined> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (phone !== undefined) userUpdates.phone = phone;
    if (status !== undefined) userUpdates.status = status;

    if (Object.keys(userUpdates).length > 0) {
      await ctx.db.patch(teacher.userId, {
        ...userUpdates,
        updatedAt: Date.now(),
      });
    }

    // Update teacher record
    const teacherUpdates: Record<string, string | number | string[] | { degree: string; subject: string; university: string; yearObtained: number }[] | { name: string; phone: string; relationship: string } | { name: string; url: string; type: string; uploadedAt: number }[] | undefined> = {};
    if (qualifications !== undefined) teacherUpdates.qualifications = qualifications;
    if (subjectSpecializations !== undefined) teacherUpdates.subjectSpecializations = subjectSpecializations;
    if (yearsOfExperience !== undefined) teacherUpdates.yearsOfExperience = yearsOfExperience;
    if (employmentType !== undefined) teacherUpdates.employmentType = employmentType;
    if (department !== undefined) teacherUpdates.department = department;
    if (salary !== undefined) teacherUpdates.salary = salary;
    if (emergencyContact !== undefined) teacherUpdates.emergencyContact = emergencyContact;
    if (bio !== undefined) teacherUpdates.bio = bio;
    if (status !== undefined) teacherUpdates.status = status;

    if (Object.keys(teacherUpdates).length > 0) {
      await ctx.db.patch(teacherId, {
        ...teacherUpdates,
        updatedAt: Date.now(),
      });
    }

    return teacherId;
  },
});

// Delete a teacher
export const deleteTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Delete teacher record
    await ctx.db.delete(args.teacherId);

    // Delete user record
    await ctx.db.delete(teacher.userId);

    // Delete associated sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", teacher.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Bulk update teacher status
export const bulkUpdateStatus = mutation({
  args: {
    teacherIds: v.array(v.id("teachers")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate status - must be one of the valid teacher statuses
    const validStatuses = ["active", "on_leave", "resigned"];
    if (!validStatuses.includes(args.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const now = Date.now();
    
    for (const teacherId of args.teacherIds) {
      const teacher = await ctx.db.get(teacherId);
      if (!teacher) {
        continue; // Skip if teacher not found
      }
      
      // Update teacher record with the new status
      await ctx.db.patch(teacherId, {
        status: args.status,
        updatedAt: now,
      });

      // Map teacher status to user status
      // active → active
      // on_leave → inactive
      // resigned → inactive
      const userStatus = args.status === "active" ? "active" : "inactive";
      
      await ctx.db.patch(teacher.userId, {
        status: userStatus,
        updatedAt: now,
      });
    }
    
    return { success: true, count: args.teacherIds.length };
  },
});

// Bulk update teacher department
export const bulkUpdateDepartment = mutation({
  args: {
    teacherIds: v.array(v.id("teachers")),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    for (const teacherId of args.teacherIds) {
      const teacher = await ctx.db.get(teacherId);
      if (!teacher) {
        continue;
      }
      
      await ctx.db.patch(teacherId, {
        department: args.department,
        updatedAt: now,
      });
    }
    
    return { success: true, count: args.teacherIds.length };
  },
});
