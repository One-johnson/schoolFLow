import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Get all templates for a school
export const getTemplates = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query('timetableTemplates')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
    return templates;
  },
});

// Get a single template
export const getTemplate = query({
  args: { templateId: v.id('timetableTemplates') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Create a template from an existing timetable
export const createTemplate = mutation({
  args: {
    schoolId: v.string(),
    templateName: v.string(),
    description: v.optional(v.string()),
    timetableId: v.id('timetables'),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the timetable structure
    const timetable = await ctx.db.get(args.timetableId);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    // Get all periods for this timetable
    const periods = await ctx.db
      .query('periods')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.timetableId))
      .collect();

    // Extract period structure (unique periods from Monday)
    const mondayPeriods = periods.filter(p => p.day === 'monday');
    const periodStructure = mondayPeriods.map(p => ({
      periodName: p.periodName,
      startTime: p.startTime,
      endTime: p.endTime,
      periodType: p.periodType,
    }));

    // Create template
    const templateId = await ctx.db.insert('timetableTemplates', {
      templateName: args.templateName,
      description: args.description,
      schoolId: args.schoolId,
      createdBy: args.createdBy,
      createdAt: new Date().toISOString(),
      periodStructure: JSON.stringify(periodStructure),
      isDefault: false,
      status: 'active',
    });

    return templateId;
  },
});

// Apply a template to create a new timetable
export const applyTemplate = mutation({
  args: {
    templateId: v.id('timetableTemplates'),
    schoolId: v.string(),
    classId: v.string(),
    className: v.string(),
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
      throw new Error(`Timetable for ${args.className} already exists`);
    }

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Parse period structure
    const periodStructure = JSON.parse(template.periodStructure) as Array<{
      periodName: string;
      startTime: string;
      endTime: string;
      periodType: 'class' | 'break';
    }>;

    // Create timetable
    const timetableId = await ctx.db.insert('timetables', {
      schoolId: args.schoolId,
      classId: args.classId,
      className: args.className,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: args.createdBy,
    });

    // Create periods for all 5 weekdays
    const weekdays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'> = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
    ];

    for (const day of weekdays) {
      for (const period of periodStructure) {
        await ctx.db.insert('periods', {
          timetableId,
          day,
          periodName: period.periodName,
          startTime: period.startTime,
          endTime: period.endTime,
          periodType: period.periodType,
          duration: calculateDuration(period.startTime, period.endTime),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return timetableId;
  },
});

// Clone a timetable (structure only or structure + assignments)
export const cloneTimetable = mutation({
  args: {
    sourceTimetableId: v.id('timetables'),
    targetClassId: v.string(),
    targetClassName: v.string(),
    schoolId: v.string(),
    createdBy: v.string(),
    includeAssignments: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if timetable already exists for target class
    const existing = await ctx.db
      .query('timetables')
      .withIndex('by_class', (q) => 
        q.eq('schoolId', args.schoolId).eq('classId', args.targetClassId)
      )
      .first();

    if (existing) {
      throw new Error(`Timetable for ${args.targetClassName} already exists`);
    }

    // Get source timetable
    const sourceTimetable = await ctx.db.get(args.sourceTimetableId);
    if (!sourceTimetable) {
      throw new Error('Source timetable not found');
    }

    // Create new timetable
    const newTimetableId = await ctx.db.insert('timetables', {
      schoolId: args.schoolId,
      classId: args.targetClassId,
      className: args.targetClassName,
      academicYearId: sourceTimetable.academicYearId,
      termId: sourceTimetable.termId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: args.createdBy,
    });

    // Get all periods from source timetable
    const sourcePeriods = await ctx.db
      .query('periods')
      .withIndex('by_timetable', (q) => q.eq('timetableId', args.sourceTimetableId))
      .collect();

    // Create periods mapping (old period ID -> new period ID)
    const periodMapping: Record<string, Id<'periods'>> = {};

    // Clone periods
    for (const period of sourcePeriods) {
      const newPeriodId = await ctx.db.insert('periods', {
        timetableId: newTimetableId,
        day: period.day,
        periodName: period.periodName,
        startTime: period.startTime,
        endTime: period.endTime,
        periodType: period.periodType,
        duration: period.duration,
        createdAt: new Date().toISOString(),
      });

      periodMapping[period._id] = newPeriodId;
    }

    // Clone assignments if requested
    if (args.includeAssignments) {
      const sourceAssignments = await ctx.db
        .query('timetableAssignments')
        .withIndex('by_timetable', (q) => q.eq('timetableId', args.sourceTimetableId))
        .collect();

      for (const assignment of sourceAssignments) {
        const newPeriodId = periodMapping[assignment.periodId];
        if (newPeriodId) {
          await ctx.db.insert('timetableAssignments', {
            timetableId: newTimetableId,
            periodId: newPeriodId,
            teacherId: assignment.teacherId,
            teacherName: assignment.teacherName,
            subjectId: assignment.subjectId,
            subjectName: assignment.subjectName,
            classId: args.targetClassId,
            className: args.targetClassName,
            schoolId: args.schoolId,
            day: assignment.day,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return newTimetableId;
  },
});

// Delete a template
export const deleteTemplate = mutation({
  args: { templateId: v.id('timetableTemplates') },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Soft delete
    await ctx.db.patch(args.templateId, {
      status: 'archived',
    });
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    templateId: v.id('timetableTemplates'),
    templateName: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;
    
    await ctx.db.patch(templateId, updates);
    return templateId;
  },
});

// Helper function
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
}
