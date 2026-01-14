import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate unique payment ID
function generatePaymentId(): string {
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `PAY${digits}`;
}

// Generate unique receipt number
function generateReceiptNumber(): string {
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `RCP${digits}`;
}

// Record fee payment
export const recordPayment = mutation({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    classId: v.string(),
    className: v.string(),
    feeStructureId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    categoryId: v.string(),
    categoryName: v.string(),
    amountDue: v.number(),
    amountPaid: v.number(),
    paymentMethod: v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('mobile_money'),
      v.literal('check'),
      v.literal('other')
    ),
    transactionReference: v.optional(v.string()),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
    paidBy: v.optional(v.string()),
    collectedBy: v.string(),
    collectedByName: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = generatePaymentId();
    const receiptNumber = generateReceiptNumber();
    const now = new Date().toISOString();

    const remainingBalance = args.amountDue - args.amountPaid;
    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';

    if (args.amountPaid >= args.amountDue) {
      paymentStatus = 'paid';
    } else if (args.amountPaid > 0) {
      paymentStatus = 'partial';
    }

    const paymentDbId = await ctx.db.insert('feePayments', {
      schoolId: args.schoolId,
      paymentId,
      receiptNumber,
      studentId: args.studentId,
      studentName: args.studentName,
      classId: args.classId,
      className: args.className,
      feeStructureId: args.feeStructureId,
      academicYearId: args.academicYearId,
      termId: args.termId,
      categoryId: args.categoryId,
      categoryName: args.categoryName,
      amountDue: args.amountDue,
      amountPaid: args.amountPaid,
      paymentMethod: args.paymentMethod,
      transactionReference: args.transactionReference,
      paymentDate: args.paymentDate,
      paymentStatus,
      remainingBalance,
      notes: args.notes,
      paidBy: args.paidBy,
      collectedBy: args.collectedBy,
      collectedByName: args.collectedByName,
      createdAt: now,
      updatedAt: now,
    });

    return paymentDbId;
  },
});

// Get all payments for a school
export const getPaymentsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    return payments;
  },
});

// Get payments for a specific student
export const getPaymentsByStudent = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .order('desc')
      .collect();

    return payments;
  },
});

// Get payments by class
export const getPaymentsByClass = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_class', (q) =>
        q.eq('schoolId', args.schoolId).eq('classId', args.classId)
      )
      .order('desc')
      .collect();

    return payments;
  },
});

// Get outstanding payments (pending and partial)
export const getOutstandingPayments = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.or(
          q.eq(q.field('paymentStatus'), 'pending'),
          q.eq(q.field('paymentStatus'), 'partial')
        )
      )
      .order('desc')
      .collect();

    return payments;
  },
});

// Get payment statistics
export const getPaymentStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOutstanding = payments.reduce((sum, p) => sum + p.remainingBalance, 0);
    const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);

    const paidCount = payments.filter((p) => p.paymentStatus === 'paid').length;
    const partialCount = payments.filter((p) => p.paymentStatus === 'partial').length;
    const pendingCount = payments.filter((p) => p.paymentStatus === 'pending').length;

    return {
      totalCollected,
      totalOutstanding,
      totalDue,
      paidCount,
      partialCount,
      pendingCount,
      totalPayments: payments.length,
    };
  },
});

// Update payment
export const updatePayment = mutation({
  args: {
    paymentId: v.id('feePayments'),
    amountPaid: v.optional(v.number()),
    paymentMethod: v.optional(v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('mobile_money'),
      v.literal('check'),
      v.literal('other')
    )),
    transactionReference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paymentId, ...updates } = args;
    const now = new Date().toISOString();

    const payment = await ctx.db.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const amountPaid = updates.amountPaid ?? payment.amountPaid;
    const remainingBalance = payment.amountDue - amountPaid;

    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (amountPaid >= payment.amountDue) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partial';
    }

    await ctx.db.patch(paymentId, {
      ...updates,
      remainingBalance,
      paymentStatus,
      updatedAt: now,
    });

    return paymentId;
  },
});

// Delete payment
export const deletePayment = mutation({
  args: { paymentId: v.id('feePayments') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.paymentId);
  },
});
