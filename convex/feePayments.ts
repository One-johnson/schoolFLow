import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Verify the caller is a school admin and return their schoolId.
// collectedBy may be a Convex document Id (from parent) or email (from useAuth).
async function getVerifiedSchoolId(ctx: MutationCtx, adminIdOrEmail: string): Promise<string> {
  // Try as Convex document Id first (valid Convex IDs are 32 chars)
  if (adminIdOrEmail.length === 32 && /^[a-zA-Z0-9_-]+$/.test(adminIdOrEmail)) {
    const adminById = await ctx.db.get(adminIdOrEmail as Id<'schoolAdmins'>);
    if (adminById) return adminById.schoolId;
  }
  // Otherwise resolve by email (e.g. when frontend passes user.email)
  const adminByEmail = await ctx.db
    .query('schoolAdmins')
    .withIndex('by_email', (q) => q.eq('email', adminIdOrEmail))
    .first();
  if (!adminByEmail) {
    throw new Error('Unauthorized: Admin not found');
  }
  return adminByEmail.schoolId;
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

// Returns true if obligation's term is strictly before current term (for arrears rollover).
async function isObligationTermBefore(
  ctx: MutationCtx,
  obligationTermId: string | undefined,
  currentTermId: string | undefined,
  currentAcademicYearId: string | undefined,
  currentTermNumber: number
): Promise<boolean> {
  if (!obligationTermId || !currentTermId) return false;
  const obligTerm = await ctx.db.get(obligationTermId as Id<'terms'>);
  const currentTerm = await ctx.db.get(currentTermId as Id<'terms'>);
  if (!obligTerm || !currentTerm) return false;
  const obligYear = await ctx.db.get(obligTerm.academicYearId);
  const currentYear = await ctx.db.get(currentTerm.academicYearId as Id<'academicYears'>);
  if (!obligYear || !currentYear) return false;
  const obligStart = obligYear.startDate ?? '';
  const currentStart = currentYear.startDate ?? '';
  if (obligStart < currentStart) return true;
  if (obligStart > currentStart) return false;
  return obligTerm.termNumber < currentTermNumber;
}

// Find or create obligation for student + fee structure (two-layer model). When creating new,
// adds arrears from previous-term obligations and marks them rolled_forward.
async function getOrCreateObligation(
  ctx: MutationCtx,
  args: {
    schoolId: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    feeStructureId?: string;
    academicYearId?: string;
    termId?: string;
    totalAmountDue: number;
    itemsJson: string;
  }
): Promise<Id<'feeObligations'>> {
  const existing = await ctx.db
    .query('feeObligations')
    .withIndex('by_student', (q) =>
      q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
    )
    .collect();
  const match = existing.find(
    (o) => (o.feeStructureId ?? '') === (args.feeStructureId ?? '')
  );
  if (match) return match._id;

  let totalAmountDue = args.totalAmountDue;
  const toRollForward: Id<'feeObligations'>[] = [];
  const currentTermId = args.termId;
  const currentAcademicYearId = args.academicYearId;
  let currentTermNumber = 0;
  if (currentTermId) {
    const currentTerm = await ctx.db.get(currentTermId as Id<'terms'>);
    if (currentTerm) currentTermNumber = currentTerm.termNumber;
  }

  const pendingOrPartial = existing.filter(
    (o) =>
      (o.status === 'pending' || o.status === 'partial') &&
      o.totalBalance > 0 &&
      (o.feeStructureId ?? '') !== (args.feeStructureId ?? '')
  );
  for (const o of pendingOrPartial) {
    const isBefore = await isObligationTermBefore(
      ctx,
      o.termId,
      currentTermId,
      currentAcademicYearId,
      currentTermNumber
    );
    if (isBefore) {
      totalAmountDue += o.totalBalance;
      toRollForward.push(o._id);
    }
  }

  const now = new Date().toISOString();
  const newObligationId = await ctx.db.insert('feeObligations', {
    schoolId: args.schoolId,
    studentId: args.studentId,
    studentName: args.studentName,
    classId: args.classId,
    className: args.className,
    feeStructureId: args.feeStructureId,
    academicYearId: args.academicYearId,
    termId: args.termId,
    totalAmountDue,
    totalAmountPaid: 0,
    totalBalance: totalAmountDue,
    status: 'pending',
    items: args.itemsJson,
    createdAt: now,
    updatedAt: now,
  });

  for (const id of toRollForward) {
    await ctx.db.patch(id, {
      status: 'rolled_forward',
      totalBalance: 0,
      rolledForwardToObligationId: newObligationId,
      updatedAt: now,
    });
  }

  return newObligationId;
}

// Record fee payment: insert transaction + update obligation (two-layer model)
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

    const now = new Date().toISOString();
    const totalAmountDue = args.items.reduce((sum, item) => sum + item.amountDue, 0);
    const thisPaymentAmount = args.items.reduce((sum, item) => sum + item.amountPaid, 0);
    if (thisPaymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    let academicYearId = args.academicYearId;
    let termId = args.termId;
    if (args.feeStructureId && (!termId || !academicYearId)) {
      const structure = await ctx.db.get(args.feeStructureId as Id<'feeStructures'>);
      if (structure) {
        termId = termId ?? structure.termId;
        academicYearId = academicYearId ?? structure.academicYearId;
      }
    }

    const obligationId = await getOrCreateObligation(ctx, {
      schoolId: args.schoolId,
      studentId: args.studentId,
      studentName: args.studentName,
      classId: args.classId,
      className: args.className,
      feeStructureId: args.feeStructureId,
      academicYearId,
      termId,
      totalAmountDue,
      itemsJson: JSON.stringify(args.items),
    });

    const obligation = await ctx.db.get(obligationId);
    if (!obligation) throw new Error('Obligation not found');

    const creditRows = await ctx.db
      .query('feeCreditLedger')
      .withIndex('by_school_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .collect();
    const creditBalance = creditRows.reduce((sum, r) => sum + r.amount, 0);

    const amountFromCredit = Math.max(
      0,
      Math.min(creditBalance, obligation.totalBalance)
    );
    const amountFromPayment = Math.max(
      0,
      Math.min(thisPaymentAmount, obligation.totalBalance - amountFromCredit)
    );
    const totalApplied = amountFromCredit + amountFromPayment;
    const overpaymentExcess = Math.max(0, thisPaymentAmount - amountFromPayment);

    const newTotalPaid = obligation.totalAmountPaid + totalApplied;
    let newBalance = obligation.totalAmountDue - newTotalPaid;
    newBalance = Math.max(0, newBalance);
    let newStatus: 'paid' | 'partial' | 'pending' = 'pending';
    if (newBalance <= 0) newStatus = 'paid';
    else if (newTotalPaid > 0) newStatus = 'partial';

    const receiptNumber = generateReceiptNumber();

    const transactionId = await ctx.db.insert('feePaymentTransactions', {
      schoolId: args.schoolId,
      obligationId,
      studentId: args.studentId,
      studentName: args.studentName,
      classId: args.classId,
      className: args.className,
      receiptNumber,
      amount: totalApplied,
      items: JSON.stringify(args.items),
      paymentMethod: args.paymentMethod,
      transactionReference: args.transactionReference,
      paymentDate: args.paymentDate,
      paidBy: args.paidBy,
      collectedBy: args.collectedBy,
      collectedByName: args.collectedByName,
      notes: args.notes,
      createdAt: now,
    });

    if (amountFromCredit > 0) {
      await ctx.db.insert('feeCreditLedger', {
        schoolId: args.schoolId,
        studentId: args.studentId,
        amount: -amountFromCredit,
        obligationId,
        transactionId,
        referenceType: 'application',
        createdAt: now,
      });
    }
    if (overpaymentExcess > 0) {
      await ctx.db.insert('feeCreditLedger', {
        schoolId: args.schoolId,
        studentId: args.studentId,
        amount: overpaymentExcess,
        obligationId,
        transactionId,
        referenceType: 'overpayment',
        createdAt: now,
      });
    }

    await ctx.db.patch(obligationId, {
      totalAmountPaid: newTotalPaid,
      totalBalance: newBalance,
      status: newStatus,
      updatedAt: now,
    });

    return transactionId;
  },
});

