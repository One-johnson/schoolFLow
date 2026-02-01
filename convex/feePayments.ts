import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin and return their schoolId
async function getVerifiedSchoolId(ctx: MutationCtx, adminId: string): Promise<string> {
  const admin = await ctx.db.get(adminId as Id<'schoolAdmins'>);
  if (!admin) {
    throw new Error('Unauthorized: Admin not found');
  }
  return admin.schoolId;
}

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

// Record fee payment (V2 Multi-category only)
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
    // Multi-category items
    items: v.array(
      v.object({
        categoryId: v.string(),
        categoryName: v.string(),
        amountDue: v.number(),
        amountPaid: v.number(),
      })
    ),
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
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.collectedBy);
    if (callerSchoolId !== args.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const paymentId = generatePaymentId();
    const receiptNumber = generateReceiptNumber();
    const now = new Date().toISOString();

    // Calculate totals
    const totalAmountDue = args.items.reduce((sum, item) => sum + item.amountDue, 0);
    const totalAmountPaid = args.items.reduce((sum, item) => sum + item.amountPaid, 0);
    const totalBalance = totalAmountDue - totalAmountPaid;

    let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (totalAmountPaid >= totalAmountDue) {
      paymentStatus = 'paid';
    } else if (totalAmountPaid > 0) {
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
      // Version 2 fields
      version: 2,
      items: JSON.stringify(args.items),
      totalAmountDue,
      totalAmountPaid,
      totalBalance,
      // Common fields
      paymentMethod: args.paymentMethod,
      transactionReference: args.transactionReference,
      paymentDate: args.paymentDate,
      paymentStatus,
      remainingBalance: totalBalance,
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

// Get payment statistics (V2 only)
export const getPaymentStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query('feePayments')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    // Use V2 fields only
    const totalCollected = payments.reduce((sum, p) => sum + (p.totalAmountPaid || 0), 0);
    const totalOutstanding = payments.reduce((sum, p) => sum + (p.totalBalance || 0), 0);
    const totalDue = payments.reduce((sum, p) => sum + (p.totalAmountDue || 0), 0);

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

// Update payment (V2 format)
export const updatePayment = mutation({
  args: {
    paymentId: v.id('feePayments'),
    updatedBy: v.string(),
    items: v.optional(v.array(
      v.object({
        categoryId: v.string(),
        categoryName: v.string(),
        amountDue: v.number(),
        amountPaid: v.number(),
      })
    )),
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
    const { paymentId, updatedBy, items, ...updates } = args;
    const now = new Date().toISOString();

    const payment = await ctx.db.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const callerSchoolId = await getVerifiedSchoolId(ctx, updatedBy);
    if (callerSchoolId !== payment.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    // If items are provided, recalculate totals
    let updateData: Record<string, unknown> = { ...updates, updatedAt: now };
    
    if (items) {
      const totalAmountDue = items.reduce((sum, item) => sum + item.amountDue, 0);
      const totalAmountPaid = items.reduce((sum, item) => sum + item.amountPaid, 0);
      const totalBalance = totalAmountDue - totalAmountPaid;

      let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
      if (totalAmountPaid >= totalAmountDue) {
        paymentStatus = 'paid';
      } else if (totalAmountPaid > 0) {
        paymentStatus = 'partial';
      }

      updateData = {
        ...updateData,
        items: JSON.stringify(items),
        totalAmountDue,
        totalAmountPaid,
        totalBalance,
        remainingBalance: totalBalance,
        paymentStatus,
      };
    }

    await ctx.db.patch(paymentId, updateData);

    return paymentId;
  },
});

// Delete payment
export const deletePayment = mutation({
  args: {
    paymentId: v.id('feePayments'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error('Payment not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (callerSchoolId !== payment.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    await ctx.db.delete(args.paymentId);
  },
});

// Bulk record payments from CSV (V2 format)
export const bulkRecordPayments = mutation({
  args: {
    collectedBy: v.string(),
    payments: v.array(
      v.object({
        schoolId: v.string(),
        studentId: v.string(),
        studentName: v.string(),
        classId: v.string(),
        className: v.string(),
        items: v.array(
          v.object({
            categoryId: v.string(),
            categoryName: v.string(),
            amountDue: v.number(),
            amountPaid: v.number(),
          })
        ),
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const callerSchoolId = await getVerifiedSchoolId(ctx, args.collectedBy);

    const createdIds: string[] = [];
    const now = new Date().toISOString();

    for (const payment of args.payments) {
      if (payment.schoolId !== callerSchoolId) {
        throw new Error('Unauthorized: You do not belong to this school');
      }
      const paymentId = generatePaymentId();
      const receiptNumber = generateReceiptNumber();

      const totalAmountDue = payment.items.reduce((sum, item) => sum + item.amountDue, 0);
      const totalAmountPaid = payment.items.reduce((sum, item) => sum + item.amountPaid, 0);
      const totalBalance = totalAmountDue - totalAmountPaid;

      let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
      if (totalAmountPaid >= totalAmountDue) {
        paymentStatus = 'paid';
      } else if (totalAmountPaid > 0) {
        paymentStatus = 'partial';
      }

      const paymentDbId = await ctx.db.insert('feePayments', {
        schoolId: payment.schoolId,
        paymentId,
        receiptNumber,
        studentId: payment.studentId,
        studentName: payment.studentName,
        classId: payment.classId,
        className: payment.className,
        version: 2,
        items: JSON.stringify(payment.items),
        totalAmountDue,
        totalAmountPaid,
        totalBalance,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: payment.paymentDate,
        paymentStatus,
        remainingBalance: totalBalance,
        notes: payment.notes,
        paidBy: payment.paidBy,
        collectedBy: payment.collectedBy,
        collectedByName: payment.collectedByName,
        createdAt: now,
        updatedAt: now,
      });

      createdIds.push(paymentDbId);
    }

    return createdIds;
  },
});
