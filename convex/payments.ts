import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all payments for a subscription
export const getPaymentsBySubscription = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_subscription", (q) =>
        q.eq("subscriptionId", args.subscriptionId)
      )
      .order("desc")
      .collect();

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const recorder = await ctx.db.get(payment.recordedBy);
        const school = await ctx.db.get(payment.schoolId);

        return {
          ...payment,
          recorderName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
          schoolName: school?.name || "Unknown",
        };
      })
    );

    return enrichedPayments;
  },
});

// Get all payments for a school
export const getPaymentsBySchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .collect();

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const recorder = await ctx.db.get(payment.recordedBy);
        const subscription = await ctx.db.get(payment.subscriptionId);

        return {
          ...payment,
          recorderName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
          subscriptionDetails: subscription,
        };
      })
    );

    return enrichedPayments;
  },
});

// Get all payments (super admin)
export const getAllPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").order("desc").collect();

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const school = await ctx.db.get(payment.schoolId);
        const recorder = await ctx.db.get(payment.recordedBy);
        const subscription = await ctx.db.get(payment.subscriptionId);

        return {
          ...payment,
          schoolName: school?.name || "Unknown",
          recorderName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
          subscriptionDetails: subscription,
        };
      })
    );

    return enrichedPayments;
  },
});

// Get pending payments
export const getPendingPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("paymentStatus", "pending"))
      .collect();

    return payments;
  },
});

// Get overdue payments
export const getOverduePayments = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_due_date")
      .filter(
        (q) =>
          q.and(
            q.lt(q.field("dueDate"), now),
            q.or(
              q.eq(q.field("paymentStatus"), "pending"),
              q.eq(q.field("paymentStatus"), "overdue")
            )
          )
      )
      .collect();

    return payments;
  },
});

// Create payment record
export const createPayment = mutation({
  args: {
    schoolId: v.id("schools"),
    subscriptionId: v.id("subscriptions"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.string(),
    paymentDate: v.optional(v.number()),
    dueDate: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      schoolId: args.schoolId,
      subscriptionId: args.subscriptionId,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentStatus,
      paymentDate: args.paymentDate,
      dueDate: args.dueDate,
      reference: args.reference,
      notes: args.notes,
      receiptUrl: args.receiptUrl,
      recordedBy: args.recordedBy,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

// Update payment record
export const updatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    amount: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paymentId, ...updates } = args;

    await ctx.db.patch(paymentId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

// Delete payment record
export const deletePayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.paymentId);
    return args.paymentId;
  },
});

// Mark payment as paid
export const markPaymentAsPaid = mutation({
  args: {
    paymentId: v.id("payments"),
    paymentDate: v.number(),
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      paymentStatus: "paid",
      paymentDate: args.paymentDate,
      reference: args.reference,
      updatedAt: Date.now(),
    });

    return args.paymentId;
  },
});

// Get payment statistics
export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();

    const totalRevenue = payments
      .filter((p) => p.paymentStatus === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.paymentStatus === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const overdueAmount = payments
      .filter((p) => p.paymentStatus === "overdue")
      .reduce((sum, p) => sum + p.amount, 0);

    const paidCount = payments.filter((p) => p.paymentStatus === "paid").length;
    const pendingCount = payments.filter(
      (p) => p.paymentStatus === "pending"
    ).length;
    const overdueCount = payments.filter(
      (p) => p.paymentStatus === "overdue"
    ).length;

    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      paidCount,
      pendingCount,
      overdueCount,
      totalPayments: payments.length,
    };
  },
});
