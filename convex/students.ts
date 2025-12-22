import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";
import type { Id } from "./_generated/dataModel";

// Get all students for a school
export const getSchoolStudents = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let studentsQuery = ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId));

    let students = await studentsQuery.collect();

    // Apply filters
    if (args.classId) {
      students = students.filter((student) => student.classId === args.classId);
    }

    if (args.sectionId) {
      students = students.filter((student) => student.sectionId === args.sectionId);
    }

    if (args.status) {
      students = students.filter((student) => student.status === args.status);
    }

    // Get user, class, and section details
    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const user = await ctx.db.get(student.userId);
        let cls = null;
        let section = null;

        if (student.classId) {
          cls = await ctx.db.get(student.classId);
        }

        if (student.sectionId) {
          section = await ctx.db.get(student.sectionId);
        }

        // Get parent details
        const parents = student.parentIds
          ? await Promise.all(
              student.parentIds.map(async (parentId) => {
                const parent = await ctx.db.get(parentId);
                if (parent) {
                  return {
                    id: parent._id,
                    firstName: parent.firstName,
                    lastName: parent.lastName,
                    email: parent.email,
                    phone: parent.phone,
                  };
                }
                return null;
              })
            )
          : [];

        return {
          id: student._id,
          userId: student.userId,
          schoolId: student.schoolId,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phone: user?.phone,
          photo: user?.photo,
          admissionNumber: student.admissionNumber,
          className: cls?.name,
          classLevel: cls?.level,
          sectionName: section?.name,
          rollNumber: student.rollNumber,
          dateOfBirth: student.dateOfBirth,
          bloodGroup: student.bloodGroup,
          address: student.address,
          emergencyContact: student.emergencyContact,
          medicalInfo: student.medicalInfo,
          documents: student.documents,
          enrollmentDate: student.enrollmentDate,
          status: student.status,
          parents: parents.filter((p) => p !== null),
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        };
      })
    );

    return studentsWithDetails.sort((a, b) => 
      a.admissionNumber.localeCompare(b.admissionNumber)
    );
  },
});

// Get a single student by ID
export const getStudentById = query({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    
    if (!student) {
      return null;
    }

    const user = await ctx.db.get(student.userId);
    let cls = null;
    let section = null;

    if (student.classId) {
      cls = await ctx.db.get(student.classId);
    }

    if (student.sectionId) {
      section = await ctx.db.get(student.sectionId);
    }

    // Get parent details
    const parents = student.parentIds
      ? await Promise.all(
          student.parentIds.map(async (parentId) => {
            const parent = await ctx.db.get(parentId);
            if (parent) {
              return {
                id: parent._id,
                firstName: parent.firstName,
                lastName: parent.lastName,
                email: parent.email,
                phone: parent.phone,
              };
            }
            return null;
          })
        )
      : [];

    return {
      id: student._id,
      userId: student.userId,
      schoolId: student.schoolId,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone,
      photo: user?.photo,
      admissionNumber: student.admissionNumber,
      classId: student.classId,
      sectionId: student.sectionId,
      className: cls?.name,
      sectionName: section?.name,
      rollNumber: student.rollNumber,
      dateOfBirth: student.dateOfBirth,
      bloodGroup: student.bloodGroup,
      address: student.address,
      emergencyContact: student.emergencyContact,
      medicalInfo: student.medicalInfo,
      documents: student.documents,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      parents: parents.filter((p) => p !== null),
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  },
});

// Create a new student
export const createStudent = mutation({
  args: {
    schoolId: v.id("schools"),
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    admissionNumber: v.string(),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    rollNumber: v.optional(v.string()),
    dateOfBirth: v.number(),
    bloodGroup: v.optional(v.string()),
    address: v.string(),
    emergencyContact: v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
    }),
    medicalInfo: v.optional(v.string()),
    enrollmentDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if admission number already exists
    const existingStudent = await ctx.db
      .query("students")
      .withIndex("by_admission_number", (q) =>
        q.eq("schoolId", args.schoolId).eq("admissionNumber", args.admissionNumber)
      )
      .first();

    if (existingStudent) {
      throw new Error("Admission number already exists");
    }

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

    // Verify class and section exist if provided
    if (args.classId) {
      const cls = await ctx.db.get(args.classId);
      if (!cls) {
        throw new Error("Class not found");
      }
    }

    if (args.sectionId) {
      const section = await ctx.db.get(args.sectionId);
      if (!section) {
        throw new Error("Section not found");
      }
    }

    const now = Date.now();

    // Hash password
    const hashedPassword = bcrypt.hashSync(args.password, 10);

    // Create user record
    const userId = await ctx.db.insert("users", {
      schoolId: args.schoolId,
      email: args.email,
      password: hashedPassword,
      role: "student",
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      status: "active",
      joiningDate: args.enrollmentDate || now,
      createdAt: now,
      updatedAt: now,
    });

    // Create student record
    const studentId = await ctx.db.insert("students", {
      userId,
      schoolId: args.schoolId,
      admissionNumber: args.admissionNumber,
      classId: args.classId,
      sectionId: args.sectionId,
      rollNumber: args.rollNumber,
      dateOfBirth: args.dateOfBirth,
      bloodGroup: args.bloodGroup,
      address: args.address,
      emergencyContact: args.emergencyContact,
      medicalInfo: args.medicalInfo,
      enrollmentDate: args.enrollmentDate || now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return studentId;
  },
});

// Update a student
export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    rollNumber: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
      })
    ),
    medicalInfo: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { studentId, firstName, lastName, phone, classId, sectionId, rollNumber, bloodGroup, address, emergencyContact, medicalInfo, status } = args;

    const student = await ctx.db.get(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Update user record
    const userUpdates: Record<string, string | number | undefined> = {};
    if (firstName !== undefined) userUpdates.firstName = firstName;
    if (lastName !== undefined) userUpdates.lastName = lastName;
    if (phone !== undefined) userUpdates.phone = phone;
    if (status !== undefined) userUpdates.status = status;

    if (Object.keys(userUpdates).length > 0) {
      await ctx.db.patch(student.userId, {
        ...userUpdates,
        updatedAt: Date.now(),
      });
    }

    // Update student record
    const studentUpdates: Record<string, string | number | Id<"classes"> | Id<"sections"> | { name: string; relationship: string; phone: string } | undefined> = {};
    if (classId !== undefined) studentUpdates.classId = classId;
    if (sectionId !== undefined) studentUpdates.sectionId = sectionId;
    if (rollNumber !== undefined) studentUpdates.rollNumber = rollNumber;
    if (bloodGroup !== undefined) studentUpdates.bloodGroup = bloodGroup;
    if (address !== undefined) studentUpdates.address = address;
    if (emergencyContact !== undefined) studentUpdates.emergencyContact = emergencyContact;
    if (medicalInfo !== undefined) studentUpdates.medicalInfo = medicalInfo;
    if (status !== undefined) studentUpdates.status = status;

    if (Object.keys(studentUpdates).length > 0) {
      await ctx.db.patch(studentId, {
        ...studentUpdates,
        updatedAt: Date.now(),
      });
    }

    return studentId;
  },
});

// Delete a student
export const deleteStudent = mutation({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Delete student record
    await ctx.db.delete(args.studentId);

    // Delete user record
    await ctx.db.delete(student.userId);

    // Delete associated sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", student.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Generate next admission number
export const generateAdmissionNumber = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const year = new Date().getFullYear();
    const count = students.length + 1;
    const admissionNumber = `${year}${String(count).padStart(4, "0")}`;

    return admissionNumber;
  },
});
