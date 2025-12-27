import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  superAdmins: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    createdAt: v.string(),
    lastLogin: v.optional(v.string()),
  }).index('by_email', ['email']),

  schools: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    status: v.union(
      v.literal('pending_payment'),
      v.literal('pending_approval'),
      v.literal('active'),
      v.literal('suspended')
    ),
    adminId: v.string(),
    adminName: v.string(),
    studentCount: v.number(),
    subscriptionPlan: v.string(),
    monthlyFee: v.number(),
    registrationDate: v.string(),
    approvalDate: v.optional(v.string()),
    paymentVerified: v.boolean(),
    paymentDate: v.optional(v.string()),
  }).index('by_status', ['status']),

  schoolAdmins: defineTable({
    name: v.string(),
    email: v.string(),
    schoolId: v.string(),
    tempPassword: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
    createdAt: v.string(),
    invitedBy: v.string(),
  }).index('by_email', ['email']).index('by_school', ['schoolId']),

  subscriptions: defineTable({
    schoolId: v.string(),
    schoolName: v.string(),
    plan: v.string(),
    studentsCount: v.number(),
    pricePerStudent: v.number(),
    totalAmount: v.number(),
    status: v.union(v.literal('pending'), v.literal('verified'), v.literal('expired')),
    paymentMethod: v.string(),
    paymentDate: v.optional(v.string()),
    verifiedBy: v.optional(v.string()),
    verifiedDate: v.optional(v.string()),
    nextBillingDate: v.string(),
  }).index('by_school', ['schoolId']).index('by_status', ['status']),

  auditLogs: defineTable({
    timestamp: v.string(),
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    details: v.string(),
    ipAddress: v.string(),
  }).index('by_timestamp', ['timestamp']),

  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal('info'), v.literal('warning'), v.literal('success'), v.literal('error')),
    timestamp: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
  }).index('by_read', ['read']),

  subscriptionPlans: defineTable({
    name: v.string(),
    description: v.string(),
    pricePerStudent: v.number(),
    billingCycle: v.union(v.literal('monthly'), v.literal('quarterly'), v.literal('yearly')),
    features: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),
});
