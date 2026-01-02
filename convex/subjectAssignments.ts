import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Assign subject to teacher
export const assignSubjectToTeacher = mutation({
  args: {
    subjectId: v.id("subjects"),
    teacherId: v.id("teachers"),
    schoolId: v.id("schools"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if assignment already exists
    const existing = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_subject_teacher", (q) =>
        q.eq("subjectId", args.subjectId).eq("teacherId", args.teacherId)
      )
      .first();

    if (existing) {
      throw new Error("This subject is already assigned to this teacher");
    }

    const assignmentId = await ctx.db.insert("subjectAssignments", {
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      classId: undefined,
      schoolId: args.schoolId,
      assignedAt: Date.now(),
      assignedBy: args.userId,
    });

    return assignmentId;
  },
});

// Assign subject to class
export const assignSubjectToClass = mutation({
  args: {
    subjectId: v.id("subjects"),
    classId: v.id("classes"),
    schoolId: v.id("schools"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if assignment already exists
    const existing = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_subject_class", (q) =>
        q.eq("subjectId", args.subjectId).eq("classId", args.classId)
      )
      .first();

    if (existing) {
      throw new Error("This subject is already assigned to this class");
    }

    const assignmentId = await ctx.db.insert("subjectAssignments", {
      subjectId: args.subjectId,
      teacherId: undefined,
      classId: args.classId,
      schoolId: args.schoolId,
      assignedAt: Date.now(),
      assignedBy: args.userId,
    });

    return assignmentId;
  },
});

// Remove assignment
export const removeAssignment = mutation({
  args: {
    assignmentId: v.id("subjectAssignments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.assignmentId);
  },
});

// Get assignments by subject
export const getAssignmentsBySubject = query({
  args: {
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    // Fetch related data
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const teacher = assignment.teacherId
          ? await ctx.db.get(assignment.teacherId)
          : null;
        const classData = assignment.classId
          ? await ctx.db.get(assignment.classId)
          : null;

        return {
          ...assignment,
          teacher,
          class: classData,
        };
      })
    );

    return enrichedAssignments;
  },
});

// Get assignments by teacher
export const getAssignmentsByTeacher = query({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const subject = await ctx.db.get(assignment.subjectId);
        return {
          ...assignment,
          subject,
        };
      })
    );

    return enrichedAssignments;
  },
});

// Get assignments by class
export const getAssignmentsByClass = query({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const subject = await ctx.db.get(assignment.subjectId);
        return {
          ...assignment,
          subject,
        };
      })
    );

    return enrichedAssignments;
  },
});

// Get all assignments for a school
export const getAssignmentsBySchool = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("subjectAssignments")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const subject = await ctx.db.get(assignment.subjectId);
        const teacher = assignment.teacherId
          ? await ctx.db.get(assignment.teacherId)
          : null;
        const classData = assignment.classId
          ? await ctx.db.get(assignment.classId)
          : null;

        return {
          ...assignment,
          subject,
          teacher,
          class: classData,
        };
      })
    );

    return enrichedAssignments;
  },
});