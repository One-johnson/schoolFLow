import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Department color codes
const DEPARTMENT_COLORS: Record<string, string> = {
  Creche: "#FF6B9D",
  Kindergarten: "#FFA07A",
  Primary: "#4A90E2",
  "Junior High": "#50C878",
};

// Generate subject code: 2 initials + 4 random digits
function generateSubjectCode(subjectName: string): string {
  const initials = subjectName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${initials}${randomDigits}`;
}

// Create subject
export const createSubject = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.string(),
    department: v.string(),
    description: v.optional(v.string()),
    classIds: v.optional(v.array(v.id("classes"))),
    teacherIds: v.optional(v.array(v.id("users"))),
    credits: v.optional(v.number()),
    isCore: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subjectCode = generateSubjectCode(args.name);
    const colorCode = DEPARTMENT_COLORS[args.department] || "#666666";

    const subjectId = await ctx.db.insert("subjects", {
      schoolId: args.schoolId,
      subjectCode,
      name: args.name,
      department: args.department,
      description: args.description,
      colorCode,
      classIds: args.classIds,
      teacherIds: args.teacherIds,
      credits: args.credits,
      isCore: args.isCore,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return subjectId;
  },
});

// Bulk create subjects
export const bulkCreateSubjects = mutation({
  args: {
    schoolId: v.id("schools"),
    department: v.string(),
    subjectNames: v.array(v.string()),
    classIds: v.optional(v.array(v.id("classes"))),
    teacherIds: v.optional(v.array(v.id("users"))),
    credits: v.optional(v.number()),
    isCore: v.boolean(),
  },
  handler: async (ctx, args) => {
    const colorCode = DEPARTMENT_COLORS[args.department] || "#666666";
    
    const subjectIds = await Promise.all(
      args.subjectNames.map(async (name) => {
        const subjectCode = generateSubjectCode(name);
        
        return await ctx.db.insert("subjects", {
          schoolId: args.schoolId,
          subjectCode,
          name,
          department: args.department,
          colorCode,
          classIds: args.classIds,
          teacherIds: args.teacherIds,
          credits: args.credits,
          isCore: args.isCore,
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      })
    );

    return subjectIds;
  },
});

// Get all subjects for a school
export const getSubjectsBySchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Enrich with class and teacher names
    const enrichedSubjects = await Promise.all(
      subjects.map(async (subject) => {
        const classNames = subject.classIds
          ? await Promise.all(
              subject.classIds.map(async (classId) => {
                const classData = await ctx.db.get(classId);
                return classData?.name || "";
              })
            )
          : [];

        const teacherNames = subject.teacherIds
          ? await Promise.all(
              subject.teacherIds.map(async (teacherId) => {
                const user = await ctx.db.get(teacherId);
                return user ? `${user.firstName} ${user.lastName}` : "";
              })
            )
          : [];

        return {
          ...subject,
          classNames: classNames.filter(Boolean),
          teacherNames: teacherNames.filter(Boolean),
        };
      })
    );

    return enrichedSubjects;
  },
});

// Get subject by ID
export const getSubjectById = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subjectId);
  },
});

// Update subject
export const updateSubject = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    description: v.optional(v.string()),
    classIds: v.optional(v.array(v.id("classes"))),
    teacherIds: v.optional(v.array(v.id("users"))),
    credits: v.optional(v.number()),
    isCore: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { subjectId, ...updates } = args;
    
    // Get current subject to update color if department changes
    const currentSubject = await ctx.db.get(subjectId);
    if (!currentSubject) {
      throw new Error("Subject not found");
    }

    const updateData: Record<string, unknown> = { ...updates, updatedAt: Date.now() };

    // Update color code if department changes
    if (updates.department && updates.department !== currentSubject.department) {
      updateData.colorCode = DEPARTMENT_COLORS[updates.department] || "#666666";
    }

    await ctx.db.patch(subjectId, updateData);
  },
});

// Delete subject
export const deleteSubject = mutation({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subjectId);
  },
});

// Bulk delete subjects
export const bulkDeleteSubjects = mutation({
  args: { subjectIds: v.array(v.id("subjects")) },
  handler: async (ctx, args) => {
    await Promise.all(
      args.subjectIds.map((subjectId) => ctx.db.delete(subjectId))
    );
  },
});

// Bulk update subject status
export const bulkUpdateSubjectStatus = mutation({
  args: {
    subjectIds: v.array(v.id("subjects")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.subjectIds.map((subjectId) =>
        ctx.db.patch(subjectId, {
          status: args.status,
          updatedAt: Date.now(),
        })
      )
    );
  },
});

// Bulk assign subjects to classes
export const bulkAssignSubjectsToClasses = mutation({
  args: {
    subjectIds: v.array(v.id("subjects")),
    classIds: v.array(v.id("classes")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.subjectIds.map(async (subjectId) => {
        const subject = await ctx.db.get(subjectId);
        if (subject) {
          const existingClassIds = subject.classIds || [];
          const newClassIds = Array.from(
            new Set([...existingClassIds, ...args.classIds])
          );
          await ctx.db.patch(subjectId, {
            classIds: newClassIds,
            updatedAt: Date.now(),
          });
        }
      })
    );
  },
});

// Bulk assign subjects to teachers
export const bulkAssignSubjectsToTeachers = mutation({
  args: {
    subjectIds: v.array(v.id("subjects")),
    teacherIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.subjectIds.map(async (subjectId) => {
        const subject = await ctx.db.get(subjectId);
        if (subject) {
          const existingTeacherIds = subject.teacherIds || [];
          const newTeacherIds = Array.from(
            new Set([...existingTeacherIds, ...args.teacherIds])
          );
          await ctx.db.patch(subjectId, {
            teacherIds: newTeacherIds,
            updatedAt: Date.now(),
          });
        }
      })
    );
  },
});

// Get subject statistics
export const getSubjectStats = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const activeSubjects = subjects.filter((s) => s.status === "active").length;
    const inactiveSubjects = subjects.filter((s) => s.status === "inactive").length;

    const byDepartment = subjects.reduce(
      (acc, subject) => {
        acc[subject.department] = (acc[subject.department] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: subjects.length,
      active: activeSubjects,
      inactive: inactiveSubjects,
      byDepartment,
    };
  },
});
