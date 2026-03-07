import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Dashboard statistics query
export const getDashboardStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    // Get all relevant data
    const [teachers, students, classes, events, transactions, obligations, timetables] = await Promise.all([
      ctx.db.query('teachers').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('classes').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('events').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('feePaymentTransactions').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('feeObligations').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('timetables').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
    ]);

    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);
    const nowISO = now.toISOString();
    const oneWeekISO = oneWeekFromNow.toISOString();
    
    const upcomingEvents = events.filter(
      (event) => event.startDate >= nowISO && event.startDate <= oneWeekISO
    ).length;

    const activeTimetables = timetables.filter((t) => t.status === 'active').length;

    const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOutstanding = obligations
      .filter((o) => o.status === 'pending' || o.status === 'partial')
      .reduce((sum, o) => sum + o.totalBalance, 0);
    const totalDue = obligations.reduce((sum, o) => sum + o.totalAmountDue, 0);
    const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;

    return {
      teachersCount: teachers.length,
      studentsCount: students.length,
      classesCount: classes.length,
      upcomingEvents,
      feeCollectionRate: Math.round(collectionRate),
      outstandingPayments: totalOutstanding,
      activeTimetables,
    };
  },
});

// Financial summary query
export const getFinancialSummary = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const [transactions, obligations] = await Promise.all([
      ctx.db.query('feePaymentTransactions').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('feeObligations').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
    ]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthPayments = transactions.filter((t) => {
      const d = new Date(t.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisYearPayments = transactions.filter((t) => new Date(t.paymentDate).getFullYear() === currentYear);
    const outstandingObligations = obligations.filter(
      (o) => o.status === 'pending' || o.status === 'partial'
    );

    const thisMonthTotal = thisMonthPayments.reduce((sum, t) => sum + t.amount, 0);
    const thisYearTotal = thisYearPayments.reduce((sum, t) => sum + t.amount, 0);
    const outstandingTotal = outstandingObligations.reduce((sum, o) => sum + o.totalBalance, 0);

    const studentOutstanding = new Map<string, number>();
    for (const o of outstandingObligations) {
      const current = studentOutstanding.get(o.studentId) || 0;
      studentOutstanding.set(o.studentId, current + o.totalBalance);
    }

    // Get student details and sort by outstanding amount
    const topDebtors = await Promise.all(
      Array.from(studentOutstanding.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([studentId, amount]) => {
          const student = await ctx.db
            .query('students')
            .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
            .first();
          return {
            studentId,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
            studentClass: student?.className || 'N/A',
            outstandingAmount: amount,
          };
        })
    );

    const totalDue = obligations.reduce((sum, o) => sum + o.totalAmountDue, 0);
    const totalCollected = thisMonthTotal + thisYearTotal;
    const collectionRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

    return {
      thisMonthCollected: thisMonthTotal,
      thisYearCollected: thisYearTotal,
      outstandingTotal,
      collectionRate,
      topDebtors,
    };
  },
});

// Upcoming events query
export const getUpcomingEvents = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const events = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.gte(q.field('startDate'), now),
          q.eq(q.field('status'), 'upcoming')
        )
      )
      .collect();

    const sortedEvents = events.sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 5);

    // Get RSVP counts for each event
    const eventsWithRSVP = await Promise.all(
      sortedEvents.map(async (event) => {
        const rsvps = await ctx.db
          .query('eventRSVPs')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();

        return {
          ...event,
          rsvpCounts: {
            attending: rsvps.filter((r) => r.rsvpStatus === 'attending').length,
            notAttending: rsvps.filter((r) => r.rsvpStatus === 'not_attending').length,
            maybe: rsvps.filter((r) => r.rsvpStatus === 'maybe').length,
            pending: rsvps.filter((r) => r.rsvpStatus === 'pending').length,
          },
        };
      })
    );

    return eventsWithRSVP;
  },
});

