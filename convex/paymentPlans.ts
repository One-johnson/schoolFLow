import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate unique plan code
function generatePlanCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `PP${digits}`;
}

// Create payment plan
export const createPaymentPlan = mutation({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    classId: v.string(),
    className: v.string(),
    categoryId: v.string(),
    categoryName: v.string(),
    totalAmount: v.number(),
    numberOfInstallments: v.number(),
    frequency: v.union(v.literal('monthly'), v.literal('quarterly'), v.literal('custom')),
    startDate: v.string(),
    customDueDates: v.optional(v.array(v.string())), // For custom frequency
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const planCode = generatePlanCode();
    const now = new Date().toISOString();
    const installmentAmount = args.totalAmount / args.numberOfInstallments;

    // Create payment plan
    const planId = await ctx.db.insert('paymentPlans', {
      schoolId: args.schoolId,
      planCode,
      studentId: args.studentId,
      studentName: args.studentName,
      classId: args.classId,
      className: args.className,
      categoryId: args.categoryId,
      categoryName: args.categoryName,
      totalAmount: args.totalAmount,
      numberOfInstallments: args.numberOfInstallments,
      installmentAmount,
      frequency: args.frequency,
      startDate: args.startDate,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Create installments
    const startDateObj = new Date(args.startDate);
    
    for (let i = 0; i < args.numberOfInstallments; i++) {
      let dueDate: Date;
      
      if (args.frequency === 'custom' && args.customDueDates) {
        dueDate = new Date(args.customDueDates[i]);
      } else if (args.frequency === 'monthly') {
        dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + i);
      } else { // quarterly
        dueDate = new Date(startDateObj);
        dueDate.setMonth(startDateObj.getMonth() + (i * 3));
      }

      await ctx.db.insert('installments', {
        schoolId: args.schoolId,
        paymentPlanId: planId,
        installmentNumber: i + 1,
        amountDue: installmentAmount,
        amountPaid: 0,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }

    return planId;
  },
});

// Get payment plans by school
export const getPaymentPlansBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('paymentPlans')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return plans;
  },
});

// Get payment plans by student
export const getPaymentPlansByStudent = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query('paymentPlans')
      .withIndex('by_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .order('desc')
      .collect();

    return plans;
  },
});

// Get installments for a payment plan
export const getInstallmentsByPlan = query({
  args: { paymentPlanId: v.id('paymentPlans') },
  handler: async (ctx, args) => {
    const installments = await ctx.db
      .query('installments')
      .withIndex('by_payment_plan', (q) => q.eq('paymentPlanId', args.paymentPlanId))
      .collect();

    return installments;
  },
});

// Record installment payment
export const recordInstallmentPayment = mutation({
  args: {
    installmentId: v.id('installments'),
    amountPaid: v.number(),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const installment = await ctx.db.get(args.installmentId);
    
    if (!installment) {
      throw new Error('Installment not found');
    }

    const now = new Date().toISOString();
    const totalPaid = installment.amountPaid + args.amountPaid;
    let status: 'pending' | 'paid' | 'overdue' = 'pending';

    if (totalPaid >= installment.amountDue) {
      status = 'paid';
    }

    await ctx.db.patch(args.installmentId, {
      amountPaid: totalPaid,
      paymentDate: args.paymentDate,
      status,
      notes: args.notes,
      updatedAt: now,
    });

    // Check if all installments are paid
    const plan = await ctx.db.get(installment.paymentPlanId);
    if (plan) {
      const allInstallments = await ctx.db
        .query('installments')
        .withIndex('by_payment_plan', (q) => q.eq('paymentPlanId', installment.paymentPlanId))
        .collect();

      const allPaid = allInstallments.every((inst) => inst.status === 'paid');

      if (allPaid) {
        await ctx.db.patch(installment.paymentPlanId, {
          status: 'completed',
          updatedAt: now,
        });
      }
    }

    return args.installmentId;
  },
});

// Update overdue installments
export const updateOverdueInstallments = mutation({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const pendingInstallments = await ctx.db
      .query('installments')
      .filter((q) => 
        q.and(
          q.eq(q.field('schoolId'), args.schoolId),
          q.eq(q.field('status'), 'pending')
        )
      )
      .collect();

    let count = 0;

    for (const installment of pendingInstallments) {
      if (installment.dueDate < today) {
        await ctx.db.patch(installment._id, {
          status: 'overdue',
          updatedAt: now,
        });
        count++;
      }
    }

    return count;
  },
});

// Cancel payment plan
export const cancelPaymentPlan = mutation({
  args: { planId: v.id('paymentPlans') },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    await ctx.db.patch(args.planId, {
      status: 'cancelled',
      updatedAt: now,
    });

    return args.planId;
  },
});
