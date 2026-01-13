import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

// Get all timetables for a school
export const getTimetables = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const timetables = await ctx.db
      .query('timetables')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    return timetables;
  },
});

// Get a single timetable with its periods grouped by day
export const getTimetable = query({
  args: { timetableId: v.id('timetables') },
  handler: async (ctx, args) => {
    const timetable = await ctx.db.get(args.timetableId);
    if (!timetable) return null;

    const periods = await ctx.db
      .query('periods')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();

    // Group periods by day
    const periodsByDay: Record<Day, typeof periods> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    periods.forEach((period) => {
      periodsByDay[period.day].push(period);
    });

    return { timetable, periodsByDay };
  },
});

// Get timetable assignments for a specific timetable
export const getAssignments = query({
  args: { timetableId: v.id('timetables') },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();
    return assignments;
  },
});

// Get timetables by class
export const getTimetablesByClass = query({
  args: { schoolId: v.string(), classId: v.string() },
  handler: async (ctx, args) => {
    const timetables = await ctx.db
      .query('timetables')
      .withIndex('by_class', (q) => 
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      )
      .collect();
    return timetables;
  },
});

// Get timetables by teacher
export const getTimetablesByTeacher = query({
  args: { schoolId: v.string(), teacherId: v.string() },
  handler: async (ctx, args) => {
    // Get all assignments for this teacher
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_teacher', (q) => 
        q.eq('schoolId', args.schoolId).eq('teacherId', args.teacherId)
      )
      .collect();

    // Get unique timetable IDs
    const timetableIds = [...new Set(assignments.map(a => a.timetableId))];

    // Get all timetables
    const timetables = await Promise.all(
      timetableIds.map(id => ctx.db.get(id))
    );

    return timetables.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

// Create a new weekly timetable with default periods for all weekdays
export const createTimetable = mutation({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    className: v.string(),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if timetable already exists for this class
    const existing = await ctx.db
      .query('timetables')
      .withIndex('by_class', (q) => 
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      )
      .first();

    if (existing) {
      throw new Error(`Weekly timetable for ${args.className} already exists`);
    }

    // Create timetable
    const timetableId = await ctx.db.insert('timetables', {
      schoolId: args.schoolId,
      classId: args.classId,
      className: args.className,
      academicYearId: args.academicYearId,
      termId: args.termId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: args.createdBy,
    });

    // Default periods structure
    const defaultPeriods = [
      { name: 'Assembly', startTime: '07:30', endTime: '08:00', type: 'break' as const },
      { name: 'Period 1', startTime: '08:00', endTime: '09:10', type: 'class' as const },
      { name: 'Period 2', startTime: '09:10', endTime: '10:20', type: 'class' as const },
      { name: 'Break Time', startTime: '10:20', endTime: '10:40', type: 'break' as const },
      { name: 'Period 3', startTime: '10:45', endTime: '11:55', type: 'class' as const },
      { name: 'Period 4', startTime: '11:55', endTime: '13:05', type: 'class' as const },
      { name: 'Lunch Time', startTime: '13:05', endTime: '13:35', type: 'break' as const },
      { name: 'Period 5', startTime: '13:35', endTime: '14:45', type: 'class' as const },
      { name: 'Period 6', startTime: '14:45', endTime: '15:55', type: 'class' as const },
      { name: 'Closing', startTime: '15:55', endTime: '16:00', type: 'break' as const },
    ];

    // Create periods for all 5 weekdays
    const weekdays: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    for (const day of weekdays) {
      for (const period of defaultPeriods) {
        await ctx.db.insert('periods', {
          timetableId,
          day,
          periodName: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          periodType: period.type,
          duration: calculateDuration(period.startTime, period.endTime),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return timetableId;
  },
});

// Update a timetable
export const updateTimetable = mutation({
  args: {
    timetableId: v.id('timetables'),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'))),
  },
  handler: async (ctx, args) => {
    const { timetableId, ...updates } = args;
    
    await ctx.db.patch(timetableId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return timetableId;
  },
});

// Delete a timetable and its periods/assignments
export const deleteTimetable = mutation({
  args: { timetableId: v.id('timetables') },
  handler: async (ctx, args) => {
    // Delete all periods
    const periods = await ctx.db
      .query('periods')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();
    
    for (const period of periods) {
      await ctx.db.delete(period._id);
    }

    // Delete all assignments
    const assignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();
    
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete timetable
    await ctx.db.delete(args.timetableId);
  },
});

// Bulk delete timetables
export const bulkDeleteTimetables = mutation({
  args: { timetableIds: v.array(v.id('timetables')) },
  handler: async (ctx, args) => {
    for (const timetableId of args.timetableIds) {
      // Delete all periods
      const periods = await ctx.db
        .query('periods')
        .withIndex('by_timetable', (q) => q.eq('timetableId', timetableId))
        .collect();
      
      for (const period of periods) {
        await ctx.db.delete(period._id);
      }

      // Delete all assignments
      const assignments = await ctx.db
        .query('timetableAssignments')
        .withIndex('by_timetable', (q) => q.eq('timetableId', timetableId))
        .collect();
      
      for (const assignment of assignments) {
        await ctx.db.delete(assignment._id);
      }

      // Delete timetable
      await ctx.db.delete(timetableId);
    }
  },
});

// Update period times (for inline editing)
export const updatePeriod = mutation({
  args: {
    periodId: v.id('periods'),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const duration = calculateDuration(args.startTime, args.endTime);
    
    await ctx.db.patch(args.periodId, {
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
    });

    return args.periodId;
  },
});

// Assign teacher and subject to a period
export const assignTeacherToSlot = mutation({
  args: {
    timetableId: v.id('timetables'),
    periodId: v.id('periods'),
    teacherId: v.string(),
    teacherName: v.string(),
    subjectId: v.string(),
    subjectName: v.string(),
    classId: v.string(),
    className: v.string(),
    schoolId: v.string(),
    day: v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday')
    ),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for teacher conflicts (same teacher, same day, overlapping time)
    const existingAssignments = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_teacher', (q) => 
        q.eq('schoolId', args.schoolId).eq('teacherId', args.teacherId)
      )
      .filter((q) => q.eq(q.field('day'), args.day))
      .collect();

    // Check for time overlap
    for (const assignment of existingAssignments) {
      if (assignment.periodId !== args.periodId) {
        const hasOverlap = checkTimeOverlap(
          args.startTime,
          args.endTime,
          assignment.startTime,
          assignment.endTime
        );

        if (hasOverlap) {
          throw new Error(
            `Teacher ${args.teacherName} is already assigned to ${assignment.className} during this time on ${args.day}`
          );
        }
      }
    }

    // Check if assignment already exists for this period
    const existing = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_period', (q) => q.eq('periodId', args.periodId))
      .first();

    if (existing) {
      // Update existing assignment
      await ctx.db.patch(existing._id, {
        teacherId: args.teacherId,
        teacherName: args.teacherName,
        subjectId: args.subjectId,
        subjectName: args.subjectName,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      // Create new assignment
      const assignmentId = await ctx.db.insert('timetableAssignments', {
        timetableId: args.timetableId,
        periodId: args.periodId,
        teacherId: args.teacherId,
        teacherName: args.teacherName,
        subjectId: args.subjectId,
        subjectName: args.subjectName,
        classId: args.classId,
        className: args.className,
        schoolId: args.schoolId,
        day: args.day,
        startTime: args.startTime,
        endTime: args.endTime,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return assignmentId;
    }
  },
});

// Remove assignment from a period
export const removeAssignment = mutation({
  args: { periodId: v.id('periods') },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('timetableAssignments')
      .withIndex('by_period', (q) => q.eq('periodId', args.periodId))
      .first();

    if (assignment) {
      await ctx.db.delete(assignment._id);
    }
  },
});

// Helper function to calculate duration in minutes
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}

// Helper function to check time overlap
function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

function timeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number);
  return hour * 60 + min;
}
