import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
   superAdmins: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('moderator')),
    status: v.union(v.literal('active'), v.literal('suspended')),
    createdAt: v.string(),
    createdBy: v.optional(v.string()),
    lastLogin: v.optional(v.string()),
  }).index('by_email', ['email']).index('by_role', ['role']).index('by_status', ['status']),

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
       schoolId: v.string(),
    adminId: v.string(),
    adminName: v.string(),
    studentCount: v.number(),
    subscriptionPlan: v.string(),
    monthlyFee: v.number(),
    registrationDate: v.string(),
    approvalDate: v.optional(v.string()),
    paymentVerified: v.boolean(),
    paymentDate: v.optional(v.string()),
}).index('by_status', ['status']).index('by_school_id', ['schoolId']),

  schoolAdmins: defineTable({
    name: v.string(),
    email: v.string(),
    schoolId: v.string(),
    password: v.optional(v.string()),
    tempPassword: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('inactive'), v.literal('pending'), v.literal('suspended')),
    createdAt: v.string(),
    invitedBy: v.string(),
    hasActiveSubscription: v.optional(v.boolean()),
    trialStartDate: v.optional(v.string()),
    trialEndDate: v.optional(v.string()),
    hasCreatedSchool: v.optional(v.boolean()),
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

  subscriptionRequests: defineTable({
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    planId: v.string(),
    planName: v.string(),
    studentsCount: v.number(),
    totalAmount: v.number(),
    isTrial: v.boolean(),
    status: v.union(v.literal('pending_payment'), v.literal('pending_approval'), v.literal('approved'), v.literal('rejected'), v.literal('expired')),
    createdAt: v.string(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.string()),
    trialStartDate: v.optional(v.string()),
    trialEndDate: v.optional(v.string()),
  }).index('by_admin', ['schoolAdminId']).index('by_status', ['status']),

  paymentProofs: defineTable({
    subscriptionRequestId: v.string(),
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    paymentMethod: v.union(v.literal('mobile_money'), v.literal('bank_transfer')),
    transactionId: v.string(),
    amount: v.number(),
    paymentDate: v.string(),
    notes: v.optional(v.string()),
    screenshotStorageId: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdAt: v.string(),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
  }).index('by_subscription_request', ['subscriptionRequestId']).index('by_status', ['status']),

  schoolCreationRequests: defineTable({
    schoolAdminId: v.string(),
    schoolAdminEmail: v.string(),
    schoolName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    studentCount: v.number(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdAt: v.string(),
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  }).index('by_admin', ['schoolAdminId']).index('by_status', ['status']),

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
    recipientId: v.optional(v.string()),
    recipientRole: v.optional(v.union(v.literal('super_admin'), v.literal('school_admin'))),
  }).index('by_read', ['read']).index('by_recipient', ['recipientId']),

  subscriptionPlans: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    maxStudents: v.number(),
    billingCycle: v.union(v.literal('monthly'), v.literal('termly')),
    features: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

    platformSettings: defineTable({
    platformName: v.string(),
    supportEmail: v.string(),
    maxSchools: v.number(),
    defaultPricePerStudent: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  userSettings: defineTable({
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    // Notification preferences (both roles)
    emailNotifications: v.optional(v.boolean()),
    // Super Admin specific
    newSchoolRegistration: v.optional(v.boolean()),
    paymentVerification: v.optional(v.boolean()),
    systemAlerts: v.optional(v.boolean()),
    // School Admin specific
    paymentAlerts: v.optional(v.boolean()),
    systemUpdates: v.optional(v.boolean()),
    // Security settings (Super Admin)
    twoFactorAuth: v.optional(v.boolean()),
    sessionTimeout: v.optional(v.number()),
    ipWhitelist: v.optional(v.boolean()),
    // Account settings (School Admin)
    profileVisibility: v.optional(v.boolean()),
    dataSharing: v.optional(v.boolean()),
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_user', ['userId', 'userRole']),

  loginHistory: defineTable({
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    loginTime: v.string(),
    logoutTime: v.optional(v.string()),
    status: v.union(v.literal('success'), v.literal('failed')),
    ipAddress: v.string(),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    deviceType: v.union(v.literal('desktop'), v.literal('mobile'), v.literal('tablet'), v.literal('unknown')),
    failureReason: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  }).index('by_user', ['userId']).index('by_time', ['loginTime']),

  sessions: defineTable({
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    sessionToken: v.string(),
    ipAddress: v.string(),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    deviceType: v.union(v.literal('desktop'), v.literal('mobile'), v.literal('tablet'), v.literal('unknown')),
    createdAt: v.string(),
    expiresAt: v.number(),
    lastActivity: v.string(),
    isActive: v.boolean(),
  }).index('by_user', ['userId']).index('by_token', ['sessionToken']),

  securityAlerts: defineTable({
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    alertType: v.union(
      v.literal('new_device'),
      v.literal('suspicious_location'),
      v.literal('multiple_failed_attempts'),
      v.literal('unusual_activity')
    ),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    message: v.string(),
    timestamp: v.string(),
    acknowledged: v.boolean(),
    ipAddress: v.optional(v.string()),
    device: v.optional(v.string()),
  }).index('by_user', ['userId']).index('by_severity', ['severity']),

supportTickets: defineTable({
    // Ticket Information
    ticketNumber: v.string(),
    subject: v.string(),
    description: v.string(),
    category: v.union(
      v.literal('payment'),
      v.literal('technical'),
      v.literal('account'),
      v.literal('general')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    status: v.union(
      v.literal('open'),
      v.literal('in_progress'),
      v.literal('waiting_customer'),
      v.literal('resolved'),
      v.literal('closed')
    ),
    // Requester Information (School Admin)
    requesterId: v.string(),
    requesterName: v.string(),
    requesterEmail: v.string(),
    schoolId: v.optional(v.string()),
    schoolName: v.optional(v.string()),
    // Assignment (Super Admin)
    assignedToId: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    assignedAt: v.optional(v.string()),
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
    resolvedAt: v.optional(v.string()),
    closedAt: v.optional(v.string()),
    // Metadata
    lastResponseBy: v.optional(v.union(v.literal('admin'), v.literal('customer'))),
    lastResponseAt: v.optional(v.string()),
    responseCount: v.number(),
    attachmentCount: v.number(),
  })
    .index('by_requester', ['requesterId'])
    .index('by_assigned', ['assignedToId'])
    .index('by_status', ['status'])
    .index('by_priority', ['priority'])
    .index('by_school', ['schoolId']),

  supportTicketMessages: defineTable({
    ticketId: v.id('supportTickets'),
    senderId: v.string(),
    senderName: v.string(),
    senderRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    message: v.string(),
    isInternal: v.boolean(),
    createdAt: v.string(),
    editedAt: v.optional(v.string()),
  })
    .index('by_ticket', ['ticketId'])
    .index('by_sender', ['senderId']),

  supportTicketAttachments: defineTable({
    ticketId: v.id('supportTickets'),
    messageId: v.optional(v.id('supportTicketMessages')),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    uploadedBy: v.string(),
    uploadedAt: v.string(),
  })
    .index('by_ticket', ['ticketId'])
    .index('by_message', ['messageId']),

teachers: defineTable({
    schoolId: v.string(),
    teacherId: v.string(), // Auto-generated: teacher initials + 6 random digits
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    qualifications: v.array(v.string()),
    subjects: v.array(v.string()), // Subject names (will be IDs when subjects module is implemented)
    employmentDate: v.string(),
    employmentType: v.union(v.literal('full_time'), v.literal('part_time'), v.literal('contract')),
    salary: v.optional(v.number()),
    status: v.union(v.literal('active'), v.literal('on_leave'), v.literal('inactive')),
    photoStorageId: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_teacher_id', ['teacherId'])
    .index('by_status', ['status'])
    .index('by_email', ['email']),

classes: defineTable({
    schoolId: v.string(),
    classCode: v.string(), // Auto-generated: CLS + 6 random digits
    className: v.string(), // e.g., "Grade 1A", "Form 3B"
    grade: v.string(), // e.g., "1", "2", "Form 1"
    section: v.optional(v.string()), // e.g., "A", "B"
    department: v.union(v.literal("creche"),v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    classTeacherId: v.optional(v.string()), // Teacher ID from teachers table
    capacity: v.optional(v.number()),
    currentStudentCount: v.number(),
    academicYearId: v.optional(v.string()), // Will be implemented when academic year module is added
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_class_code', ['classCode'])
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_teacher', ['classTeacherId']),

subjects: defineTable({
    schoolId: v.string(),
    subjectCode: v.string(), // Auto-generated: department initials + 4 random digits (e.g., CR0234, KG1245)
    subjectName: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal('core'), v.literal('elective'), v.literal('extracurricular')),
    department: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_subject_code', ['subjectCode'])
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_category', ['category']),

});
