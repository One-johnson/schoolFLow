import { v } from 'convex/values';
import { query } from './_generated/server';

// Get all assignments for a specific teacher
export const getAssignmentsByTeacher = query({
  args: { 
    schoolId: v.string(), 
    teacherId: v.string() 
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_teacher', (q) => 
        q.eq('schoolId', args.schoolId).eq('teacherId', args.teacherId)
      )
      .collect();
    
    return assignments;
  },
});

// Get all assignments for a specific class
export const getAssignmentsByClass = query({
  args: { 
    schoolId: v.string(), 
    classId: v.string() 
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_class', (q) => 
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      )
      .collect();
    
    return assignments;
  },
});

// Get all assignments for a school
export const getAllAssignments = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    
    return assignments;
  },
});

// Get all assignments for a specific subject
export const getAssignmentsBySubject = query({
  args: {
    schoolId: v.string(),
    subjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_subject', (q) => 
        q.eq('schoolId', args.schoolId).eq('subjectId', args.subjectId)
      )
      .collect();

    return assignments;
  },
});