// Get all payment transactions for a school (one row per payment event; for "All Payments" list)
export const getPaymentsBySchool = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();

    const withObligation = await Promise.all(
      transactions.map(async (t) => {
        const obligation = await ctx.db.get(t.obligationId);
        return {
          ...t,
          paymentId: t.receiptNumber,
          version: 2,
          totalAmountDue: obligation?.totalAmountDue ?? 0,
          totalAmountPaid: obligation?.totalAmountPaid ?? 0,
          totalBalance: obligation?.totalBalance ?? 0,
          paymentStatus: obligation?.status ?? 'pending',
          remainingBalance: obligation?.totalBalance ?? 0,
        };
      })
    );

    return withObligation;
  },
});

// Get payment transactions for a specific student (payment history)
export const getPaymentsByStudent = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .withIndex('by_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .order('desc')
      .collect();

    const withObligation = await Promise.all(
      transactions.map(async (t) => {
        const obligation = await ctx.db.get(t.obligationId);
        return {
          ...t,
          totalAmountDue: obligation?.totalAmountDue ?? 0,
          totalAmountPaid: obligation?.totalAmountPaid ?? 0,
          totalBalance: obligation?.totalBalance ?? 0,
          paymentStatus: obligation?.status ?? 'pending',
          remainingBalance: obligation?.totalBalance ?? 0,
        };
      })
    );

    return withObligation;
  },
});

