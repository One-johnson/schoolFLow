import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Schools (Tenants)
  schools: defineTable({
    name: v.string(),
    subdomain: v.optional(v.string()), // e.g., "schoolname"
    domain: v.optional(v.string()), // e.g., "schoolname.edu"
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    logo: v.optional(v.string()),
    settings: v.optional(
      v.object({
        academicYearStart: v.optional(v.string()), // e.g., "April"
        currency: v.optional(v.string()), // e.g., "USD"
        timezone: v.optional(v.string()), // e.g., "America/New_York"
      })
    ),
    subscriptionPlan: v.optional(v.string()), // e.g., "free", "premium"
    status: v.string(), // "active", "suspended", "inactive"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subdomain", ["subdomain"])
    .index("by_domain", ["domain"])
    .index("by_status", ["status"]),

  // Users
  users: defineTable({
    schoolId: v.id("schools"), // Tenant isolation
    email: v.string(),
    password: v.string(), // Hashed
    role: v.string(), // "super_admin", "school_admin", "principal", "teacher", "student", "parent", "staff"
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    photo: v.optional(v.string()),
    status: v.string(), // "active", "inactive", "suspended"
    lastLogin: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_email", ["email"])
    .index("by_school_and_email", ["schoolId", "email"])
    .index("by_school_and_role", ["schoolId", "role"])
    .index("by_role", ["role"]),

  // Sessions for authentication
  sessions: defineTable({
    userId: v.id("users"),
    schoolId: v.id("schools"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"])
    .index("by_expires", ["expiresAt"]),
});
