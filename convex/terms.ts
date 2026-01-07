import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Helper function to generate term code
function generateTermCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `TRM${digits}`;
}

// Query: Get all terms for a school
export const getTermsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();
    
    // Fetch academic year details for each term
    const termsWithYear = await Promise.all(
      terms.map(async (term) => {
        const academicYear = await ctx.db.get(term.academicYearId);
        return {
          ...term,
          academicYearName: academicYear?.yearName || 'Unknown',
        };
      })
    );

    return termsWithYear.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },
});

// Query: Get terms by academic year
export const getTermsByAcademicYear = query({
  args: { academicYearId: v.id('academicYears') },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_academic_year', (q) => q.eq('academicYearId', args.academicYearId))
      .collect();
    
    return terms.sort((a, b) => a.termNumber - b.termNumber);
  },
});

// Query: Get current term for a school
export const getCurrentTerm = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const currentTerm = await ctx.db
      .query('terms')
      .withIndex('by_current', (q) =>
        q.eq('schoolId', args.schoolId).eq('isCurrentTerm', true)
      )
      .first();
    
    if (currentTerm) {
      const academicYear = await ctx.db.get(currentTerm.academicYearId);
      return {
        ...currentTerm,
        academicYearName: academicYear?.yearName || 'Unknown',
      };
    }
    
    return null;
  },
});

// Query: Get term by ID
export const getTermById = query({
  args: { termId: v.id('terms') },
  handler: async (ctx, args) => {
    const term = await ctx.db.get(args.termId);
    if (term) {
      const academicYear = await ctx.db.get(term.academicYearId);
      return {
        ...term,
        academicYearName: academicYear?.yearName || 'Unknown',
      };
    }
    return null;
  },
});

// Query: Get term statistics
export const getTermStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const stats = {
      total: terms.length,
      active: terms.filter((t) => t.status === 'active').length,
      upcoming: terms.filter((t) => t.status === 'upcoming').length,
      completed: terms.filter((t) => t.status === 'completed').length,
      term1: terms.filter((t) => t.termNumber === 1).length,
      term2: terms.filter((t) => t.termNumber === 2).length,
      term3: terms.filter((t) => t.termNumber === 3).length,
    };

    return stats;
  },
});

// Mutation: Add new term
export const addTerm = mutation({
  args: {
    schoolId: v.string(),
    academicYearId: v.id('academicYears'),
    termName: v.string(),
    termNumber: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    holidayStart: v.optional(v.string()),
    holidayEnd: v.optional(v.string()),
    description: v.optional(v.string()),
    setAsCurrent: v.boolean(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify academic year exists
    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    // If setting as current, unset all other current terms for this school
    if (args.setAsCurrent) {
      const currentTerms = await ctx.db
        .query('terms')
        .withIndex('by_current', (q) =>
          q.eq('schoolId', args.schoolId).eq('isCurrentTerm', true)
        )
        .collect();

      for (const term of currentTerms) {
        await ctx.db.patch(term._id, { isCurrentTerm: false });
      }
    }

    const termCode = generateTermCode();
    const now = new Date().toISOString();

    // Determine status based on dates and setAsCurrent flag
    let status: 'active' | 'upcoming' | 'completed' = 'upcoming';
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

    const termId = await ctx.db.insert('terms', {
      schoolId: args.schoolId,
      academicYearId: args.academicYearId,
      termCode,
      termName: args.termName,
      termNumber: args.termNumber,
      startDate: args.startDate,
      endDate: args.endDate,
      status,
      isCurrentTerm: args.setAsCurrent,
      holidayStart: args.holidayStart,
      holidayEnd: args.holidayEnd,
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
      entity: 'term',
      entityId: termId,
      details: `Created term: ${args.termName} for ${academicYear.yearName}`,
      ipAddress: 'system',
    });

    return termId;
  },
});

// Mutation: Update term
export const updateTerm = mutation({
  args: {
    termId: v.id('terms'),
    termName: v.string(),
    termNumber: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    holidayStart: v.optional(v.string()),
    holidayEnd: v.optional(v.string()),
    description: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const term = await ctx.db.get(args.termId);
    if (!term) {
      throw new Error('Term not found');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.termId, {
      termName: args.termName,
      termNumber: args.termNumber,
      startDate: args.startDate,
      endDate: args.endDate,
      holidayStart: args.holidayStart,
      holidayEnd: args.holidayEnd,
      description: args.description,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'term',
      entityId: args.termId,
      details: `Updated term: ${args.termName}`,
      ipAddress: 'system',
    });

    return args.termId;
  },
});

// Mutation: Set current term
export const setCurrentTerm = mutation({
  args: {
    termId: v.id('terms'),
    schoolId: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Unset all current terms for this school
    const currentTerms = await ctx.db
      .query('terms')
      .withIndex('by_current', (q) =>
        q.eq('schoolId', args.schoolId).eq('isCurrentTerm', true)
      )
      .collect();

    for (const term of currentTerms) {
      await ctx.db.patch(term._id, { isCurrentTerm: false });
    }

    // Set new current term and update status
    await ctx.db.patch(args.termId, {
      isCurrentTerm: true,
      status: 'active',
      updatedAt: new Date().toISOString(),
    });

    const term = await ctx.db.get(args.termId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: new Date().toISOString(),
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'term',
      entityId: args.termId,
      details: `Set as current term: ${term?.termName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Update term status
export const updateTermStatus = mutation({
  args: {
    termId: v.id('terms'),
    status: v.union(
      v.literal('active'),
      v.literal('upcoming'),
      v.literal('completed')
    ),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    await ctx.db.patch(args.termId, {
      status: args.status,
      updatedAt: now,
    });

    const term = await ctx.db.get(args.termId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: now,
      userId: args.updatedBy,
      userName: 'School Admin',
      action: 'UPDATE',
      entity: 'term',
      entityId: args.termId,
      details: `Updated status to ${args.status} for: ${term?.termName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Delete term
export const deleteTerm = mutation({
  args: {
    termId: v.id('terms'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const term = await ctx.db.get(args.termId);
    if (!term) {
      throw new Error('Term not found');
    }

    await ctx.db.delete(args.termId);

    // Create audit log
    await ctx.db.insert('auditLogs', {
      timestamp: new Date().toISOString(),
      userId: args.deletedBy,
      userName: 'School Admin',
      action: 'DELETE',
      entity: 'term',
      entityId: args.termId,
      details: `Deleted term: ${term.termName}`,
      ipAddress: 'system',
    });
  },
});

// Mutation: Bulk delete terms
export const bulkDeleteTerms = mutation({
  args: {
    termIds: v.array(v.id('terms')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const termId of args.termIds) {
      try {
        const term = await ctx.db.get(termId);
        if (!term) {
          failCount++;
          errors.push(`Term not found`);
          continue;
        }

        await ctx.db.delete(termId);
        successCount++;

        // Create audit log
        await ctx.db.insert('auditLogs', {
          timestamp: new Date().toISOString(),
          userId: args.deletedBy,
          userName: 'School Admin',
          action: 'BULK_DELETE',
          entity: 'term',
          entityId: termId,
          details: `Bulk deleted term: ${term.termName}`,
          ipAddress: 'system',
        });
      } catch (error) {
        failCount++;
        errors.push(`Failed to delete term`);
      }
    }

    return { successCount, failCount, errors };
  },
});