// Recent activity query
export const getRecentActivity = query({
  args: { schoolId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get recent data from different sources
    const [students, payments, events, teachers] = await Promise.all([
      ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .order('desc')
        .take(5),
      ctx.db
        .query('feePaymentTransactions')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .order('desc')
        .take(5),
      ctx.db
        .query('events')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .order('desc')
        .take(5),
      ctx.db
        .query('teachers')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .order('desc')
        .take(5),
    ]);

    type Activity = {
      id: string;
      type: 'student' | 'payment' | 'event' | 'teacher';
      title: string;
      description: string;
      timestamp: number;
    };

    // Combine activities
    const activities: Activity[] = [];

    // Student enrollments
    students.forEach((student) => {
      activities.push({
        id: `student-${student._id}`,
        type: 'student',
        title: 'New Student Enrolled',
        description: `${student.firstName} ${student.lastName} joined ${student.className}`,
        timestamp: student._creationTime,
      });
    });

    // Fee payment transactions
    payments.forEach((tx) => {
      activities.push({
        id: `payment-${tx._id}`,
        type: 'payment',
        title: 'Fee Payment Recorded',
        description: `Amount: $${tx.amount}`,
        timestamp: tx._creationTime,
      });
    });

    // Events
    events.forEach((event) => {
      activities.push({
        id: `event-${event._id}`,
        type: 'event',
        title: `Event ${event.status === 'upcoming' ? 'Created' : 'Updated'}`,
        description: `${event.eventTitle} - ${event.eventType}`,
        timestamp: event._creationTime,
      });
    });

    // Teachers
    teachers.forEach((teacher) => {
      activities.push({
        id: `teacher-${teacher._id}`,
        type: 'teacher',
        title: 'New Teacher Added',
        description: `${teacher.firstName} ${teacher.lastName} - ${teacher.subjects.join(', ') || 'General'}`,
        timestamp: teacher._creationTime,
      });
    });

    // Sort by timestamp and limit
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
});

// Alerts query
export const getAlerts = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    type Alert = {
      type: 'conflict' | 'overdue' | 'low_rsvp' | 'unassigned' | 'no_timetable';
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      count: number;
      link?: string;
    };

    const alerts: Alert[] = [];

    // Check for timetable conflicts (we'll use a simple heuristic)
    const timetables = await ctx.db
      .query('timetables')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const activeCount = timetables.filter((t) => t.status === 'active').length;
    if (activeCount === 0) {
      alerts.push({
        type: 'no_timetable',
        severity: 'medium',
        title: 'No Active Timetables',
        description: 'No timetables are currently active for this school',
        count: 1,
        link: '/school-admin/timetable',
      });
    }

    // Check for overdue installments
    const now = new Date().toISOString();
    const installments = await ctx.db
      .query('installments')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();

    const overdueInstallments = installments.filter(
      (inst) => inst.schoolId === args.schoolId && inst.dueDate < now
    );

    if (overdueInstallments.length > 0) {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        title: 'Overdue Installments',
        description: `${overdueInstallments.length} installments are overdue`,
        count: overdueInstallments.length,
        link: '/school-admin/fees',
      });
    }

    // Check for events with low RSVP rates
    const upcomingEvents = await ctx.db
      .query('events')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.gte(q.field('startDate'), now),
          q.eq(q.field('requiresRSVP'), true)
        )
      )
      .collect();

    for (const event of upcomingEvents) {
      const rsvps = await ctx.db
        .query('eventRSVPs')
        .withIndex('by_event', (q) => q.eq('eventId', event._id))
        .collect();

      const respondedCount = rsvps.filter((r) => r.rsvpStatus !== 'pending').length;
      const totalInvited = rsvps.length;

      if (totalInvited > 0 && respondedCount / totalInvited < 0.3) {
        alerts.push({
          type: 'low_rsvp',
          severity: 'low',
          title: 'Low RSVP Rate',
          description: `${event.eventTitle} has only ${respondedCount}/${totalInvited} responses`,
          count: 1,
          link: '/school-admin/events',
        });
      }
    }

    // Check for teachers without class assignments
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const classes = await ctx.db
      .query('classes')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const assignedTeacherIds = new Set(
      classes.map((c) => c.classTeacherId).filter((id): id is string => id !== undefined)
    );

    const unassignedTeachers = teachers.filter((t) => !assignedTeacherIds.has(t.teacherId));

    if (unassignedTeachers.length > 0) {
      alerts.push({
        type: 'unassigned',
        severity: 'medium',
        title: 'Unassigned Teachers',
        description: `${unassignedTeachers.length} teachers have no class assignments`,
        count: unassignedTeachers.length,
        link: '/school-admin/teachers',
      });
    }

    // Check for classes without timetables
    const classesWithoutTimetables = classes.filter(
      (cls) => !timetables.some((t) => t.classId === cls._id.toString() && t.status === 'active')
    );

    if (classesWithoutTimetables.length > 0) {
      alerts.push({
        type: 'no_timetable',
        severity: 'medium',
        title: 'Classes Without Timetables',
        description: `${classesWithoutTimetables.length} classes don't have active timetables`,
        count: classesWithoutTimetables.length,
        link: '/school-admin/timetable',
      });
    }

    return alerts;
  },
});

// Performance metrics query
export const getPerformanceMetrics = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const [teachers, classes, students, events, transactions] = await Promise.all([
      ctx.db.query('teachers').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('classes').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('students').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('events').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
      ctx.db.query('feePaymentTransactions').withIndex('by_school', (q) => q.eq('schoolId', args.schoolId)).collect(),
    ]);

    // Teacher utilization (classes per teacher)
    const teacherUtilization = classes.length > 0 && teachers.length > 0
      ? (classes.length / teachers.length).toFixed(1)
      : '0';

    // Class capacity (students per class)
    const classCapacity = classes.length > 0
      ? (students.length / classes.length).toFixed(1)
      : '0';

    // Event engagement (RSVP response rate for events requiring RSVP)
    const eventsRequiringRSVP = events.filter((e) => e.requiresRSVP);
    let eventEngagement = 0;

    if (eventsRequiringRSVP.length > 0) {
      let totalResponses = 0;
      let totalInvited = 0;

      for (const event of eventsRequiringRSVP) {
        const rsvps = await ctx.db
          .query('eventRSVPs')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();

        totalInvited += rsvps.length;
        totalResponses += rsvps.filter((r) => r.rsvpStatus !== 'pending').length;
      }

      eventEngagement = totalInvited > 0 ? Math.round((totalResponses / totalInvited) * 100) : 0;
    }

    let collectionEfficiency = 'N/A';
    if (transactions.length > 0) {
      let totalDays = 0;
      for (const tx of transactions) {
        const createdDate = new Date(tx.createdAt);
        const paidDate = new Date(tx.paymentDate);
        totalDays += Math.abs(paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      }
      collectionEfficiency = `${Math.round(totalDays / transactions.length)} days`;
    }

    return {
      teacherUtilization,
      classCapacity,
      eventEngagement,
      collectionEfficiency,
    };
  },
});

// Fee collection trend query (last 6 months)
export const getFeeCollectionTrend = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const monthlyData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    for (const tx of transactions) {
      const d = new Date(tx.paymentDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthKey in monthlyData) {
        monthlyData[monthKey] += tx.amount;
      }
    }

    // Convert to array format for charts
    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));
  },
});
