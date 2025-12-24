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
    schoolId: v.optional(v.id("schools")), // Tenant isolation - optional for super_admin
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
    schoolId: v.optional(v.id("schools")),
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
    studentId: v.string(), // Auto-generated student ID (also used as initial password)
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
    status: v.string(), // "fresher", "continuing", "graduated"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_user", ["userId"])
    .index("by_class", ["classId"])
    .index("by_section", ["sectionId"])
    .index("by_admission_number", ["schoolId", "admissionNumber"])
    .index("by_student_id", ["schoolId", "studentId"])
    .index("by_status", ["schoolId", "status"]),

  // Teachers
  teachers: defineTable({
    userId: v.id("users"), // Reference to user record
    schoolId: v.id("schools"),
    employeeId: v.string(), // Auto-generated: "PJTCH012325"
    qualifications: v.array(v.object({
      degree: v.string(),
      subject: v.string(),
      university: v.string(),
      yearObtained: v.number(),
    })),
    subjectSpecializations: v.array(v.string()), // ["Mathematics", "Physics"]
    yearsOfExperience: v.number(),
    employmentType: v.string(), // "full_time", "part_time", "contract"
    department: v.string(), // "Science", "Arts", "Languages", etc.
    dateOfJoining: v.number(),
    salary: v.optional(v.number()),
    emergencyContact: v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    }),
    documents: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      uploadedAt: v.number(),
    }))),
    bio: v.optional(v.string()),
    status: v.string(), // "active", "on_leave", "resigned"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_user", ["userId"])
    .index("by_employee_id", ["schoolId", "employeeId"])
    .index("by_department", ["schoolId", "department"])
    .index("by_status", ["schoolId", "status"])
    .index("by_employment_type", ["schoolId", "employmentType"]),

  // Subjects
  subjects: defineTable({
    schoolId: v.id("schools"),
    subjectCode: v.string(), // Auto-generated: 2 initials + 4 random digits (e.g., "MA1234")
    name: v.string(), // e.g., "Mathematics"
    department: v.string(), // "Creche", "Kindergarten", "Primary", "Junior High"
    description: v.optional(v.string()),
    colorCode: v.string(), // Hex color code for department
    classIds: v.optional(v.array(v.id("classes"))), // Bulk assign to classes
    teacherIds: v.optional(v.array(v.id("users"))), // Bulk assign to teachers
    credits: v.optional(v.number()),
    isCore: v.boolean(), // Core subject or elective
    status: v.string(), // "active", "inactive"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_subject_code", ["schoolId", "subjectCode"])
    .index("by_department", ["schoolId", "department"])
    .index("by_status", ["schoolId", "status"])
    .index("by_created_at", ["schoolId", "createdAt"]),

  // Subscription Plans
  subscriptionPlans: defineTable({
    name: v.string(), // "free", "basic", "premium", "enterprise"
    displayName: v.string(), // "Free Plan", "Basic Plan", etc.
    description: v.string(), // Plan description
    price: v.number(), // Monthly price in GHS
    currency: v.string(), // "GHS" (Ghanaian Cedi)
    billingPeriod: v.string(), // "monthly", "yearly"
    features: v.array(v.string()), // List of features
    maxUsers: v.optional(v.number()), // null for unlimited
    maxStudents: v.optional(v.number()), // null for unlimited
    maxClasses: v.optional(v.number()), // null for unlimited
    isActive: v.boolean(),
    isPopular: v.optional(v.boolean()), // Highlight as popular plan
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  // Subscriptions (Manual Management)
  subscriptions: defineTable({
    schoolId: v.id("schools"),
    planId: v.id("subscriptionPlans"),
    status: v.string(), // "active", "inactive", "expired", "trialing"
    startDate: v.number(),
    endDate: v.number(),
    autoRenew: v.boolean(), // For future automation
    notes: v.optional(v.string()), // Admin notes about subscription
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"), // Super admin who created it
    updatedBy: v.optional(v.id("users")), // Last super admin who updated it
  })
    .index("by_school", ["schoolId"])
    .index("by_plan", ["planId"])
    .index("by_status", ["status"])
    .index("by_end_date", ["endDate"]),

  // Payments (Manual Tracking)
  payments: defineTable({
    schoolId: v.id("schools"),
    subscriptionId: v.id("subscriptions"),
    amount: v.number(), // Amount in GHS
    currency: v.string(), // "GHS"
    paymentMethod: v.string(), // "cash", "bank_transfer", "mobile_money"
    paymentStatus: v.string(), // "paid", "pending", "overdue"
    paymentDate: v.optional(v.number()), // When payment was received
    dueDate: v.number(), // When payment is due
    reference: v.optional(v.string()), // Payment reference/receipt number
    notes: v.optional(v.string()), // Admin notes about payment
    receiptUrl: v.optional(v.string()), // Optional receipt document
    recordedBy: v.id("users"), // Super admin who recorded the payment
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_status", ["paymentStatus"])
    .index("by_payment_date", ["paymentDate"])
    .index("by_due_date", ["dueDate"]),
});
