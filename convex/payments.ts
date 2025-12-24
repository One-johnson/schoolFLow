import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all payments
export const getAllPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").order("desc").collect();

    // Enrich with school and subscription data
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const school = await ctx.db.get(payment.schoolId);
        const subscription = await ctx.db.get(payment.subscriptionId);
        const recorder = await ctx.db.get(payment.recordedBy);

        let planName = "Unknown";
        if (subscription) {
          const plan = await ctx.db.get(subscription.planId);
          planName = plan?.displayName || "Unknown";
        }

        return {
          ...payment,
          schoolName: school?.name || "Unknown",
          planName,
          recorderName: recorder
            ? `${recorder.firstName} ${recorder.lastName}`
            : "Unknown",
        };
      })
    );

    return enrichedPayments;
  },
});

// Get payments by school
export const getPaymentsBySchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .collect();

    // Enrich with subscription data
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const subscription = await ctx.db.get(payment.subscriptionId);
        let planName = "Unknown";
        if (subscription) {
          const plan = await ctx.db.get(subscription.planId);
          planName = plan?.displayName || "Unknown";
        }

        return {
          ...payment,
          planName,
        };
      })
    );

    return enrichedPayments;
  },
});

// Get payments by subscription
export const getPaymentsBySubscription = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_subscription", (q) =>
        q.eq("subscriptionId", args.subscriptionId)
      )
      .order("desc")
      .collect();
  },
});

// Get pending/overdue payments
export const getPendingPayments = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("paymentStatus", "pending"))
      .collect();

    const overduePayments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("paymentStatus", "overdue"))
      .collect();

    const allPending = [...payments, ...overduePayments];

    // Enrich with school data
    const enrichedPayments = await Promise.all(
      allPending.map(async (payment) => {
        const school = await ctx.db.get(payment.schoolId);
        const subscription = await ctx.db.get(payment.subscriptionId);

        let planName = "Unknown";
        if (subscription) {
          const plan = await ctx.db.get(subscription.planId);
          planName = plan?.displayName || "Unknown";
        }

        return {
          ...payment,
          schoolName: school?.name || "Unknown",
          schoolEmail: school?.email || "",
          planName,
        };
      })
    );

    return enrichedPayments;
  },
});

// Record payment
export const recordPayment = mutation({
  args: {
    schoolId: v.id("schools"),
    subscriptionId: v.id("subscriptions"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    paymentDate: v.optional(v.number()),
    dueDate: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine payment status
    const paymentStatus = args.paymentDate ? "paid" : "pending";

    const paymentId = await ctx.db.insert("payments", {
      schoolId: args.schoolId,
      subscriptionId: args.subscriptionId,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentStatus,
      paymentDate: args.paymentDate,
      dueDate: args.dueDate,
      reference: args.reference,
      notes: args.notes,
      recordedBy: args.recordedBy,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

// Update payment
export const updatePayment = mutation({
  args: {
    paymentId: v.id("payments"),
    amount: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
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

// Mark payment as paid
export const markPaymentAsPaid = mutation({
  args: {
    paymentId: v.id("payments"),
    paymentDate: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      paymentStatus: "paid",
      paymentDate: args.paymentDate,
      reference: args.reference,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return args.paymentId;
  },
});

// Mark payment as overdue (cron job)
export const markOverduePayments = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const pendingPayments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("paymentStatus", "pending"))
      .collect();

    const overduePayments = pendingPayments.filter((p) => p.dueDate < now);

    for (const payment of overduePayments) {
      await ctx.db.patch(payment._id, {
        paymentStatus: "overdue",
        updatedAt: now,
      });
    }

    return {
      overdueCount: overduePayments.length,
      message: `${overduePayments.length} payments marked as overdue`,
    };
  },
});

// Get payment statistics
export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();

    const paidPayments = payments.filter((p) => p.paymentStatus === "paid");
    const pendingPayments = payments.filter(
      (p) => p.paymentStatus === "pending"
    );
    const overduePayments = payments.filter(
      (p) => p.paymentStatus === "overdue"
    );

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueRevenue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    // Get this month's revenue
    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthPayments = paidPayments.filter(
      (p) => p.paymentDate && p.paymentDate >= monthStart.getTime()
    );
    const thisMonthRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return {
      totalRevenue,
      pendingRevenue,
      overdueRevenue,
      thisMonthRevenue,
      totalPayments: payments.length,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
    };
  },
});
