import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Send bulk payment reminders
export const sendBulkReminders = mutation({
  args: {
    schoolId: v.string(),
    studentIds: v.array(v.string()),
    reminderType: v.union(v.literal('payment_due'), v.literal('installment_due'), v.literal('overdue')),
    method: v.union(v.literal('notification'), v.literal('email'), v.literal('sms')),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let successCount = 0;
    let failCount = 0;

    for (const studentId of args.studentIds) {
      try {
        // Get student details
        const student = await ctx.db
          .query('students')
          .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
          .first();

        if (!student) {
          failCount++;
          continue;
        }

        // Get outstanding payments for this student
        const outstandingPayments = await ctx.db
          .query('feePayments')
          .withIndex('by_student', (q) =>
            q.eq('schoolId', args.schoolId).eq('studentId', studentId)
          )
          .filter((q) =>
            q.or(
              q.eq(q.field('paymentStatus'), 'pending'),
              q.eq(q.field('paymentStatus'), 'partial')
            )
          )
          .collect();

        if (outstandingPayments.length === 0) {
          continue; // Skip students with no outstanding fees
        }

        // Calculate total outstanding amount
        const totalOutstanding = outstandingPayments.reduce(
          (sum, p) => sum + p.remainingBalance,
          0
        );

        // Create notification for school admin
        if (args.method === 'notification') {
          await ctx.db.insert('notifications', {
            title: `Payment Reminder: ${student.firstName} ${student.lastName}`,
            message: `Outstanding fees: GHS ${totalOutstanding.toFixed(2)}. Student: ${student.studentId}, Class: ${student.className}`,
            type: 'warning',
            timestamp: now,
            read: false,
            recipientRole: 'school_admin',
          });
        }

        // Record reminder
        await ctx.db.insert('feeReminders', {
          schoolId: args.schoolId,
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          parentEmail: student.parentEmail ?? "",
          parentPhone: student.parentPhone ?? "",
          categoryName: outstandingPayments[0].categoryName ?? "",
          amountDue: totalOutstanding,
          reminderType: args.reminderType,
          sentDate: now,
          method: args.method,
          status: 'sent',
          createdAt: now,
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to send reminder for student ${studentId}:`, error);
      }
    }

    return { successCount, failCount };
  },
});

// Get reminders by school
export const getRemindersBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const reminders = await ctx.db
      .query('feeReminders')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return reminders;
  },
});

// Get students with outstanding fees (for reminder targeting)
export const getStudentsWithOutstandingFees = query({
  args: {
    schoolId: v.string(),
    minAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const outstandingPayments = await ctx.db
      .query('feePayments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.or(
          q.eq(q.field('paymentStatus'), 'pending'),
          q.eq(q.field('paymentStatus'), 'partial')
        )
      )
      .collect();

    // Group by student
    const studentMap = new Map<string, {
      studentId: string;
      studentName: string;
      className: string;
      totalOutstanding: number;
      paymentCount: number;
    }>();

    for (const payment of outstandingPayments) {
      const existing = studentMap.get(payment.studentId);
      
      if (existing) {
        existing.totalOutstanding += payment.remainingBalance;
        existing.paymentCount++;
      } else {
        studentMap.set(payment.studentId, {
          studentId: payment.studentId,
          studentName: payment.studentName,
          className: payment.className,
          totalOutstanding: payment.remainingBalance,
          paymentCount: 1,
        });
      }
    }

    // Filter by minimum amount if specified
    let students = Array.from(studentMap.values());
    
    if (args.minAmount) {
      students = students.filter((s) => s.totalOutstanding >= args.minAmount!);
    }

    return students;
  },
});

// Get upcoming installment due dates
export const getUpcomingInstallmentDueDates = query({
  args: {
    schoolId: v.string(),
    daysAhead: v.number(), // Number of days to look ahead
  },
  handler: async (ctx, args) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + args.daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const upcomingInstallments = await ctx.db
      .query('installments')
      .filter((q) => 
        q.and(
          q.eq(q.field('schoolId'), args.schoolId),
          q.eq(q.field('status'), 'pending'),
          q.gte(q.field('dueDate'), todayStr),
          q.lte(q.field('dueDate'), futureDateStr)
        )
      )
      .collect();

    // Get payment plans and student details
    const installmentsWithDetails = [];

    for (const installment of upcomingInstallments) {
      const plan = await ctx.db.get(installment.paymentPlanId);
      if (plan) {
        installmentsWithDetails.push({
          ...installment,
          studentId: plan.studentId,
          studentName: plan.studentName,
          className: plan.className,
          categoryName: plan.categoryName,
        });
      }
    }

    return installmentsWithDetails;
  },
});