// Get payment transactions by class
export const getPaymentsByClass = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .order('desc')
      .collect();
    const forClass = transactions.filter((t) => t.classId === args.classId);
    const withObligation = await Promise.all(
      forClass.map(async (t) => {
        const obligation = await ctx.db.get(t.obligationId);
        return {
          ...t,
          paymentId: t.receiptNumber,
          totalAmountDue: obligation?.totalAmountDue ?? 0,
          totalAmountPaid: obligation?.totalAmountPaid ?? 0,
          totalBalance: obligation?.totalBalance ?? 0,
          paymentStatus: obligation?.status ?? 'pending',
          remainingBalance: obligation?.totalBalance ?? 0,
        };
      })
    );
    return withObligation;
  },
});

// Get obligation and its transactions for a student + fee structure (for record-payment dialog summary)
export const getObligationAndTransactionsForStudent = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
    feeStructureId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const obligations = await ctx.db
      .query('feeObligations')
      .withIndex('by_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .collect();

    const obligation = obligations.find(
      (o) => (o.feeStructureId ?? '') === (args.feeStructureId ?? '')
    );

    if (!obligation) {
      return { obligation: null, transactions: [] };
    }

    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .withIndex('by_obligation', (q) => q.eq('obligationId', obligation._id))
      .order('desc')
      .collect();

    return { obligation, transactions };
  },
});

// Get student's fee credit balance (from overpayments; applied to future payments).
export const getStudentCreditBalance = query({
  args: {
    schoolId: v.string(),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('feeCreditLedger')
      .withIndex('by_school_student', (q) =>
        q.eq('schoolId', args.schoolId).eq('studentId', args.studentId)
      )
      .collect();
    return rows.reduce((sum, r) => sum + r.amount, 0);
  },
});

// Get fee obligations for parent's children (read-only, for parent portal).
// Uses fee structure totalAmount as "Due" when available, not the obligation's stored value
// (which may have been derived incorrectly from payment items).
export const getFeeObligationsForParent = query({
  args: {
    schoolId: v.string(),
    studentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const obligations = await ctx.db
      .query('feeObligations')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .collect();

    const filtered = obligations.filter((o) => args.studentIds.includes(o.studentId));

    return Promise.all(
      filtered.map(async (o) => {
        let totalAmountDue = o.totalAmountDue;
        if (o.feeStructureId) {
          const structure = await ctx.db.get(o.feeStructureId as Id<'feeStructures'>);
          if (structure?.totalAmount != null) {
            totalAmountDue = structure.totalAmount;
          }
        }
        const totalBalance = Math.max(0, totalAmountDue - o.totalAmountPaid);
        return {
          ...o,
          totalAmountDue,
          totalBalance,
        };
      })
    );
  },
});

