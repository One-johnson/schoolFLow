import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin or teacher and return their schoolId
async function getVerifiedSchoolId(ctx: MutationCtx, callerId: string): Promise<string> {
  // Try schoolAdmins first
  const admin = await ctx.db.get(callerId as Id<'schoolAdmins'>);
  if (admin) {
    return admin.schoolId;
  }
  // Fall back to teachers table
  const teacher = await ctx.db.get(callerId as Id<'teachers'>);
  if (teacher) {
    return teacher.schoolId;
  }
  throw new Error('Unauthorized: Caller not found');
}

// Helper function to generate attendance code
function generateAttendanceCode(): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `ATT${randomDigits}`;
}

// ========== MUTATIONS ==========

// Create attendance session for a class
export const createAttendance = mutation({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    className: v.string(),
    date: v.string(),
    session: v.union(v.literal('morning'), v.literal('afternoon'), v.literal('full_day')),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    totalStudents: v.number(),
    markedBy: v.string(),
    markedByName: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.markedBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();
    const attendanceCode = generateAttendanceCode();

    const attendanceId = await ctx.db.insert('attendance', {
      schoolId: args.schoolId,
      attendanceCode,
      classId: args.classId,
      className: args.className,
      date: args.date,
      session: args.session,
      academicYearId: args.academicYearId,
      termId: args.termId,
      totalStudents: args.totalStudents,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      status: 'pending',
      markedBy: args.markedBy,
      markedByName: args.markedByName,
      markedAt: now,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return attendanceId;
  },
});

// Mark individual student attendance
export const markStudentAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    schoolId: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    classId: v.string(),
    className: v.string(),
    date: v.string(),
    session: v.union(v.literal('morning'), v.literal('afternoon'), v.literal('full_day')),
    status: v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused')),
    arrivalTime: v.optional(v.string()),
    remarks: v.optional(v.string()),
    markedBy: v.string(),
    markedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.markedBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    // Get attendance code
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    // Check if record already exists
    const existingRecord = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .filter((q) => q.eq(q.field('studentId'), args.studentId))
      .first();

    if (existingRecord) {
      // Update existing record
      await ctx.db.patch(existingRecord._id, {
        status: args.status,
        arrivalTime: args.arrivalTime,
        remarks: args.remarks,
        updatedAt: now,
      });
      return existingRecord._id;
    }

    // Create new record
    const recordId = await ctx.db.insert('attendanceRecords', {
      schoolId: args.schoolId,
      attendanceId: args.attendanceId,
      attendanceCode: attendance.attendanceCode,
      studentId: args.studentId,
      studentName: args.studentName,
      classId: args.classId,
      className: args.className,
      date: args.date,
      session: args.session,
      status: args.status,
      arrivalTime: args.arrivalTime,
      remarks: args.remarks,
      markedBy: args.markedBy,
      markedByName: args.markedByName,
      createdAt: now,
      updatedAt: now,
    });

    return recordId;
  },
});

// Update attendance counts
export const updateAttendanceCounts = mutation({
  args: {
    attendanceId: v.id('attendance'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .collect();

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const excusedCount = records.filter((r) => r.status === 'excused').length;

    await ctx.db.patch(args.attendanceId, {
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Complete and lock attendance
export const completeAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.patch(args.attendanceId, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  },
});

// Lock attendance
export const lockAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.patch(args.attendanceId, {
      status: 'locked',
      updatedAt: new Date().toISOString(),
    });
  },
});

// Unlock attendance (admin only)
export const unlockAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.patch(args.attendanceId, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  },
});

