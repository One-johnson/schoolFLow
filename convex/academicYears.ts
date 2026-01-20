import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Helper function to generate academic year code
function generateYearCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `AY${digits}`;
}

// Query: Get all academic years for a school
export const getYearsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const years = await ctx.db
      .query('academicYears')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    
    return years.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },
});

// Query: Get current academic year for a school
export const getCurrentYear = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const currentYear = await ctx.db
      .query('academicYears')
      .withIndex('by_current', (q) =>
        q.eq('schoolId', args.schoolId).eq('isCurrentYear', true)
      )
      .first();
    
    return currentYear;
  },
});

// Query: Get academic year by ID
export const getYearById = query({
  args: { yearId: v.id('academicYears') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.yearId);
  },
});

// Query: Get academic year statistics
export const getYearStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const years = await ctx.db
      .query('academicYears')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const stats = {
      total: years.length,
      active: years.filter((y) => y.status === 'active').length,
      upcoming: years.filter((y) => y.status === 'upcoming').length,
      completed: years.filter((y) => y.status === 'completed').length,
      archived: years.filter((y) => y.status === 'archived').length,
    };

    return stats;
  },
});

// Mutation: Add new academic year
export const addAcademicYear = mutation({
  args: {
    schoolId: v.string(),
    yearName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.optional(v.string()),
    setAsCurrent: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // If setting as current, unset all other current years for this school
    if (args.setAsCurrent) {
      const currentYears = await ctx.db
        .query('academicYears')
        .withIndex('by_current', (q) =>
          q.eq('schoolId', args.schoolId).eq('isCurrentYear', true)
        )
        .collect();

      for (const year of currentYears) {
        await ctx.db.patch(year._id, { isCurrentYear: false });
      }
    }

    const yearCode = generateYearCode();
    const now = new Date().toISOString();

    // Determine status based on dates and setAsCurrent flag
    let status: 'active' | 'upcoming' | 'completed' | 'archived' = 'upcoming';
    const today = new Date();
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);

    if (args.setAsCurrent) {
      status = 'active';
    } else if (today >= start && today <= end) {
      status = 'active';
    } else if (today > end) {
      status = 'completed';
    }

    const yearId = await ctx.db.insert('academicYears', {
      schoolId: args.schoolId,
      yearCode,
      yearName: args.yearName,
      startDate: args.startDate,
      endDate: args.endDate,
      status,
      isCurrentYear: args.setAsCurrent,
      description: args.description,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.createdBy,
      userName: 'School Admin',
      action: 'CREATE',
      entity: 'academic_year',
      entityId: yearId,
      details: `Created academic year: ${args.yearName}`,
      ipAddress: 'system',
    });

    return yearId;
  },
});

// Mutation: Update academic year
export const updateAcademicYear = mutation({
  args: {
    yearId: v.id('academicYears'),
    yearName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    description: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const year = await ctx.db.get(args.yearId);
    if (!year) {
      throw new Error('Academic year not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.yearId, {
      yearName: args.yearName,
      startDate: args.startDate,
      endDate: args.endDate,
      description: args.description,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'academic_year',
      entityId: args.yearId,
      details: `Updated academic year: ${args.yearName}`,
      ipAddress: 'system',
    });

    return args.yearId;
  },
});

// Mutation: Set current academic year
export const setCurrentYear = mutation({
  args: {
    yearId: v.id('academicYears'),
    schoolId: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Unset all current years for this school
    const currentYears = await ctx.db
      .query('academicYears')
      .withIndex('by_current', (q) =>
        q.eq('schoolId', args.schoolId).eq('isCurrentYear', true)
      )
      .collect();

    for (const year of currentYears) {
      await ctx.db.patch(year._id, { isCurrentYear: false });
    }

    // Set new current year and update status
    await ctx.db.patch(args.yearId, {
      isCurrentYear: true,
      status: 'active',
      updatedAt: new Date().toISOString(),
    });

    const year = await ctx.db.get(args.yearId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: new Date().toISOString(),
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'academic_year',
      entityId: args.yearId,
      details: `Set as current academic year: ${year?.yearName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Update academic year status
export const updateYearStatus = mutation({
  args: {
    yearId: v.id('academicYears'),
    status: v.union(
      v.literal('active'),
      v.literal('upcoming'),
      v.literal('completed'),
      v.literal('archived')
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    await ctx.db.patch(args.yearId, {
      status: args.status,
      updatedAt: now,
    });

    const year = await ctx.db.get(args.yearId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'academic_year',
      entityId: args.yearId,
      details: `Updated status to ${args.status} for: ${year?.yearName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Delete academic year
export const deleteAcademicYear = mutation({
  args: {
    yearId: v.id('academicYears'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const year = await ctx.db.get(args.yearId);
    if (!year) {
      throw new Error('Academic year not found');
    }

    // Check if there are any terms associated with this year
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_academic_year', (q) => q.eq('academicYearId', args.yearId))
      .collect();

    if (terms.length > 0) {
      throw new Error('Cannot delete academic year with associated terms. Delete terms first.');
    }

    await ctx.db.delete(args.yearId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: new Date().toISOString(),
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'academic_year',
      entityId: args.yearId,
      details: `Deleted academic year: ${year.yearName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Bulk delete academic years
export const bulkDeleteAcademicYears = mutation({
  args: {
    yearIds: v.array(v.id('academicYears')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const yearId of args.yearIds) {
      try {
        const year = await ctx.db.get(yearId);
        if (!year) {
          failCount++;
          errors.push(`Year not found`);
          continue;
        }

        // Check for associated terms
        const terms = await ctx.db
          .query('terms')
          .withIndex('by_academic_year', (q) => q.eq('academicYearId', yearId))
          .collect();

        if (terms.length > 0) {
          failCount++;
          errors.push(`${year.yearName} has associated terms`);
          continue;
        }

        await ctx.db.delete(yearId);
        successCount++;

        // Create audit log
        await ctx.db.insert('auditLogs', {
          timestamp: new Date().toISOString(),
          userId: args.deletedBy,
          userName: 'School Admin',
          action: 'BULK_DELETE',
          entity: 'academic_year',
          entityId: yearId,
          details: `Bulk deleted academic year: ${year.yearName}`,
          ipAddress: 'system',
        });
      } catch (error) {
        failCount++;
        errors.push(`Failed to delete year`);
      }
    }

    return { successCount, failCount, errors };
  },
});

// Query: Get active academic years with terms
export const getActiveAcademicYears = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    // Get all active academic years for this school
    const years = await ctx.db
      .query('academicYears')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // For each year, fetch its terms
    const yearsWithTerms = await Promise.all(
      years.map(async (year) => {
        const terms = await ctx.db
          .query('terms')
          .withIndex('by_academic_year', (q) => q.eq('academicYearId', year._id))
          .collect();

        return {
          ...year,
          terms: terms.map((term) => ({
            termId: term._id,
            termName: term.termName,
            termNumber: term.termNumber,
            startDate: term.startDate,
            endDate: term.endDate,
            status: term.status,
          })),
        };
      })
    );

    return yearsWithTerms.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },
});
