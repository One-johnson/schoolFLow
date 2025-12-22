import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all sections for a school or class
export const getSections = query({
  args: {
    schoolId: v.optional(v.id("schools")),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    let sectionsQuery;

    if (args.classId) {
      sectionsQuery = ctx.db
        .query("sections")
        .withIndex("by_class", (q) => q.eq("classId", args.classId!));
    } else if (args.schoolId) {
      sectionsQuery = ctx.db
        .query("sections")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!));
    } else {
      throw new Error("Either schoolId or classId must be provided");
    }

    const sections = await sectionsQuery.collect();

    // Get class and teacher info for each section
    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => {
        const cls = await ctx.db.get(section.classId);
        let teacher = null;
        
        if (section.classTeacherId) {
          const teacherData = await ctx.db.get(section.classTeacherId);
          if (teacherData) {
            teacher = {
              id: teacherData._id,
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
              email: teacherData.email,
            };
          }
        }

        // Get student count
        const students = await ctx.db
          .query("students")
          .withIndex("by_section", (q) => q.eq("sectionId", section._id))
          .collect();

        return {
          id: section._id,
          schoolId: section.schoolId,
          classId: section.classId,
          className: cls?.name || "Unknown",
          classLevel: cls?.level || 0,
          name: section.name,
          capacity: section.capacity,
          classTeacher: teacher,
          room: section.room,
          studentCount: students.length,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
        };
      })
    );

    return sectionsWithDetails.sort((a, b) => {
      if (a.classLevel !== b.classLevel) {
        return a.classLevel - b.classLevel;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

// Get a single section by ID
export const getSectionById = query({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    
    if (!section) {
      return null;
    }

    const cls = await ctx.db.get(section.classId);
    let teacher = null;
    
    if (section.classTeacherId) {
      const teacherData = await ctx.db.get(section.classTeacherId);
      if (teacherData) {
        teacher = {
          id: teacherData._id,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          email: teacherData.email,
        };
      }
    }

    return {
      id: section._id,
      schoolId: section.schoolId,
      classId: section.classId,
      className: cls?.name || "Unknown",
      name: section.name,
      capacity: section.capacity,
      classTeacher: teacher,
      room: section.room,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  },
});

// Create a new section
export const createSection = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    name: v.string(),
    capacity: v.number(),
    classTeacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if section with same name exists for this class
    const existingSection = await ctx.db
      .query("sections")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingSection) {
      throw new Error("Section with this name already exists for this class");
    }

    // Verify class exists
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify teacher exists and has teacher role
    if (args.classTeacherId) {
      const teacher = await ctx.db.get(args.classTeacherId);
      if (!teacher) {
        throw new Error("Teacher not found");
      }
      if (teacher.role !== "teacher" && teacher.role !== "principal" && teacher.role !== "school_admin") {
        throw new Error("Selected user is not a teacher");
      }
    }

    const now = Date.now();

    const sectionId = await ctx.db.insert("sections", {
      schoolId: args.schoolId,
      classId: args.classId,
      name: args.name,
      capacity: args.capacity,
      classTeacherId: args.classTeacherId,
      room: args.room,
      createdAt: now,
      updatedAt: now,
    });

    return sectionId;
  },
});

// Update a section
export const updateSection = mutation({
  args: {
    sectionId: v.id("sections"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    classTeacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sectionId, ...updates } = args;

    const section = await ctx.db.get(sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Verify teacher exists and has teacher role if provided
    if (args.classTeacherId) {
      const teacher = await ctx.db.get(args.classTeacherId);
      if (!teacher) {
        throw new Error("Teacher not found");
      }
      if (teacher.role !== "teacher" && teacher.role !== "principal" && teacher.role !== "school_admin") {
        throw new Error("Selected user is not a teacher");
      }
    }

    await ctx.db.patch(sectionId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return sectionId;
  },
});

// Delete a section
export const deleteSection = mutation({
  args: {
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Check if there are students
    const students = await ctx.db
      .query("students")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();

    if (students.length > 0) {
      throw new Error("Cannot delete section with enrolled students.");
    }

    await ctx.db.delete(args.sectionId);

    return { success: true };
  },
});