// Admin override attendance record
export const adminOverrideAttendance = mutation({
  args: {
    recordId: v.id('attendanceRecords'),
    newStatus: v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused')),
    overriddenBy: v.string(),
    overriddenByName: v.string(),
    overrideReason: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) throw new Error('Attendance record not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.overriddenBy);
    if (callerSchoolId !== record.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.recordId, {
      previousStatus: record.status,
      status: args.newStatus,
      overriddenBy: args.overriddenBy,
      overriddenByName: args.overriddenByName,
      overriddenAt: now,
      overrideReason: args.overrideReason,
      updatedAt: now,
    });

    // Update counts
    const attendance = await ctx.db.get(record.attendanceId);
    if (attendance) {
      const records = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_attendance', (q) => q.eq('attendanceId', record.attendanceId))
        .collect();

      const presentCount = records.filter((r) => 
        r._id === args.recordId ? args.newStatus === 'present' : r.status === 'present'
      ).length;
      const absentCount = records.filter((r) => 
        r._id === args.recordId ? args.newStatus === 'absent' : r.status === 'absent'
      ).length;
      const lateCount = records.filter((r) => 
        r._id === args.recordId ? args.newStatus === 'late' : r.status === 'late'
      ).length;
      const excusedCount = records.filter((r) => 
        r._id === args.recordId ? args.newStatus === 'excused' : r.status === 'excused'
      ).length;

      await ctx.db.patch(record.attendanceId, {
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        updatedAt: now,
      });
    }
  },
});

// Delete attendance
export const deleteAttendance = mutation({
  args: {
    attendanceId: v.id('attendance'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Delete all records first
    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .collect();

    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    // Delete attendance
    await ctx.db.delete(args.attendanceId);
  },
});

// Bulk mark attendance for multiple classes
export const bulkMarkAttendance = mutation({
  args: {
    schoolId: v.string(),
    classIds: v.array(v.string()),
    date: v.string(),
    session: v.union(v.literal('morning'), v.literal('afternoon'), v.literal('full_day')),
    defaultStatus: v.union(v.literal('present'), v.literal('absent')),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    markedBy: v.string(),
    markedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.markedBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();
    const results: { classId: string; className: string; success: boolean; attendanceId?: Id<'attendance'>; error?: string; }[] = [];

    for (const classId of args.classIds) {
      try {
        // Get class details
        const classData = await ctx.db.get(classId as Id<'classes'>);
        if (!classData) {
          results.push({
            classId,
            className: 'Unknown',
            success: false,
            error: 'Class not found',
          });
          continue;
        }

        // Check if attendance already exists for this class/date/session
        const existingAttendance = await ctx.db
          .query('attendance')
          .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', classId))
          .filter((q) => q.eq(q.field('date'), args.date))
          .filter((q) => q.eq(q.field('session'), args.session))
          .first();

        if (existingAttendance) {
          results.push({
            classId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            className: (classData as any).name ?? 'Unknown',
            success: false,
            error: 'Attendance already exists',
          });
          continue;
        }

        // Get students in class
        const students = await ctx.db
          .query('students')
          .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
          .filter((q) => q.eq(q.field('classId'), classId))
          .filter((q) => q.eq(q.field('status'), 'active'))
          .collect();

        // Create attendance session
        const attendanceCode = generateAttendanceCode();
        const attendanceId = await ctx.db.insert('attendance', {
          schoolId: args.schoolId,
          attendanceCode,
          classId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          className: (classData as any).name ?? 'Unknown',
          date: args.date,
          session: args.session,
          academicYearId: args.academicYearId,
          termId: args.termId,
          totalStudents: students.length,
          presentCount: args.defaultStatus === 'present' ? students.length : 0,
          absentCount: args.defaultStatus === 'absent' ? students.length : 0,
          lateCount: 0,
          excusedCount: 0,
          status: 'completed',
          markedBy: args.markedBy,
          markedByName: args.markedByName,
          markedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // Create attendance records for all students
        for (const student of students) {
          await ctx.db.insert('attendanceRecords', {
            schoolId: args.schoolId,
            attendanceId,
            attendanceCode,
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            classId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            className: (classData as any).name ?? 'Unknown',
            date: args.date,
            session: args.session,
            status: args.defaultStatus,
            markedBy: args.markedBy,
            markedByName: args.markedByName,
            createdAt: now,
            updatedAt: now,
          });
        }

        results.push({
          classId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            className: (classData as any).name ?? 'Unknown',
          success: true,
          attendanceId,
        });
      } catch (error) {
        results.push({
          classId,
          className: 'Error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },
});

// ========== QUERIES ==========

// Get single attendance by ID
export const getAttendanceById = query({
  args: {
    attendanceId: v.id('attendance'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.attendanceId);
  },
});

// Get attendance by school
export const getAttendanceBySchool = query({
  args: {
    schoolId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();
  },
});

// Get attendance by class
export const getAttendanceByClass = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('attendance')
      .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', args.classId))
      .order('desc')
      .collect();
  },
});

// Get attendance by date
export const getAttendanceByDate = query({
  args: {
    schoolId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    return allAttendance.filter(
      (a) => a.date >= args.startDate && a.date <= args.endDate
    );
  },
});

// Get today's attendance
export const getTodayAttendance = query({
  args: {
    schoolId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    return await ctx.db
      .query('attendance')
      .withIndex('by_date', (q) => q.eq('schoolId', args.schoolId).eq('date', today))
      .collect();
  },
});

// Get attendance records for a session
export const getAttendanceRecords = query({
  args: {
    attendanceId: v.id('attendance'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .collect();
  },
});

// Get student attendance history
export const getStudentAttendanceHistory = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_student', (q) => q.eq('schoolId', args.schoolId).eq('studentId', args.studentId))
      .collect();

    if (args.startDate && args.endDate) {
      records = records.filter(
        (r) => r.date >= args.startDate! && r.date <= args.endDate!
      );
    }

    return records;
  },
});

// Get attendance stats for school
export const getAttendanceStats = query({
  args: {
    schoolId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let attendance = await ctx.db
      .query('attendance')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    if (args.startDate && args.endDate) {
      attendance = attendance.filter(
        (a) => a.date >= args.startDate! && a.date <= args.endDate!
      );
    }

    const totalSessions = attendance.length;
    const totalPresent = attendance.reduce((sum, a) => sum + a.presentCount, 0);
    const totalAbsent = attendance.reduce((sum, a) => sum + a.absentCount, 0);
    const totalLate = attendance.reduce((sum, a) => sum + a.lateCount, 0);
    const totalExcused = attendance.reduce((sum, a) => sum + a.excusedCount, 0);
    const totalMarked = totalPresent + totalAbsent + totalLate + totalExcused;

    const attendanceRate = totalMarked > 0 
      ? Math.round(((totalPresent + totalLate + totalExcused) / totalMarked) * 100) 
      : 0;

    return {
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalMarked,
      attendanceRate,
    };
  },
});

// Get student attendance rate
export const getStudentAttendanceRate = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_student', (q) => q.eq('schoolId', args.schoolId).eq('studentId', args.studentId))
      .collect();

    const totalDays = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;

    const attendanceRate = totalDays > 0 
      ? Math.round(((present + late + excused) / totalDays) * 100) 
      : 0;

    return {
      totalDays,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    };
  },
});