// Get outstanding obligations (pending and partial; exclude rolled_forward) - one row per obligation
export const getOutstandingPayments = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('feeObligations')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field('status'), 'pending'), q.eq(q.field('status'), 'partial')),
          q.gt(q.field('totalBalance'), 0)
        )
      )
      .order('desc')
      .collect();
  },
});

// Get outstanding aggregated by student (from obligations; exclude rolled_forward; one row per student)
export const getOutstandingByStudent = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const obligations = await ctx.db
      .query('feeObligations')
      .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field('status'), 'pending'),
            q.eq(q.field('status'), 'partial')
          ),
          q.gt(q.field('totalBalance'), 0)
        )
      )
      .collect();

    const byStudent = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        classId: string;
        className: string;
        totalOutstanding: number;
        totalAmountDue: number;
        totalAmountPaid: number;
        paymentStatus: 'partial' | 'pending';
      }
    >();

    for (const o of obligations) {
      if (o.totalBalance <= 0) continue;
      const existing = byStudent.get(o.studentId);
      if (existing) {
        existing.totalOutstanding += o.totalBalance;
        existing.totalAmountDue += o.totalAmountDue;
        existing.totalAmountPaid += o.totalAmountPaid;
        if (o.status === 'partial') existing.paymentStatus = 'partial';
      } else {
        byStudent.set(o.studentId, {
          studentId: o.studentId,
          studentName: o.studentName,
          classId: o.classId,
          className: o.className,
          totalOutstanding: o.totalBalance,
          totalAmountDue: o.totalAmountDue,
          totalAmountPaid: o.totalAmountPaid,
          paymentStatus: o.status === 'partial' ? 'partial' : 'pending',
        });
      }
    }

    return Array.from(byStudent.values());
  },
});

// Get payment statistics (from obligations + transactions)
export const getPaymentStats = query({
  args: { schoolId: v.string() },
  handler: async (ctx, args) => {
    const [obligations, transactions] = await Promise.all([
      ctx.db
        .query('feeObligations')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .collect(),
      ctx.db
        .query('feePaymentTransactions')
        .withIndex('by_school', (q) => q.eq('schoolId', args.schoolId))
        .collect(),
    ]);

    const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalDue = obligations.reduce((sum, o) => sum + o.totalAmountDue, 0);
    const outstandingObligations = obligations.filter(
      (o) =>
        (o.status === 'pending' || o.status === 'partial') &&
        o.totalBalance > 0
    );
    const totalOutstanding = outstandingObligations.reduce(
      (sum, o) => sum + o.totalBalance,
      0
    );

    const activeObligations = obligations.filter(
      (o) => o.status !== 'rolled_forward'
    );
    const paidCount = activeObligations.filter((o) => o.status === 'paid').length;
    const partialCount = activeObligations.filter(
      (o) => o.status === 'partial'
    ).length;
    const pendingCount = activeObligations.filter(
      (o) => o.status === 'pending'
    ).length;

    return {
      totalCollected,
      totalOutstanding,
      totalDue,
      paidCount,
      partialCount,
      pendingCount,
      totalPayments: transactions.length,
    };
  },
});

// Recompute obligation totals from all its transactions
async function recomputeObligation(
  ctx: MutationCtx,
  obligationId: Id<'feeObligations'>
): Promise<void> {
  const obligation = await ctx.db.get(obligationId);
  if (!obligation) return;

  const transactions = await ctx.db
    .query('feePaymentTransactions')
    .withIndex('by_obligation', (q) => q.eq('obligationId', obligationId))
    .collect();

  const totalAmountPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  let totalBalance = obligation.totalAmountDue - totalAmountPaid;
  totalBalance = Math.max(0, totalBalance);
  let status: 'paid' | 'partial' | 'pending' = 'pending';
  if (totalBalance <= 0) status = 'paid';
  else if (totalAmountPaid > 0) status = 'partial';

  await ctx.db.patch(obligationId, {
    totalAmountPaid,
    totalBalance,
    status,
    updatedAt: new Date().toISOString(),
  });
}

