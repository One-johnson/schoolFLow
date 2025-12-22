import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all classes for a school
export const getSchoolClasses = query({
  args: {
    schoolId: v.id("schools"),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let classesQuery = ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId));

    const classes = await classesQuery.collect();

    // Filter by academic year if provided
    const filteredClasses = args.academicYear
      ? classes.filter((cls) => cls.academicYear === args.academicYear)
      : classes;

    // Get section counts for each class
    const classesWithSections = await Promise.all(
      filteredClasses.map(async (cls) => {
        const sections = await ctx.db
          .query("sections")
          .withIndex("by_class", (q) => q.eq("classId", cls._id))
          .collect();

        return {
          id: cls._id,
          schoolId: cls.schoolId,
          name: cls.name,
          level: cls.level,
          academicYear: cls.academicYear,
          description: cls.description,
          sectionCount: sections.length,
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt,
        };
      })
    );

    return classesWithSections.sort((a, b) => a.level - b.level);
  },
});

// Get a single class by ID
export const getClassById = query({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    
    if (!cls) {
      return null;
    }

    return {
      id: cls._id,
      schoolId: cls.schoolId,
      name: cls.name,
      level: cls.level,
      academicYear: cls.academicYear,
      description: cls.description,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
    };
  },
});

// Create a new class
export const createClass = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.string(),
    level: v.number(),
    academicYear: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if class with same name and year exists
    const existingClass = await ctx.db
      .query("classes")
      .withIndex("by_school_and_year", (q) =>
        q.eq("schoolId", args.schoolId).eq("academicYear", args.academicYear)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingClass) {
      throw new Error("Class with this name already exists for this academic year");
    }

    const now = Date.now();

    const classId = await ctx.db.insert("classes", {
      schoolId: args.schoolId,
      name: args.name,
      level: args.level,
      academicYear: args.academicYear,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    return classId;
  },
});

// Update a class
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    academicYear: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { classId, ...updates } = args;

    const cls = await ctx.db.get(classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    await ctx.db.patch(classId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return classId;
  },
});

// Delete a class
export const deleteClass = mutation({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const cls = await ctx.db.get(args.classId);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Check if there are sections
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    if (sections.length > 0) {
      throw new Error("Cannot delete class with existing sections. Delete sections first.");
    }

    // Check if there are students
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    if (students.length > 0) {
      throw new Error("Cannot delete class with enrolled students.");
    }

    await ctx.db.delete(args.classId);

    return { success: true };
  },
});