// Get pending attendance (classes without attendance today)
export const getPendingAttendance = query({
  args: {
    schoolId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all classes
    const classes = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // Get today's attendance
    const todayAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_date', (q) => q.eq('schoolId', args.schoolId).eq('date', today))
      .collect();

    const markedClassIds = new Set(todayAttendance.map((a) => a.classId));

    return classes.filter((c) => !markedClassIds.has(c._id));
  },
});

// Get attendance settings
export const getAttendanceSettings = query({
  args: {
    schoolId: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('attendanceSettings')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .first();

    if (!settings) {
      // Return default settings
      return {
        schoolId: args.schoolId,
        enableMorningSession: true,
        enableAfternoonSession: false,
        morningStartTime: '08:00',
        morningEndTime: '12:00',
        afternoonStartTime: '13:00',
        afternoonEndTime: '17:00',
        lateThresholdMinutes: 15,
        autoLockAttendance: false,
        lockAfterHours: 24,
        requireAdminApproval: false,
        notifyParentsOnAbsence: false,
      };
    }

    return settings;
  },
});

// Get class attendance statistics (for teacher dashboard)
export const getClassAttendanceStats = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    days: v.optional(v.number()), // Last N days, default 30
  },
  handler: async (ctx, args) => {
    const daysToFetch = args.days || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get attendance records for this class in date range
    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', args.classId))
      .collect();

    const filteredAttendance = attendance.filter(
      (a) => a.date >= startDateStr && a.date <= endDateStr
    );

    // Calculate totals
    const totalSessions = filteredAttendance.length;
    const totalPresent = filteredAttendance.reduce((sum, a) => sum + a.presentCount, 0);
    const totalAbsent = filteredAttendance.reduce((sum, a) => sum + a.absentCount, 0);
    const totalLate = filteredAttendance.reduce((sum, a) => sum + a.lateCount, 0);
    const totalExcused = filteredAttendance.reduce((sum, a) => sum + a.excusedCount, 0);
    const totalMarked = totalPresent + totalAbsent + totalLate + totalExcused;

    const attendanceRate = totalMarked > 0
      ? Math.round(((totalPresent + totalLate + totalExcused) / totalMarked) * 100)
      : 0;

    // Get daily breakdown for chart
    const dailyData = filteredAttendance.map((a) => ({
      date: a.date,
      present: a.presentCount,
      absent: a.absentCount,
      late: a.lateCount,
      excused: a.excusedCount,
      total: a.totalStudents,
      rate: a.totalStudents > 0
        ? Math.round(((a.presentCount + a.lateCount + a.excusedCount) / a.totalStudents) * 100)
        : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      totalMarked,
      attendanceRate,
      dailyData,
    };
  },
});

