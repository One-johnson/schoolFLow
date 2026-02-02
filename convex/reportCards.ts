import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
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
import { calculateGradeFromScale } from './gradeCalculator';

// Helper function to generate report code
function generateReportCode(): string {
  const digits: string = Math.random().toString().slice(2, 10);
  return `RPT${digits}`;
}

// Helper function to get grading scale for a class/department
async function getGradingScaleForDepartment(
  ctx: { db: any },
  schoolId: string,
  department: string | undefined
): Promise<{ _id: Id<'gradingScales'>; scaleName: string; grades: string } | null> {
  // Try to find scale for specific department
  if (department) {
    const departmentScale = await ctx.db
      .query('gradingScales')
      .withIndex('by_school', (q: any) => q.eq('schoolId', schoolId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field('department'), department),
          q.eq(q.field('status'), 'active')
        )
      )
      .first();

    if (departmentScale) {
      return departmentScale;
    }
  }

  // Fall back to default scale for the school
  const defaultScale = await ctx.db
    .query('gradingScales')
    .withIndex('by_default', (q: any) =>
      q.eq('schoolId', schoolId).eq('isDefault', true)
    )
    .filter((q: any) => q.eq(q.field('status'), 'active'))
    .first();

  return defaultScale;
}

// Generate report card for a student
export const generateReportCard = mutation({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
    classId: v.string(),
    examId: v.id('exams'),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    termName: v.optional(v.string()),
    year: v.optional(v.string()),
    house: v.optional(v.string()),
    attendance: v.optional(v.string()), // JSON: {present: 64, total: 68}
    conduct: v.optional(v.string()),
    attitude: v.optional(v.string()),
    interest: v.optional(v.string()),
    classTeacherComment: v.optional(v.string()),
    headmasterComment: v.optional(v.string()),
    classTeacherSign: v.optional(v.string()),
    headmasterSign: v.optional(v.string()),
    promotedTo: v.optional(v.string()),
    vacationDate: v.optional(v.string()),
    reopeningDate: v.optional(v.string()),
    termlyPerformance: v.optional(v.string()), // JSON: {term1: 497, term2: 562, term3: null}
    createdBy: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'reportCards'>> => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const reportCode: string = generateReportCode();
    const now: string = new Date().toISOString();

    // Get student details by studentId field
    const student = await ctx.db
      .query('students')
      .filter((q) => q.eq(q.field('studentId'), args.studentId))
      .first();

    if (!student) throw new Error('Student not found');

    // Get class details
    const classDoc = await ctx.db
      .query('classes')
      .filter((q) => q.eq(q.field('classCode'), args.classId))
      .first();

    if (!classDoc) throw new Error('Class not found');

    // Get all marks for this student in this exam
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) => q.eq(q.field('studentId'), args.studentId))
      .collect();

    if (marks.length === 0) throw new Error('No marks found for student');

    // Calculate total scores
    let totalScore: number = 0;
    let rawScore: number = 0;

    const subjects = marks.map((mark) => {
      totalScore += mark.totalScore;
      rawScore += mark.maxMarks;

      return {
        subjectName: mark.subjectName,
        classScore: mark.classScore,
        examScore: mark.examScore,
        totalScore: mark.totalScore,
        maxMarks: mark.maxMarks,
        percentage: mark.percentage,
        position: mark.position || 0,
        grade: mark.gradeNumber,
        remarks: mark.remarks,
      };
    });

    // Calculate overall percentage
    const percentage: number = (totalScore / rawScore) * 100;

    // Get grading scale and calculate overall grade
    const gradingScale = await getGradingScaleForDepartment(
      ctx,
      args.schoolId,
      classDoc.department
    );

    let overallGrade: string = '9';
    let gradingScaleId: Id<'gradingScales'> | undefined;
    let gradingScaleName: string | undefined;

    if (gradingScale) {
      const gradeResult = calculateGradeFromScale(percentage, gradingScale);
      overallGrade = gradeResult.grade;
      gradingScaleId = gradingScale._id;
      gradingScaleName = gradingScale.scaleName;
    } else {
      // Fallback to hardcoded grading
      if (percentage >= 80) overallGrade = '1';
      else if (percentage >= 70) overallGrade = '2';
      else if (percentage >= 65) overallGrade = '3';
      else if (percentage >= 60) overallGrade = '4';
      else if (percentage >= 55) overallGrade = '5';
      else if (percentage >= 50) overallGrade = '6';
      else if (percentage >= 45) overallGrade = '7';
      else if (percentage >= 40) overallGrade = '8';
    }

    // Calculate class position
    const allStudentsInClass = await ctx.db
      .query('students')
      .withIndex('by_class', (q) => q.eq('classId', args.classId))
      .collect();

    // Get marks for all students to calculate positions
    const allMarks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .filter((q) => q.eq(q.field('classId'), args.classId))
      .collect();

    // Group marks by student and calculate totals
    const studentTotals = new Map<string, number>();
    for (const mark of allMarks) {
      const current: number = studentTotals.get(mark.studentId) || 0;
      studentTotals.set(mark.studentId, current + mark.totalScore);
    }

    // Sort students by total score
    const sortedStudents = Array.from(studentTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    let position: number = 0;
    for (let i: number = 0; i < sortedStudents.length; i++) {
      if (sortedStudents[i][0] === args.studentId) {
        position = i + 1;
        break;
      }
    }

    // Check if report already exists
    const existing = await ctx.db
      .query('reportCards')
      .withIndex('by_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('academicYearId'), args.academicYearId),
          q.eq(q.field('termId'), args.termId)
        )
      )
      .first();

    if (existing) {
      // Update existing report
      await ctx.db.patch(existing._id, {
        subjects: JSON.stringify(subjects),
        rawScore,
        totalScore,
        percentage,
        overallGrade,
        position,
        totalStudents: allStudentsInClass.length,
        gradingScaleId,
        gradingScaleName,
        attendance: args.attendance,
        conduct: args.conduct,
        attitude: args.attitude,
        interest: args.interest,
        classTeacherComment: args.classTeacherComment,
        headmasterComment: args.headmasterComment,
        classTeacherSign: args.classTeacherSign,
        headmasterSign: args.headmasterSign,
        promotedTo: args.promotedTo,
        vacationDate: args.vacationDate,
        reopeningDate: args.reopeningDate,
        termlyPerformance: args.termlyPerformance,
        version: (existing.version || 1) + 1,
        previousVersionId: existing._id,
        generatedAt: now,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // Create new report
      const reportId: Id<'reportCards'> = await ctx.db.insert('reportCards', {
        schoolId: args.schoolId,
        reportCode,
        studentId: args.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: args.classId,
        className: classDoc.className,
        academicYearId: args.academicYearId,
        termId: args.termId,
        termName: args.termName,
        year: args.year,
        house: args.house,
        subjects: JSON.stringify(subjects),
        rawScore,
        totalScore,
        percentage,
        overallGrade,
        position,
        totalStudents: allStudentsInClass.length,
        gradingScaleId,
        gradingScaleName,
        attendance: args.attendance,
        conduct: args.conduct,
        attitude: args.attitude,
        interest: args.interest,
        classTeacherComment: args.classTeacherComment,
        headmasterComment: args.headmasterComment,
        classTeacherSign: args.classTeacherSign,
        headmasterSign: args.headmasterSign,
        promotionStatus: undefined,
        promotedTo: args.promotedTo,
        vacationDate: args.vacationDate,
        reopeningDate: args.reopeningDate,
        termlyPerformance: args.termlyPerformance,
        status: 'draft',
        version: 1,
        generatedAt: now,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });

      return reportId;
    }
  },
});

