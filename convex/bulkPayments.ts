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

        // Calculate totals
        const totalAmountDue = items.reduce((sum, item) => sum + item.amountDue, 0);
        const totalAmountPaid = items.reduce((sum, item) => sum + item.amountPaid, 0);
        const totalBalance = totalAmountDue - totalAmountPaid;

        let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
        if (totalAmountPaid >= totalAmountDue) {
          paymentStatus = 'paid';
        } else if (totalAmountPaid > 0) {
          paymentStatus = 'partial';
        }

        // Generate IDs
        const paymentId = generatePaymentId();
        const receiptNumber = generateReceiptNumber();
        const now = new Date().toISOString();

        // Insert consolidated V2 payment record
        await ctx.db.insert('feePayments', {
          schoolId: args.schoolId,
          paymentId,
          receiptNumber,
          studentId: firstPayment.studentId,
          studentName: firstPayment.studentName,
          classId: firstPayment.classId,
          className: firstPayment.className,
          version: 2,
          items: JSON.stringify(items),
          totalAmountDue,
          totalAmountPaid,
          totalBalance,
          paymentMethod: firstPayment.paymentMethod,
          transactionReference: firstPayment.transactionReference,
          paymentDate: firstPayment.paymentDate,
          paymentStatus,
          remainingBalance: totalBalance,
          notes: firstPayment.notes,
          paidBy: firstPayment.paidBy,
          collectedBy: args.collectedBy,
          collectedByName: args.collectedByName,
          createdAt: now,
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

        // Create items array from fee structure
        const items = fees.map(fee => ({
          categoryId: fee.categoryId,
          categoryName: fee.categoryName,
          amountDue: fee.amount,
          amountPaid: 0,
        }));

        // Calculate totals
        const totalAmountDue = items.reduce((sum, item) => sum + item.amountDue, 0);
        const totalAmountPaid = 0;
        const totalBalance = totalAmountDue;

        const paymentId = generatePaymentId();
        const receiptNumber = generateReceiptNumber();

        // Create ONE consolidated V2 payment per student with all categories
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
          version: 2,
          items: JSON.stringify(items),
          totalAmountDue,
          totalAmountPaid,
          totalBalance,
          paymentMethod: 'cash',
          paymentDate: now,
          paymentStatus: 'pending',
          remainingBalance: totalBalance,
          collectedBy: args.collectedBy,
          collectedByName: args.collectedByName,
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