// Get students with low attendance (at risk)
export const getStudentsAtRisk = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    threshold: v.optional(v.number()), // Attendance rate threshold, default 80%
  },
  handler: async (ctx, args) => {
    const rateThreshold = args.threshold || 80;

    // Get all attendance records for this class
    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', args.classId))
      .collect();

    // Group by student
    const studentStats = new Map<string, { name: string; present: number; absent: number; late: number; excused: number; total: number }>();

    for (const record of records) {
      const existing = studentStats.get(record.studentId) || {
        name: record.studentName,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };

      existing.total++;
      if (record.status === 'present') existing.present++;
      else if (record.status === 'absent') existing.absent++;
      else if (record.status === 'late') existing.late++;
      else if (record.status === 'excused') existing.excused++;

      studentStats.set(record.studentId, existing);
    }

    // Calculate rates and filter at-risk students
    const atRiskStudents = [];
    for (const [studentId, stats] of studentStats.entries()) {
      const rate = stats.total > 0
        ? Math.round(((stats.present + stats.late + stats.excused) / stats.total) * 100)
        : 100;

      if (rate < rateThreshold) {
        atRiskStudents.push({
          studentId,
          studentName: stats.name,
          attendanceRate: rate,
          totalDays: stats.total,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          excused: stats.excused,
        });
      }
    }

    return atRiskStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);
  },
});

// Get attendance history for a class
export const getClassAttendanceHistory = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', args.classId))
      .order('desc')
      .collect();

    const limited = args.limit ? attendance.slice(0, args.limit) : attendance;

    return limited;
  },
});

// Check if attendance already exists for a date/class/session
export const checkAttendanceExists = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    date: v.string(),
    session: v.union(v.literal('morning'), v.literal('afternoon'), v.literal('full_day')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('attendance')
      .withIndex('by_class', (q) => q.eq('schoolId', args.schoolId).eq('classId', args.classId))
      .filter((q) => q.eq(q.field('date'), args.date))
      .filter((q) => q.eq(q.field('session'), args.session))
      .first();

    return existing;
  },
});

// Get attendance records for editing
export const getAttendanceForEdit = query({
  args: {
    attendanceId: v.id('attendance'),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) return null;

    const records = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .collect();

    return {
      attendance,
      records,
    };
  },
});

