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
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()), // "male", "female", "other"
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
      })
    ),
    joiningDate: v.optional(v.number()),
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

  // Classes
  classes: defineTable({
    schoolId: v.id("schools"),
    name: v.string(), // e.g., "Grade 10"
    level: v.number(), // 1-12
    academicYear: v.string(), // e.g., "2024-2025"
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_school_and_year", ["schoolId", "academicYear"]),

  // Sections
  sections: defineTable({
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    name: v.string(), // e.g., "A", "B", "C"
    capacity: v.number(),
    classTeacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_class", ["classId"])
    .index("by_teacher", ["classTeacherId"]),

  // Students
  students: defineTable({
    userId: v.id("users"), // Reference to user record
    schoolId: v.id("schools"),
     studentId: v.string(), 
    admissionNumber: v.string(),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    rollNumber: v.optional(v.string()),
    parentIds: v.optional(v.array(v.id("users"))), // References to parent users
    dateOfBirth: v.number(),
    bloodGroup: v.optional(v.string()),
    address: v.string(),
    emergencyContact: v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
    }),
    medicalInfo: v.optional(v.string()),
    documents: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      uploadedAt: v.number(),
    }))),
    enrollmentDate: v.number(),
 status: v.string(), 
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_user", ["userId"])
    .index("by_class", ["classId"])
    .index("by_section", ["sectionId"])
    .index("by_admission_number", ["schoolId", "admissionNumber"])
    .index("by_status", ["schoolId", "status"]),
});
