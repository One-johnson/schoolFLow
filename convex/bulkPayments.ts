import { v } from 'convex/values';
import { mutation } from './_generated/server';

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

// Bulk import payments from CSV
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

    for (const payment of args.payments) {
      try {
        // Validate student exists
        const student = await ctx.db
          .query('students')
          .withIndex('by_student_id', (q) => q.eq('studentId', payment.studentId))
          .first();

        if (!student) {
          errors.push(`Student ${payment.studentId} not found`);
          failCount++;
          continue;
        }

        // Generate IDs
        const paymentId = generatePaymentId();
        const receiptNumber = generateReceiptNumber();
        const now = new Date().toISOString();

        const remainingBalance = payment.amountDue - payment.amountPaid;
        let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';

        if (payment.amountPaid >= payment.amountDue) {
          paymentStatus = 'paid';
        } else if (payment.amountPaid > 0) {
          paymentStatus = 'partial';
        }

        // Insert payment record
        await ctx.db.insert('feePayments', {
          schoolId: args.schoolId,
          paymentId,
          receiptNumber,
          studentId: payment.studentId,
          studentName: payment.studentName,
          classId: payment.classId,
          className: payment.className,
          categoryId: payment.categoryId,
          categoryName: payment.categoryName,
          amountDue: payment.amountDue,
          amountPaid: payment.amountPaid,
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          paymentDate: payment.paymentDate,
          paymentStatus,
          remainingBalance,
          notes: payment.notes,
          paidBy: payment.paidBy,
          collectedBy: args.collectedBy,
          collectedByName: args.collectedByName,
          createdAt: now,
          updatedAt: now,
        });

        successCount++;
      } catch (error) {
        failCount++;
        errors.push(`Error processing payment for ${payment.studentId}: ${error}`);
        console.error(`Failed to import payment for ${payment.studentId}:`, error);
      }
    }

    return { successCount, failCount, errors };
  },
});

// Apply fee structure to multiple students
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
    // Get fee structure
    const structure = await ctx.db
      .query('feeStructures')
      .withIndex('by_structure_code', (q) => q.eq('structureCode', args.feeStructureId))
      .first();

    if (!structure) {
      throw new Error('Fee structure not found');
    }

    // Parse fees from structure
    const fees = JSON.parse(structure.fees) as Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
    }>;

    let successCount = 0;
    let failCount = 0;
    const now = new Date().toISOString();

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

        // Create payment records for each fee category
        for (const fee of fees) {
          const paymentId = generatePaymentId();
          const receiptNumber = generateReceiptNumber();

          await ctx.db.insert('feePayments', {
            schoolId: args.schoolId,
            paymentId,
            receiptNumber,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            classId: student.classId,
            className: student.className,
            feeStructureId: args.feeStructureId,
            academicYearId: args.academicYearId,
            termId: args.termId,
            categoryId: fee.categoryId,
            categoryName: fee.categoryName,
            amountDue: fee.amount,
            amountPaid: 0,
            paymentMethod: 'cash',
            paymentDate: now,
            paymentStatus: 'pending',
            remainingBalance: fee.amount,
            collectedBy: args.collectedBy,
            collectedByName: args.collectedByName,
            createdAt: now,
            updatedAt: now,
          });
        }

        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to apply fees to student ${studentId}:`, error);
      }
    }

    return { successCount, failCount };
  },
});
