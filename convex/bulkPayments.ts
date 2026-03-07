import { v } from 'convex/values';
import { mutation } from './_generated/server';
import type { Id } from './_generated/dataModel';

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

// Bulk import payments from CSV (V2 format - consolidated multi-category)
export const bulkImportPayments = mutation({
  args: {
    schoolId: v.string(),
    payments: v.array(v.object({
      studentId: v.string(),
      studentName: v.string(),
      classId: v.string(),
      className: v.string(),
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
      paidBy: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),
    collectedBy: v.string(),
    collectedByName: v.string(),
  },
  handler: async (ctx, args) => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Group payments by student to create consolidated V2 payments
    const paymentsByStudent = new Map<string, typeof args.payments>();
    
    for (const payment of args.payments) {
      const key = payment.studentId;
      if (!paymentsByStudent.has(key)) {
        paymentsByStudent.set(key, []);
      }
      paymentsByStudent.get(key)!.push(payment);
    }

    // Create one consolidated payment per student
    for (const [studentId, studentPayments] of paymentsByStudent) {
      try {
        // Validate student exists
        const student = await ctx.db
          .query('students')
          .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
          .first();

        if (!student) {
          errors.push(`Student ${studentId} not found`);
          failCount++;
          continue;
        }

        // Use the first payment's metadata
        const firstPayment = studentPayments[0];

        // Create items array from all categories
        const items = studentPayments.map(p => ({
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          amountDue: p.amountDue,
          amountPaid: p.amountPaid,
        }));

        const totalAmountDue = items.reduce((sum, item) => sum + item.amountDue, 0);
        const thisAmount = items.reduce((sum, item) => sum + item.amountPaid, 0);
        if (thisAmount <= 0) {
          failCount++;
          continue;
        }

        const now = new Date().toISOString();
        const receiptNumber = generateReceiptNumber();

        const existing = await ctx.db
          .query('feeObligations')
          .withIndex('by_student', (q) =>
            q.eq('schoolId', args.schoolId).eq('studentId', studentId)
          )
          .collect();
        const feeStructureId = undefined;
        const match = existing.find((o) => (o.feeStructureId ?? '') === (feeStructureId ?? ''));
        let obligationId: Id<'feeObligations'>;
        if (match) {
          obligationId = match._id;
        } else {
          obligationId = await ctx.db.insert('feeObligations', {
            schoolId: args.schoolId,
            studentId: firstPayment.studentId,
            studentName: firstPayment.studentName,
            classId: firstPayment.classId,
            className: firstPayment.className,
            feeStructureId,
            totalAmountDue,
            totalAmountPaid: 0,
            totalBalance: totalAmountDue,
            status: 'pending',
            items: JSON.stringify(items),
            createdAt: now,
            updatedAt: now,
          });
        }

        const obligation = await ctx.db.get(obligationId);
        if (!obligation) {
          failCount++;
          continue;
        }

        const newTotalPaid = obligation.totalAmountPaid + thisAmount;
        const newBalance = obligation.totalAmountDue - newTotalPaid;
        let newStatus: 'paid' | 'partial' | 'pending' = 'pending';
        if (newTotalPaid >= obligation.totalAmountDue) newStatus = 'paid';
        else if (newTotalPaid > 0) newStatus = 'partial';

        await ctx.db.insert('feePaymentTransactions', {
          schoolId: args.schoolId,
          obligationId,
          studentId: firstPayment.studentId,
          studentName: firstPayment.studentName,
          classId: firstPayment.classId,
          className: firstPayment.className,
          receiptNumber,
          amount: thisAmount,
          items: JSON.stringify(items),
          paymentMethod: firstPayment.paymentMethod,
          transactionReference: firstPayment.transactionReference,
          paymentDate: firstPayment.paymentDate,
          paidBy: firstPayment.paidBy,
          collectedBy: args.collectedBy,
          collectedByName: args.collectedByName,
          notes: firstPayment.notes,
          createdAt: now,
        });

        await ctx.db.patch(obligationId, {
          totalAmountPaid: newTotalPaid,
          totalBalance: newBalance,
          status: newStatus,
          updatedAt: now,
        });

        successCount++;
      } catch (error) {
        failCount++;
        errors.push(`Error processing payment for ${studentId}: ${error}`);
        console.error(`Failed to import payment for ${studentId}:`, error);
      }
    }

    return { successCount, failCount, errors };
  },
});

// Apply fee structure to multiple students (V2 consolidated format)
export const applyFeeStructureToStudents = mutation({
  args: {
    schoolId: v.string(),
    feeStructureId: v.string(),
    studentIds: v.array(v.string()),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    collectedBy: v.string(),
    collectedByName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get fee structure (feeStructureId may be structureCode or Convex _id)
    let structure = await ctx.db
      .query('feeStructures')
      .withIndex('by_structure_code', (q) => q.eq('structureCode', args.feeStructureId))
      .first();
    if (!structure) {
      structure = await ctx.db.get(args.feeStructureId as Id<'feeStructures'>);
    }
    if (!structure) {
      throw new Error('Fee structure not found');
    }

    const fees = JSON.parse(structure.fees) as Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
    }>;

    let successCount = 0;
    let failCount = 0;
    const now = new Date().toISOString();
    const structureId = structure._id;

    for (const studentId of args.studentIds) {
      try {
        const student = await ctx.db
          .query('students')
          .withIndex('by_student_id', (q) => q.eq('studentId', studentId))
          .first();

        if (!student) {
          failCount++;
          continue;
        }

        const items = fees.map(fee => ({
          categoryId: fee.categoryId,
          categoryName: fee.categoryName,
          amountDue: fee.amount,
          amountPaid: 0,
        }));
        const totalAmountDue = items.reduce((sum, item) => sum + item.amountDue, 0);
        const itemsJson = JSON.stringify(items);

        const existing = await ctx.db
          .query('feeObligations')
          .withIndex('by_student', (q) =>
            q.eq('schoolId', args.schoolId).eq('studentId', studentId)
          )
          .collect();
        const match = existing.find(
          (o) => (o.feeStructureId ?? '') === (structureId ?? '')
        );
        if (match) {
          successCount++;
          continue;
        }

        await ctx.db.insert('feeObligations', {
          schoolId: args.schoolId,
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          classId: student.classId,
          className: student.className ?? '',
          feeStructureId: structureId,
          academicYearId: args.academicYearId,
          termId: args.termId,
          totalAmountDue,
          totalAmountPaid: 0,
          totalBalance: totalAmountDue,
          status: 'pending',
          items: itemsJson,
          createdAt: now,
          updatedAt: now,
        });

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to apply fees to student ${studentId}:`, error);
      }
    }

    return { successCount, failCount };
  },
});
