import { v } from 'convex/values';
import { mutation, query } from './_generated/server';


// Get comprehensive analytics for an exam
export const getExamAnalytics = query({
  args: { examId: v.id('exams') },
  handler: async (ctx, args) => {
    // Get all marks for this exam
    const marks = await ctx.db
      .query('studentMarks')
      .withIndex('by_exam', (q) => q.eq('examId', args.examId))
      .collect();

    if (marks.length === 0) {
      return null;
    }

    // Get exam details
    const exam = await ctx.db.get(args.examId);
    
    // Calculate pass/fail (assuming 40% is pass)
    const passThreshold = 40;
    const passedStudents = marks.filter((m) => m.percentage >= passThreshold && !m.isAbsent);
    const failedStudents = marks.filter((m) => m.percentage < passThreshold && !m.isAbsent);
    const absentStudents = marks.filter((m) => m.isAbsent);

    // Grade distribution (using gradeNumber 1-9)
    const gradeDistribution: Record<number, number> = {};
    marks.forEach((mark) => {
      if (!mark.isAbsent) {
        gradeDistribution[mark.gradeNumber] = (gradeDistribution[mark.gradeNumber] || 0) + 1;
      }
    });

    // Average scores by subject
    const subjectStats: Record<string, {
      subjectName: string;
      totalScore: number;
      maxScore: number;
      studentCount: number;
      averagePercentage: number;
      highestScore: number;
      lowestScore: number;
      passCount: number;
      failCount: number;
    }> = {};

    marks.forEach((mark) => {
      if (!mark.isAbsent) {
        if (!subjectStats[mark.subjectId]) {
          subjectStats[mark.subjectId] = {
            subjectName: mark.subjectName,
            totalScore: 0,
            maxScore: mark.maxMarks,
            studentCount: 0,
            averagePercentage: 0,
            highestScore: 0,
            lowestScore: 100,
            passCount: 0,
            failCount: 0,
          };
        }

        const stats = subjectStats[mark.subjectId];
        stats.totalScore += mark.totalScore;
        stats.studentCount += 1;
        stats.highestScore = Math.max(stats.highestScore, mark.totalScore);
        stats.lowestScore = Math.min(stats.lowestScore, mark.totalScore);
        
        if (mark.percentage >= passThreshold) {
          stats.passCount += 1;
        } else {
          stats.failCount += 1;
        }
      }
    });

    // Calculate average percentages for subjects
    Object.keys(subjectStats).forEach((subjectId) => {
      const stats = subjectStats[subjectId];
      stats.averagePercentage = (stats.totalScore / (stats.maxScore * stats.studentCount)) * 100;
    });

    // Class performance stats
    const classStats: Record<string, {
      className: string;
      studentCount: number;
      totalPercentage: number;
      averagePercentage: number;
      passCount: number;
      failCount: number;
      absentCount: number;
      topScore: number;
    }> = {};

    marks.forEach((mark) => {
      if (!classStats[mark.classId]) {
        classStats[mark.classId] = {
          className: mark.className,
          studentCount: 0,
          totalPercentage: 0,
          averagePercentage: 0,
          passCount: 0,
          failCount: 0,
          absentCount: 0,
          topScore: 0,
        };
      }

      const stats = classStats[mark.classId];
      
      if (mark.isAbsent) {
        stats.absentCount += 1;
      } else {
        stats.totalPercentage += mark.percentage;
        stats.topScore = Math.max(stats.topScore, mark.totalScore);
        
        if (mark.percentage >= passThreshold) {
          stats.passCount += 1;
        } else {
          stats.failCount += 1;
        }
      }
    });

    // Calculate averages and count unique students per class
    const uniqueStudentsByClass: Record<string, Set<string>> = {};
    marks.forEach((mark) => {
      if (!uniqueStudentsByClass[mark.classId]) {
        uniqueStudentsByClass[mark.classId] = new Set();
      }
      uniqueStudentsByClass[mark.classId].add(mark.studentId);
    });

    Object.keys(classStats).forEach((classId) => {
      const stats = classStats[classId];
      const uniqueCount = uniqueStudentsByClass[classId].size;
      stats.studentCount = uniqueCount;
      const nonAbsentCount = stats.passCount + stats.failCount;
      if (nonAbsentCount > 0) {
        stats.averagePercentage = stats.totalPercentage / nonAbsentCount;
      }
    });

    // Top performing students (overall, across all subjects)
    const studentOverallScores: Record<string, {
      studentId: string;
      studentName: string;
      className: string;
      totalScore: number;
      totalMaxMarks: number;
      percentage: number;
      subjectCount: number;
    }> = {};

    marks.forEach((mark) => {
      if (!mark.isAbsent) {
        if (!studentOverallScores[mark.studentId]) {
          studentOverallScores[mark.studentId] = {
            studentId: mark.studentId,
            studentName: mark.studentName,
            className: mark.className,
            totalScore: 0,
            totalMaxMarks: 0,
            percentage: 0,
            subjectCount: 0,
          };
        }

        const student = studentOverallScores[mark.studentId];
        student.totalScore += mark.totalScore;
        student.totalMaxMarks += mark.maxMarks;
        student.subjectCount += 1;
      }
    });

    // Calculate percentages for students
    Object.keys(studentOverallScores).forEach((studentId) => {
      const student = studentOverallScores[studentId];
      student.percentage = (student.totalScore / student.totalMaxMarks) * 100;
    });

    // Get top 10 students
    const topStudents = Object.values(studentOverallScores)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Get top 5 classes
    const topClasses = Object.values(classStats)
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 5);

    // Overall statistics
    const totalUniqueStudents = new Set(marks.map((m) => m.studentId)).size;
    const totalMarksEntered = marks.length;
    const overallAveragePercentage = marks
      .filter((m) => !m.isAbsent)
      .reduce((sum, m) => sum + m.percentage, 0) / marks.filter((m) => !m.isAbsent).length;

    return {
      examId: args.examId,
      examName: exam?.examName || 'Unknown',
      examCode: exam?.examCode || '',
      overall: {
        totalStudents: totalUniqueStudents,
        totalMarksEntered: totalMarksEntered,
        averagePercentage: overallAveragePercentage,
        passedCount: passedStudents.length,
        failedCount: failedStudents.length,
        absentCount: absentStudents.length,
        passRate: (passedStudents.length / (passedStudents.length + failedStudents.length)) * 100,
      },
      gradeDistribution: Object.entries(gradeDistribution)
        .map(([grade, count]) => ({
          grade: Number(grade),
          count,
        }))
        .sort((a, b) => a.grade - b.grade),
      subjectStats: Object.values(subjectStats).sort(
        (a, b) => b.averagePercentage - a.averagePercentage
      ),
      classStats: Object.values(classStats).sort(
        (a, b) => b.averagePercentage - a.averagePercentage
      ),
      topStudents,
      topClasses,
    };
  },
});

// Get analytics for all exams in a school
export const getSchoolExamsAnalytics = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const exams = await ctx.db
      .query('exams')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'completed'))
      .collect();

    const analytics = [];

    for (const exam of exams) {
      const marks = await ctx.db
        .query('studentMarks')
        .withIndex('by_exam', (q) => q.eq('examId', exam._id))
        .collect();

      if (marks.length > 0) {
        const passThreshold = 40;
        const nonAbsentMarks = marks.filter((m) => !m.isAbsent);
        const averagePercentage =
          nonAbsentMarks.reduce((sum, m) => sum + m.percentage, 0) / nonAbsentMarks.length;
        const passRate =
          (nonAbsentMarks.filter((m) => m.percentage >= passThreshold).length /
            nonAbsentMarks.length) *
          100;

        analytics.push({
          examId: exam._id,
          examName: exam.examName,
          examCode: exam.examCode,
          totalStudents: new Set(marks.map((m) => m.studentId)).size,
          averagePercentage,
          passRate,
          completionDate: exam.endDate,
        });
      }
    }

    return analytics.sort((a, b) => 
      new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
    );
  },
});