// Update payment transaction (and recompute obligation)
export const updatePayment = mutation({
  args: {
    paymentId: v.id('feePaymentTransactions'),
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

    const transaction = await ctx.db.get(paymentId);
    if (!transaction) throw new Error('Payment not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, updatedBy);
    if (callerSchoolId !== transaction.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const patch: Record<string, unknown> = { ...updates };
    if (items) {
      const amount = items.reduce((sum, item) => sum + item.amountPaid, 0);
      patch.items = JSON.stringify(items);
      patch.amount = amount;
    }

    await ctx.db.patch(paymentId, patch);
    await recomputeObligation(ctx, transaction.obligationId);
    return paymentId;
  },
});

// Delete payment transaction (and recompute obligation)
export const deletePayment = mutation({
  args: {
    paymentId: v.id('feePaymentTransactions'),
    deletedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.paymentId);
    if (!transaction) throw new Error('Payment not found');

    const callerSchoolId = await getVerifiedSchoolId(ctx, args.deletedBy);
    if (callerSchoolId !== transaction.schoolId) {
      throw new Error('Unauthorized: You do not belong to this school');
    }

    const obligationId = transaction.obligationId;
    await ctx.db.delete(args.paymentId);
    await recomputeObligation(ctx, obligationId);
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
    const now = new Date().toISOString();
    const createdIds: string[] = [];

    for (const payment of args.payments) {
      if (payment.schoolId !== callerSchoolId) {
        throw new Error('Unauthorized: You do not belong to this school');
      }

      const totalAmountDue = payment.items.reduce((sum, item) => sum + item.amountDue, 0);
      const thisPaymentAmount = payment.items.reduce((sum, item) => sum + item.amountPaid, 0);
      if (thisPaymentAmount <= 0) continue;

      const obligationId = await getOrCreateObligation(ctx, {
        schoolId: payment.schoolId,
        studentId: payment.studentId,
        studentName: payment.studentName,
        classId: payment.classId,
        className: payment.className,
        totalAmountDue,
        itemsJson: JSON.stringify(payment.items),
      });

      const obligation = await ctx.db.get(obligationId);
      if (!obligation) continue;

      const newTotalPaid = obligation.totalAmountPaid + thisPaymentAmount;
      const newBalance = obligation.totalAmountDue - newTotalPaid;
      let newStatus: 'paid' | 'partial' | 'pending' = 'pending';
      if (newTotalPaid >= obligation.totalAmountDue) newStatus = 'paid';
      else if (newTotalPaid > 0) newStatus = 'partial';

      const receiptNumber = generateReceiptNumber();
      const transactionId = await ctx.db.insert('feePaymentTransactions', {
        schoolId: payment.schoolId,
        obligationId,
        studentId: payment.studentId,
        studentName: payment.studentName,
        classId: payment.classId,
        className: payment.className,
        receiptNumber,
        amount: thisPaymentAmount,
        items: JSON.stringify(payment.items),
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: payment.paymentDate,
        paidBy: payment.paidBy,
        collectedBy: payment.collectedBy,
        collectedByName: payment.collectedByName,
        notes: payment.notes,
        createdAt: now,
      });

      await ctx.db.patch(obligationId, {
        totalAmountPaid: newTotalPaid,
        totalBalance: newBalance,
        status: newStatus,
        updatedAt: now,
      });

      createdIds.push(transactionId);
    }

    return createdIds;
  },
});

// Get payment transactions by student ID (for teacher portal - payment history)
export const getFeePaymentsByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('feePaymentTransactions')
      .collect();
    const forStudent = transactions.filter((t) => t.studentId === args.studentId);
    const withObligation = await Promise.all(
      forStudent.map(async (t) => {
        const obligation = await ctx.db.get(t.obligationId);
        return {
          ...t,
          paymentId: t.receiptNumber,
          version: 2,
          totalAmountDue: obligation?.totalAmountDue ?? 0,
          totalAmountPaid: obligation?.totalAmountPaid ?? 0,
          totalBalance: obligation?.totalBalance ?? 0,
          paymentStatus: obligation?.status ?? 'pending',
          remainingBalance: obligation?.totalBalance ?? 0,
        };
      })
    );
    return withObligation.sort(
      (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
  },
});