// Generate report cards (wrapper for dialog)
export const generateReportCards = mutation({
  args: {
    examId: v.id('exams'),
    classId: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Get exam details
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error('Exam not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== exam.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Get class details by classCode field
    const classDoc = await ctx.db
      .query('classes')
      .filter((q) => q.eq(q.field('classCode'), args.classId))
      .first();
    if (!classDoc) throw new Error('Class not found');

    // Fetch academic year details
    let academicYearName: string | undefined;
    if (exam.academicYearId) {
      const academicYear = await ctx.db
        .query('academicYears')
        .filter((q) => q.eq(q.field('yearCode'), exam.academicYearId))
        .first();
      academicYearName = academicYear?.yearName;
    }

    // Fetch term details
    let termName: string | undefined;
    if (exam.termId) {
      const term = await ctx.db
        .query('terms')
        .filter((q) => q.eq(q.field('termCode'), exam.termId))
        .first();
      termName = term?.termName;
    }

    // Fetch school details
    const school = await ctx.db
      .query('schools')
      .withIndex('by_school_id', (q) => q.eq('schoolId', exam.schoolId))
      .first();
    const schoolName = school?.name;
    const schoolAddress = school?.address;
    const schoolPhone = school?.phone;

    // Get all students in the class using class code (exclude graduated students)
    const students = await ctx.db
      .query('students')
      .withIndex('by_class', (q) => q.eq('classId', classDoc.classCode))
      .filter((q) => q.neq(q.field('status'), 'graduated'))
      .collect();

    if (students.length === 0) {
      throw new Error('No students found in the selected class (excluding graduated students)');
    }

    const reportIds: Id<'reportCards'>[] = [];
    const errors: string[] = [];
    const now: string = new Date().toISOString();

    for (const student of students) {
      try {
        // Get all marks for this student in this exam
        const marks = await ctx.db
          .query('studentMarks')
          .withIndex('by_exam', (q) => q.eq('examId', args.examId))
          .filter((q) => q.eq(q.field('studentId'), student.studentId))
          .collect();

        if (marks.length === 0) {
          errors.push(`${student.firstName} ${student.lastName}: No marks found`);
          continue;
        }

        // Calculate total scores
        let totalScore: number = 0;
        let rawScore: number = 0;

        const subjects = marks.map((mark) => {
          totalScore += mark.totalScore;
          rawScore += mark.maxMarks;

          return {
            subjectName: mark.subjectName,
            classScore: mark.classScore,
            examScore: mark.examScore,
            totalScore: mark.totalScore,
            maxMarks: mark.maxMarks,
            percentage: mark.percentage,
            position: mark.position || 0,
            grade: mark.gradeNumber,
            remarks: mark.remarks,
          };
        });

        // Calculate overall percentage
        const percentage: number = (totalScore / rawScore) * 100;

        // Get grading scale and calculate overall grade
        const gradingScale = await getGradingScaleForDepartment(
          ctx,
          exam.schoolId,
          classDoc.department
        );

        let overallGrade: string = '9';
        let gradingScaleId: Id<'gradingScales'> | undefined;
        let gradingScaleName: string | undefined;

        if (gradingScale) {
          const gradeResult = calculateGradeFromScale(percentage, gradingScale);
          overallGrade = gradeResult.grade;
          gradingScaleId = gradingScale._id;
          gradingScaleName = gradingScale.scaleName;
        } else {
          // Fallback to hardcoded grading
          if (percentage >= 80) overallGrade = '1';
          else if (percentage >= 70) overallGrade = '2';
          else if (percentage >= 65) overallGrade = '3';
          else if (percentage >= 60) overallGrade = '4';
          else if (percentage >= 55) overallGrade = '5';
          else if (percentage >= 50) overallGrade = '6';
          else if (percentage >= 45) overallGrade = '7';
          else if (percentage >= 40) overallGrade = '8';
        }

        // Get marks for all students in class to calculate position
        const allMarks = await ctx.db
          .query('studentMarks')
          .withIndex('by_exam', (q) => q.eq('examId', args.examId))
          .filter((q) => q.eq(q.field('classId'), classDoc.classCode))
          .collect();

        // Group marks by student and calculate totals
        const studentTotals = new Map<string, number>();
        for (const mark of allMarks) {
          const current: number = studentTotals.get(mark.studentId) || 0;
          studentTotals.set(mark.studentId, current + mark.totalScore);
        }

        // Sort students by total score
        const sortedStudents = Array.from(studentTotals.entries()).sort(
          (a, b) => b[1] - a[1]
        );

        let position: number = 0;
        for (let i: number = 0; i < sortedStudents.length; i++) {
          if (sortedStudents[i][0] === student.studentId) {
            position = i + 1;
            break;
          }
        }

        // Check if report already exists
        const existing = await ctx.db
          .query('reportCards')
          .withIndex('by_student', (q) =>
            q.eq('schoolId', exam.schoolId).eq('studentId', student.studentId)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field('academicYearId'), exam.academicYearId),
              q.eq(q.field('termId'), exam.termId)
            )
          )
          .first();

        if (existing) {
          // Update existing report
          await ctx.db.patch(existing._id, {
            subjects: JSON.stringify(subjects),
            rawScore,
            totalScore,
            percentage,
            overallGrade,
            position,
            totalStudents: students.length,
            gradingScaleId,
            gradingScaleName,
            academicYearName,
            termName,
            schoolName,
            schoolAddress,
            schoolPhone,
            version: (existing.version || 1) + 1,
            previousVersionId: existing._id,
            generatedAt: now,
            updatedAt: now,
          });

          reportIds.push(existing._id);
        } else {
          // Create new report
          const reportId: Id<'reportCards'> = await ctx.db.insert('reportCards', {
            schoolId: exam.schoolId,
            reportCode: generateReportCode(),
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            classId: classDoc.classCode,
            className: classDoc.className,
            academicYearId: exam.academicYearId,
            academicYearName,
            termId: exam.termId,
            termName,
            schoolName,
            schoolAddress,
            schoolPhone,
            subjects: JSON.stringify(subjects),
            rawScore,
            totalScore,
            percentage,
            overallGrade,
            position,
            totalStudents: students.length,
            gradingScaleId,
            gradingScaleName,
            promotionStatus: undefined,
            status: 'draft',
            version: 1,
            generatedAt: now,
            createdBy: exam.createdBy,
            createdAt: now,
            updatedAt: now,
          });

          reportIds.push(reportId);
        }
      } catch (error) {
        errors.push(`${student.firstName} ${student.lastName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (reportIds.length === 0) {
      throw new Error(`Failed to generate any report cards. Errors: ${errors.join('; ')}`);
    }

    return {
      success: true,
      count: reportIds.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// Bulk generate report cards for a class
export const bulkGenerateReportCards = mutation({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    examId: v.id('exams'),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    termName: v.optional(v.string()),
    year: v.optional(v.string()),
    vacationDate: v.optional(v.string()),
    reopeningDate: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.createdBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // Get all students in class using class code (exclude graduated students)
    const students = await ctx.db
      .query('students')
      .withIndex('by_class', (q) => q.eq('classId', args.classId))
      .filter((q) => q.neq(q.field('status'), 'graduated'))
      .collect();

    const reportIds: Id<'reportCards'>[] = [];

    for (const student of students) {
      // Check if student has marks
      const hasMarks = await ctx.db
        .query('studentMarks')
        .withIndex('by_exam', (q) => q.eq('examId', args.examId))
        .filter((q) => q.eq(q.field('studentId'), student.studentId))
        .first();

      if (hasMarks) {
        const reportId: Id<'reportCards'> = await ctx.db.insert('reportCards', {
          schoolId: args.schoolId,
          reportCode: generateReportCode(),
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          classId: args.classId,
          className: student.className,
          academicYearId: args.academicYearId,
          termId: args.termId,
          termName: args.termName,
          year: args.year,
          subjects: '[]', // Will be filled in individual generation
          rawScore: 0,
          totalScore: 0,
          percentage: 0,
          overallGrade: '9',
          vacationDate: args.vacationDate,
          reopeningDate: args.reopeningDate,
          status: 'draft',
          version: 1,
          generatedAt: new Date().toISOString(),
          createdBy: args.createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        reportIds.push(reportId);
      }
    }

    return { success: true, count: reportIds.length };
  },
});

// Get report cards for a class
export const getClassReportCards = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
    termId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('reportCards')
      .withIndex('by_class', (q) =>
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      );

    if (args.termId) {
      query = query.filter((q) => q.eq(q.field('termId'), args.termId));
    }

    const reports = await query.collect();
    return reports;
  },
});

// Get report cards by school
export const getReportCardsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query('reportCards')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();
    return reports;
  },
});

// Get report card by ID
export const getReportCardById = query({
  args: { reportId: v.id('reportCards') },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    return report;
  },
});

// Publish report cards
export const publishReportCards = mutation({
  args: {
    reportIds: v.array(v.id('reportCards')),
    publishedBy: v.string(),
    publishedByRole: v.union(v.literal('class_teacher'), v.literal('admin')),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.publishedBy);

    const now: string = new Date().toISOString();

    for (const reportId of args.reportIds) {
      const report = await ctx.db.get(reportId);
      if (!report) throw new Error('Report card not found');
      if (report.schoolId !== callerSchoolId) {
        throw new Error('Unauthorized: You do not belong to this school');
      }

      await ctx.db.patch(reportId, {
        status: 'published',
        publishedAt: now,
        publishedBy: args.publishedBy,
        publishedByRole: args.publishedByRole,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Unpublish report card
export const unpublishReportCard = mutation({
  args: {
    reportId: v.id('reportCards'),
    unpublishedBy: v.string(),
    unpublishReason: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error('Report card not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.unpublishedBy);
    if (callerSchoolId !== report.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now: string = new Date().toISOString();

    await ctx.db.patch(args.reportId, {
      status: 'draft',
      unpublishedBy: args.unpublishedBy,
      unpublishedAt: now,
      unpublishReason: args.unpublishReason,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Update report card details
export const updateReportCard = mutation({
  args: {
    reportId: v.id('reportCards'),
    updatedBy: v.string(),
    attendance: v.optional(v.string()),
    conduct: v.optional(v.string()),
    attitude: v.optional(v.string()),
    interest: v.optional(v.string()),
    classTeacherComment: v.optional(v.string()),
    headmasterComment: v.optional(v.string()),
    classTeacherSign: v.optional(v.string()),
    headmasterSign: v.optional(v.string()),
    promotedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, updatedBy, ...updates } = args;

    const report = await ctx.db.get(reportId);
    if (!report) throw new Error('Report card not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, updatedBy);
    if (callerSchoolId !== report.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const now: string = new Date().toISOString();

    await ctx.db.patch(reportId, {
      ...updates,
      updatedAt: now,
    });

    return reportId;
  },
});

// Delete a single report card
export const deleteReportCard = mutation({
  args: {
    reportCardId: v.id('reportCards'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportCardId);
    if (!report) throw new Error('Report card not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (callerSchoolId !== report.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.delete(args.reportCardId);
    return { success: true };
  },
});

// Bulk delete report cards
export const bulkDeleteReportCards = mutation({
  args: {
    reportCardIds: v.array(v.id('reportCards')),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);

    for (const reportCardId of args.reportCardIds) {
      const report = await ctx.db.get(reportCardId);
      if (!report) throw new Error('Report card not found');
      if (report.schoolId !== callerSchoolId) {
        throw new Error('Unauthorized: You do not belong to this school');
      }

      await ctx.db.delete(reportCardId);
    }
    return { success: true, count: args.reportCardIds.length };
  },
});