// Update entire attendance session (edit mode)
export const updateAttendanceSession = mutation({
  args: {
    attendanceId: v.id('attendance'),
    updates: v.array(v.object({
      studentId: v.string(),
      status: v.union(v.literal('present'), v.literal('absent'), v.literal('late'), v.literal('excused')),
    })),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) throw new Error('Attendance session not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== attendance.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now = new Date().toISOString();

    // Update each student's record
    for (const update of args.updates) {
      const existingRecord = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
        .filter((q) => q.eq(q.field('studentId'), update.studentId))
        .first();

      if (existingRecord) {
        await ctx.db.patch(existingRecord._id, {
          status: update.status,
          updatedAt: now,
        });
      }
    }

    // Recalculate counts
    const allRecords = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_attendance', (q) => q.eq('attendanceId', args.attendanceId))
      .collect();

    // Apply updates to calculate new counts
    const updatesMap = new Map(args.updates.map(u => [u.studentId, u.status]));

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    for (const record of allRecords) {
      const status = updatesMap.get(record.studentId) || record.status;
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') lateCount++;
      else if (status === 'excused') excusedCount++;
    }

    await ctx.db.patch(args.attendanceId, {
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Save attendance settings
export const saveAttendanceSettings = mutation({
  args: {
    schoolId: v.string(),
    updatedBy: v.string(),
    enableMorningSession: v.boolean(),
    enableAfternoonSession: v.boolean(),
    morningStartTime: v.optional(v.string()),
    morningEndTime: v.optional(v.string()),
    afternoonStartTime: v.optional(v.string()),
    afternoonEndTime: v.optional(v.string()),
    lateThresholdMinutes: v.optional(v.number()),
    autoLockAttendance: v.boolean(),
    lockAfterHours: v.optional(v.number()),
    requireAdminApproval: v.boolean(),
    notifyParentsOnAbsence: v.boolean(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.updatedBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const existingSettings = await ctx.db
      .query('attendanceSettings')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .first();

    const now = new Date().toISOString();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        enableMorningSession: args.enableMorningSession,
        enableAfternoonSession: args.enableAfternoonSession,
        morningStartTime: args.morningStartTime,
        morningEndTime: args.morningEndTime,
        afternoonStartTime: args.afternoonStartTime,
        afternoonEndTime: args.afternoonEndTime,
        lateThresholdMinutes: args.lateThresholdMinutes,
        autoLockAttendance: args.autoLockAttendance,
        lockAfterHours: args.lockAfterHours,
        requireAdminApproval: args.requireAdminApproval,
        notifyParentsOnAbsence: args.notifyParentsOnAbsence,
        updatedAt: now,
      });
      return existingSettings._id;
    }

    return await ctx.db.insert('attendanceSettings', {
      schoolId: args.schoolId,
      enableMorningSession: args.enableMorningSession,
      enableAfternoonSession: args.enableAfternoonSession,
      morningStartTime: args.morningStartTime,
      morningEndTime: args.morningEndTime,
      afternoonStartTime: args.afternoonStartTime,
      afternoonEndTime: args.afternoonEndTime,
      lateThresholdMinutes: args.lateThresholdMinutes,
      autoLockAttendance: args.autoLockAttendance,
      lockAfterHours: args.lockAfterHours,
      requireAdminApproval: args.requireAdminApproval,
      notifyParentsOnAbsence: args.notifyParentsOnAbsence,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ========== INTERNAL FUNCTIONS ==========

// Send attendance reminder notifications to teachers who haven't marked attendance
export const sendAttendanceReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get all active teachers with assigned classes
    const teachers = await ctx.db
      .query('teachers')
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    let notificationsSent = 0;

    for (const teacher of teachers) {
      // Get classes assigned to this teacher
      const assignedClasses = await ctx.db
        .query('classes')
        .withIndex('by_school', (q) => q.eq('schoolId', teacher.schoolId))
        .filter((q) => q.eq(q.field('classTeacherId'), teacher._id))
        .collect();

      // Skip teachers without assigned classes
      if (assignedClasses.length === 0) continue;

      // Check each class the teacher is assigned to
      for (const classDoc of assignedClasses) {
        const classId = classDoc._id;
        // Check if attendance already exists for today
        const existingAttendance = await ctx.db
          .query('attendance')
          .withIndex('by_class', (q) => q.eq('schoolId', teacher.schoolId).eq('classId', classId))
          .filter((q) => q.eq(q.field('date'), today))
          .first();

        // If no attendance marked, send reminder
        if (!existingAttendance) {
          // Check if we already sent a reminder today
          const existingNotification = await ctx.db
            .query('notifications')
            .filter((q) => q.eq(q.field('recipientId'), teacher._id))
            .filter((q) => q.gte(q.field('timestamp'), today))
            .filter((q) => q.eq(q.field('title'), 'Attendance Reminder'))
            .first();

          if (!existingNotification) {
            // Get class name
            const classDoc = await ctx.db.get(classId as Id<'classes'>);
            const className = classDoc?.className || 'your class';

            await ctx.db.insert('notifications', {
              title: 'Attendance Reminder',
              message: `Don't forget to mark attendance for ${className} today.`,
              type: 'warning',
              timestamp: now,
              read: false,
              recipientId: teacher._id,
              recipientRole: 'teacher',
              actionUrl: '/teacher/attendance',
            });

            notificationsSent++;
          }
        }
      }
    }

    return { notificationsSent, date: today };
  },
});
