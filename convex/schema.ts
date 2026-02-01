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
    schoolId: v.string(), // Custom school ID like "SCHQATU3SBB"
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
    department: v.union(v.literal('creche'), v.literal('kindergarten'), v.literal('primary'), v.literal('junior_high')),
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
    color: v.optional(v.string()), // Hex color code for visual identification (e.g., #3b82f6)
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

  students: defineTable({
    // School Association
    schoolId: v.string(),
    
    // Auto-generated IDs
    studentId: v.string(), // e.g., "JD123456" (initials + 6 digits)
    admissionNumber: v.string(), // e.g., "ADM2024001"
    
    // Authentication
    password: v.string(), // Default: studentId (can be changed later)
    
    // Personal Information
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    nationality: v.optional(v.string()),
    religion: v.optional(v.string()),
    
    // Contact Information
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.string(),
    
    // Academic Information
    classId: v.string(), // References classes table
    className: v.string(), // Denormalized for easy access
    department: v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    ),
    rollNumber: v.optional(v.string()),
    admissionDate: v.string(),
    
    // Parent/Guardian Information
    parentName: v.string(),
    parentEmail: v.string(),
    parentPhone: v.string(),
    parentOccupation: v.optional(v.string()),
    relationship: v.union(v.literal('father'), v.literal('mother'), v.literal('guardian')),
    
    // Secondary Contact (Optional)
    secondaryContactName: v.optional(v.string()),
    secondaryContactPhone: v.optional(v.string()),
    secondaryContactRelationship: v.optional(v.string()),
    
    // Emergency Contact
    emergencyContactName: v.string(),
    emergencyContactPhone: v.string(),
    emergencyContactRelationship: v.string(),
    
    // Medical Information (Optional)
    medicalConditions: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    
    // Documents & Photo - Storage IDs only
    photoStorageId: v.optional(v.string()),
    birthCertificateStorageId: v.optional(v.string()),
    
    // Status & Metadata
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('fresher'),
      v.literal('continuing'),
      v.literal('transferred'),
      v.literal('graduated')
    ),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_student_id', ['studentId'])
    .index('by_admission_number', ['admissionNumber'])
    .index('by_class', ['classId'])
    .index('by_status', ['status'])
    .index('by_department', ['department'])
    .index('by_email', ['email']),

  photos: defineTable({
    // Convex storage reference
    storageId: v.string(), // Reference to Convex storage
    
    // File metadata
    fileName: v.string(),
    fileSize: v.number(), // Size in bytes
    mimeType: v.string(), // e.g., 'image/jpeg', 'application/pdf'
    
    // Association
    entityType: v.union(
      v.literal('student'),
      v.literal('teacher'),
      v.literal('school'),
      v.literal('support_ticket')
    ),
    entityId: v.string(), // ID of the associated entity
    fileType: v.union(
      v.literal('photo'),
      v.literal('document'),
      v.literal('certificate'),
      v.literal('attachment')
    ),
    
    // Upload tracking
    uploadedBy: v.string(), // User ID who uploaded
    uploadedAt: v.string(),
    schoolId: v.optional(v.string()), // For multi-tenant tracking
    
    // Soft delete
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.string()),
  })
    .index('by_entity', ['entityType', 'entityId'])
    .index('by_storage', ['storageId'])
    .index('by_school', ['schoolId'])
    .index('by_uploader', ['uploadedBy'])
    .index('by_deleted', ['isDeleted']),

  academicYears: defineTable({
    schoolId: v.string(),
    yearCode: v.string(), // Auto-generated: AY + 6 random digits (e.g., AY123456)
    yearName: v.string(), // e.g., "2024/2025", "2025/2026"
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('upcoming'),
      v.literal('completed'),
      v.literal('archived')
    ),
    isCurrentYear: v.boolean(), // Only one year can be current per school
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_year_code', ['yearCode'])
    .index('by_status', ['status'])
    .index('by_current', ['schoolId', 'isCurrentYear']),

  terms: defineTable({
    schoolId: v.string(),
    academicYearId: v.id('academicYears'), // References academic year
    termCode: v.string(), // Auto-generated: TRM + 6 random digits
    termName: v.string(), // e.g., "Term 1", "Semester 1", "First Term"
    termNumber: v.number(), // 1, 2, 3
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('upcoming'),
      v.literal('completed')
    ),
    isCurrentTerm: v.boolean(), // Only one term can be current per school
    holidayStart: v.optional(v.string()),
    holidayEnd: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_academic_year', ['academicYearId'])
    .index('by_term_code', ['termCode'])
    .index('by_status', ['status'])
    .index('by_current', ['schoolId', 'isCurrentTerm']),

  timetables: defineTable({
    schoolId: v.string(),
    classId: v.string(), // References classes table
    className: v.string(), // Denormalized for easy access
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_status', ['status']),

  periods: defineTable({
    timetableId: v.id('timetables'), // References timetables table
    day: v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday')
    ),
    periodName: v.string(), // e.g., "Period 1", "Break Time", "Assembly"
    startTime: v.string(), // e.g., "08:00"
    endTime: v.string(), // e.g., "09:10"
    periodType: v.union(v.literal('class'), v.literal('break')), // class period or break
    duration: v.number(), // Duration in minutes
    createdAt: v.string(),
  })
    .index('by_timetable', ['timetableId'])
    .index('by_timetable_day', ['timetableId', 'day']),

  timetableAssignments: defineTable({
    timetableId: v.id('timetables'),
    periodId: v.id('periods'),
    teacherId: v.string(), // References teachers table
    teacherName: v.string(), // Denormalized
    subjectId: v.string(), // References subjects table
    subjectName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(),
    schoolId: v.string(),
    day: v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday')
    ),
    startTime: v.string(),
    endTime: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_timetable', ['timetableId'])
    .index('by_period', ['periodId'])
    .index('by_teacher', ['schoolId', 'teacherId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_subject', ['schoolId', 'subjectId'])
    .index('by_school', ['schoolId']),

  timetableTemplates: defineTable({
    schoolId: v.string(),
    templateName: v.string(),
    description: v.optional(v.string()),
    periodStructure: v.string(), // JSON stringified array of period definitions
    createdBy: v.string(), // School Admin ID
    createdAt: v.string(),
    isDefault: v.boolean(), // System default templates
    status: v.union(v.literal('active'), v.literal('archived')),
  })
    .index('by_school', ['schoolId'])
    .index('by_status', ['status']),

  feeCategories: defineTable({
    schoolId: v.string(),
    categoryCode: v.string(), // Auto-generated: FEE + 6 random digits
    categoryName: v.string(), // e.g., "Tuition", "Transport", "Library"
    description: v.optional(v.string()),
    isOptional: v.boolean(), // true = optional fee, false = mandatory
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_category_code', ['categoryCode'])
    .index('by_status', ['status']),

  feeStructures: defineTable({
    schoolId: v.string(),
    structureCode: v.string(), // Auto-generated: FS + 6 random digits
    structureName: v.string(), // e.g., "Grade 1 Fees", "Form 3 Fees"
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    classId: v.optional(v.string()), // If specific to a class
    department: v.optional(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    )),
    fees: v.string(), // JSON array of { categoryId, categoryName, amount }
    totalAmount: v.number(), // Sum of all fees
    dueDate: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_structure_code', ['structureCode'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_department', ['schoolId', 'department'])
    .index('by_status', ['status']),

  feePayments: defineTable({
    schoolId: v.string(),
    paymentId: v.string(), // Auto-generated: PAY + 8 random digits
    receiptNumber: v.string(), // Auto-generated: RCP + 8 random digits
    studentId: v.string(), // References students table
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(), // Denormalized
    feeStructureId: v.optional(v.string()), // References feeStructures table
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    // Version 1 (Single category - backward compatible)
    categoryId: v.optional(v.string()), // References feeCategories table
    categoryName: v.optional(v.string()), // Denormalized
    amountDue: v.optional(v.number()),
    amountPaid: v.optional(v.number()),
    // Version 2 (Multi-category)
    version: v.optional(v.number()), // 1 = single category, 2 = multi-category
    items: v.optional(v.string()), // JSON array of {categoryId, categoryName, amountDue, amountPaid}
    totalAmountDue: v.optional(v.number()), // Sum of all items
    totalAmountPaid: v.optional(v.number()), // Sum of all payments
    totalBalance: v.optional(v.number()), // totalDue - totalPaid
    // Common fields
    paymentMethod: v.union(
      v.literal('cash'),
      v.literal('bank_transfer'),
      v.literal('mobile_money'),
      v.literal('check'),
      v.literal('other')
    ),
    transactionReference: v.optional(v.string()),
    paymentDate: v.string(),
    paymentStatus: v.union(
      v.literal('paid'),
      v.literal('partial'),
      v.literal('pending')
    ),
    remainingBalance: v.number(), // For backward compatibility
    notes: v.optional(v.string()),
    paidBy: v.optional(v.string()), // Name of person who paid (parent/guardian)
    collectedBy: v.string(), // School Admin ID who recorded payment
    collectedByName: v.string(), // Denormalized
    discountId: v.optional(v.string()), // References feeDiscounts table
    discountAmount: v.optional(v.number()), // Discount applied
    installmentPlanId: v.optional(v.string()), // References paymentPlans table
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_school', ['schoolId'])
    .index('by_payment_id', ['paymentId'])
    .index('by_receipt', ['receiptNumber'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_status', ['paymentStatus'])
    .index('by_payment_date', ['paymentDate']),

  feeDiscounts: defineTable({
    schoolId: v.string(),
    discountCode: v.string(), // Auto-generated: DISC + 6 random digits
    discountName: v.string(), // e.g., "Sibling Discount", "Merit Scholarship"
    description: v.optional(v.string()),
    discountType: v.union(v.literal('percentage'), v.literal('fixed')),
    discountValue: v.number(), // Percentage (e.g., 20) or fixed amount (e.g., 500)
    applicableTo: v.union(v.literal('all'), v.literal('specific_categories')),
    categoryIds: v.optional(v.array(v.string())), // If specific categories
    reason: v.union(
      v.literal('scholarship'),
      v.literal('sibling'),
      v.literal('merit'),
      v.literal('need_based'),
      v.literal('other')
    ),
    status: v.union(v.literal('active'), v.literal('inactive')),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_discount_code', ['discountCode'])
    .index('by_status', ['status']),

  paymentPlans: defineTable({
    schoolId: v.string(),
    planCode: v.string(), // Auto-generated: PP + 6 random digits
    studentId: v.string(),
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(),
    categoryId: v.string(),
    categoryName: v.string(),
    totalAmount: v.number(),
    numberOfInstallments: v.number(),
    installmentAmount: v.number(), // totalAmount / numberOfInstallments
    frequency: v.union(v.literal('monthly'), v.literal('quarterly'), v.literal('custom')),
    startDate: v.string(),
    status: v.union(v.literal('active'), v.literal('completed'), v.literal('cancelled')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_plan_code', ['planCode'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_status', ['status']),

  installments: defineTable({
    schoolId: v.string(),
    paymentPlanId: v.id('paymentPlans'),
    installmentNumber: v.number(), // 1, 2, 3, etc.
    amountDue: v.number(),
    amountPaid: v.number(),
    dueDate: v.string(),
    paymentDate: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('paid'), v.literal('overdue')),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_payment_plan', ['paymentPlanId'])
    .index('by_status', ['status'])
    .index('by_due_date', ['dueDate']),

  feeReminders: defineTable({
    schoolId: v.string(),
    studentId: v.string(),
    studentName: v.string(),
    parentEmail: v.string(),
    parentPhone: v.string(),
    categoryName: v.string(),
    amountDue: v.number(),
    reminderType: v.union(v.literal('payment_due'), v.literal('installment_due'), v.literal('overdue')),
    sentDate: v.string(),
    method: v.union(v.literal('notification'), v.literal('email'), v.literal('sms')),
    status: v.union(v.literal('sent'), v.literal('failed')),
    createdAt: v.string(),
  })
    .index('by_school', ['schoolId'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_sent_date', ['sentDate']),

  events: defineTable({
    schoolId: v.string(),
    eventCode: v.string(), // Auto-generated: EVT + 8 random digits
    eventTitle: v.string(),
    eventDescription: v.optional(v.string()),
    eventType: v.union(
      v.literal('holiday'),
      v.literal('exam'),
      v.literal('sports'),
      v.literal('parent_meeting'),
      v.literal('assembly'),
      v.literal('cultural'),
      v.literal('field_trip'),
      v.literal('workshop'),
      v.literal('other')
    ),
    startDate: v.string(), // ISO 8601 date
    endDate: v.string(),
    startTime: v.optional(v.string()), // e.g., "09:00"
    endTime: v.optional(v.string()), // e.g., "15:00"
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    venueType: v.union(v.literal('on_campus'), v.literal('off_campus'), v.literal('virtual')),
    audienceType: v.union(
      v.literal('all_school'),
      v.literal('specific_classes'),
      v.literal('specific_departments'),
      v.literal('staff_only'),
      v.literal('custom')
    ),
    targetClasses: v.optional(v.array(v.string())), // Class IDs
    targetDepartments: v.optional(v.array(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    ))),
    isRecurring: v.boolean(),
    recurrencePattern: v.optional(v.union(
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('monthly'),
      v.literal('termly'),
      v.literal('yearly')
    )),
    recurrenceEndDate: v.optional(v.string()),
    recurrenceDays: v.optional(v.array(v.union(
      v.literal('monday'),
      v.literal('tuesday'),
      v.literal('wednesday'),
      v.literal('thursday'),
      v.literal('friday'),
      v.literal('saturday'),
      v.literal('sunday')
    ))),
    parentEventId: v.optional(v.string()), // For recurring event series
    sendNotification: v.boolean(),
    requiresRSVP: v.boolean(),
    rsvpDeadline: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    color: v.optional(v.string()), // Hex color for calendar
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    status: v.union(
      v.literal('upcoming'),
      v.literal('ongoing'),
      v.literal('completed'),
      v.literal('cancelled')
    ),
    cancellationReason: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
    lastModifiedBy: v.optional(v.string()),
  })
    .index('by_school', ['schoolId'])
    .index('by_event_code', ['eventCode'])
    .index('by_status', ['status'])
    .index('by_date', ['schoolId', 'startDate'])
    .index('by_type', ['schoolId', 'eventType'])
    .index('by_academic_year', ['schoolId', 'academicYearId'])
    .index('by_term', ['schoolId', 'termId']),

  eventRSVPs: defineTable({
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(), // Denormalized
    eventTitle: v.string(), // Denormalized
    respondentType: v.union(v.literal('student'), v.literal('parent'), v.literal('teacher')),
    respondentId: v.string(),
    respondentName: v.string(),
    respondentEmail: v.optional(v.string()),
    rsvpStatus: v.union(
      v.literal('attending'),
      v.literal('not_attending'),
      v.literal('maybe'),
      v.literal('pending')
    ),
    numberOfGuests: v.optional(v.number()),
    notes: v.optional(v.string()),
    respondedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_event', ['eventId'])
    .index('by_respondent', ['schoolId', 'respondentId'])
    .index('by_status', ['eventId', 'rsvpStatus']),

  eventNotifications: defineTable({
    schoolId: v.string(),
    eventId: v.id('events'),
    eventCode: v.string(), // Denormalized
    eventTitle: v.string(), // Denormalized
    recipientType: v.union(v.literal('student'), v.literal('parent'), v.literal('teacher'), v.literal('admin')),
    recipientId: v.string(),
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    notificationType: v.union(
      v.literal('event_created'),
      v.literal('event_updated'),
      v.literal('event_cancelled'),
      v.literal('rsvp_reminder'),
      v.literal('event_reminder')
    ),
    reminderType: v.optional(v.union(
      v.literal('1_day_before'),
      v.literal('3_hours_before'),
      v.literal('1_hour_before'),
      v.literal('start_time')
    )),
    deliveryMethod: v.union(v.literal('in_app'), v.literal('email'), v.literal('sms')),
    deliveryStatus: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed')),
    sentAt: v.optional(v.string()),
    readAt: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_event', ['eventId'])
    .index('by_recipient', ['schoolId', 'recipientId'])
    .index('by_status', ['deliveryStatus'])
    .index('by_sent_date', ['sentAt']),

  announcements: defineTable({
    schoolId: v.string(),
    title: v.string(),
    content: v.string(),
    targetType: v.union(
      v.literal('school'),
      v.literal('class'),
      v.literal('department'),
      v.literal('teachers'),
    ),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('archived')),
    createdBy: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    publishedAt: v.optional(v.string()),
  })
    .index('by_school', ['schoolId'])
    .index('by_school_status', ['schoolId', 'status']),

 exams: defineTable({
    schoolId: v.string(),
    examCode: v.string(), // Auto-generated: EXM + 8 digits
    examName: v.string(), // e.g., "Mid-Term Exam", "Final Exam"
    examType: v.union(
      v.literal('mid_term'),
      v.literal('end_of_term'),
      v.literal('mock'),
      v.literal('quiz'),
      v.literal('assessment'),
      v.literal('final')
    ),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    department: v.optional(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    )),
    targetClasses: v.optional(v.array(v.string())), // Class IDs
    subjects: v.string(), // JSON array of {subjectId, subjectName, maxMarks, date, time}
    totalMarks: v.number(), // Total marks across all subjects
    weightage: v.number(), // Percentage weight (e.g., 40 for class, 60 for exams)
    instructions: v.optional(v.string()),
    status: v.union(
      v.literal('draft'),
      v.literal('scheduled'),
      v.literal('ongoing'),
      v.literal('completed'),
      v.literal('published')
    ),
    // Unlock mechanism for published exams
    unlocked: v.optional(v.boolean()), // Whether exam is temporarily unlocked for corrections
    unlockedBy: v.optional(v.string()), // Admin ID who unlocked
    unlockedByName: v.optional(v.string()), // Admin name
    unlockedAt: v.optional(v.string()), // When it was unlocked
    unlockReason: v.optional(v.string()), // Reason for unlocking
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_exam_code', ['examCode'])
    .index('by_status', ['status'])
    .index('by_academic_year', ['schoolId', 'academicYearId'])
    .index('by_term', ['schoolId', 'termId']),

  studentMarks: defineTable({
    schoolId: v.string(),
    examId: v.id('exams'),
    examCode: v.string(), // Denormalized
    examName: v.string(), // Denormalized
    studentId: v.string(), // References students table
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(), // Denormalized
    subjectId: v.string(),
    subjectName: v.string(), // Denormalized
    classScore: v.number(), // Class work/continuous assessment score
    examScore: v.number(), // Exam score
    totalScore: v.number(), // classScore + examScore
    maxMarks: v.number(),
    percentage: v.number(),
    grade: v.string(), // A+, A, B+, etc. based on grading scale
    gradeNumber: v.number(), // 1-9
    remarks: v.string(), // Excellent, Very Good, etc.
    position: v.optional(v.number()), // Student's position in that subject
    isAbsent: v.boolean(),
    enteredBy: v.string(), // User ID (teacher/admin)
    enteredByRole: v.union(
      v.literal('subject_teacher'),
      v.literal('class_teacher'),
      v.literal('admin')
    ),
    enteredByName: v.string(),
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.string()),
    submissionStatus: v.union(
      v.literal('draft'),
      v.literal('submitted_to_class_teacher'),
      v.literal('verified_by_class_teacher'),
      v.literal('verified_by_admin'),
      v.literal('published')
    ),
    entryReason: v.optional(v.string()), // For admin/class teacher overrides
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_exam', ['examId'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_subject', ['examId', 'subjectId'])
    .index('by_status', ['submissionStatus']),

  gradingScales: defineTable({
    schoolId: v.string(),
    scaleCode: v.string(), // Auto-generated: GRD + 6 digits
    scaleName: v.string(), // e.g., "Primary Grading", "JHS Grading"
    department: v.optional(v.union(
      v.literal('creche'),
      v.literal('kindergarten'),
      v.literal('primary'),
      v.literal('junior_high')
    )),
    grades: v.string(), // JSON: [{grade: 1, minPercent: 80, maxPercent: 100, remark: "Excellent"}]
    isDefault: v.boolean(),
    status: v.union(v.literal('active'), v.literal('inactive')),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // School Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_scale_code', ['scaleCode'])
    .index('by_status', ['status'])
    .index('by_default', ['schoolId', 'isDefault']),

 reportCards: defineTable({
    schoolId: v.string(),
    reportCode: v.string(), // Auto-generated: RPT + 8 digits
    studentId: v.string(), // References students table
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(), // Denormalized
    academicYearId: v.optional(v.string()),
    academicYearName: v.optional(v.string()), // e.g., "2024/2025"
    termId: v.optional(v.string()),
    termName: v.optional(v.string()), // e.g., "2nd Term"
    schoolName: v.optional(v.string()), // Denormalized from schools table
    schoolAddress: v.optional(v.string()), // Denormalized from schools table
    schoolPhone: v.optional(v.string()), // Denormalized from schools table
    year: v.optional(v.string()), // e.g., "2025"
    house: v.optional(v.string()), // Student's house (Jubilee, Ambassadors, etc.)
    subjects: v.string(), // JSON array of subject results
    rawScore: v.number(), // Total possible marks
    totalScore: v.number(), // Total marks obtained
    percentage: v.number(),
    overallGrade: v.string(),
    position: v.optional(v.number()), // Class rank
    totalStudents: v.optional(v.number()),
    attendance: v.optional(v.string()), // JSON: {present: 64, total: 68}
    conduct: v.optional(v.string()), // e.g., "Good", "Needs Improvement"
    attitude: v.optional(v.string()), // e.g., "Confident", "Respectful"
    interest: v.optional(v.string()), // e.g., "Mathematics", "Science"
    classTeacherComment: v.optional(v.string()),
    headmasterComment: v.optional(v.string()),
    classTeacherSign: v.optional(v.string()),
    headmasterSign: v.optional(v.string()),
    promotionStatus: v.optional(v.union(
      v.literal('promoted'),
      v.literal('repeated'),
      v.literal('pending')
    )),
    promotedTo: v.optional(v.string()),
    vacationDate: v.optional(v.string()),
    reopeningDate: v.optional(v.string()),
    termlyPerformance: v.optional(v.string()), // JSON: {term1: 497, term2: 562, term3: null}
    // Grading scale references
    gradingScaleId: v.optional(v.id('gradingScales')),
    gradingScaleName: v.optional(v.string()),
    // Review workflow fields
    reviewedBy: v.optional(v.string()), // Teacher ID who reviewed
    reviewedByName: v.optional(v.string()), // Teacher name
    reviewedAt: v.optional(v.string()), // ISO timestamp
    verifiedByClassTeacher: v.optional(v.boolean()), // Approval flag
    reviewNotes: v.optional(v.string()), // Internal notes
    status: v.union(
      v.literal('draft'),
      v.literal('generated'),
      v.literal('published'),
      v.literal('archived')
    ),
    version: v.number(), // For republish tracking
    previousVersionId: v.optional(v.id('reportCards')),
    generatedAt: v.string(),
    publishedAt: v.optional(v.string()),
    publishedBy: v.optional(v.string()),
    publishedByRole: v.optional(v.union(
      v.literal('class_teacher'),
      v.literal('admin')
    )),
    unpublishedBy: v.optional(v.string()),
    unpublishedAt: v.optional(v.string()),
    unpublishReason: v.optional(v.string()),
    createdBy: v.string(), // School Admin ID
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_school', ['schoolId'])
    .index('by_report_code', ['reportCode'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_status', ['status'])
    .index('by_term', ['schoolId', 'termId']),

  continuousAssessments: defineTable({
    schoolId: v.string(),
    assessmentCode: v.string(), // Auto-generated: ASS + 8 digits
    assessmentName: v.string(), // "Assignment 1", "Project", "Class Test"
    assessmentType: v.union(
      v.literal('class_work'),
      v.literal('homework'),
      v.literal('project'),
      v.literal('quiz'),
      v.literal('practical'),
      v.literal('presentation')
    ),
    subjectId: v.string(),
    subjectName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(), // Denormalized
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    maxMarks: v.number(),
    weightage: v.number(), // Percentage contribution to class score
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('archived')
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.string(), // Teacher/Admin ID
  })
    .index('by_school', ['schoolId'])
    .index('by_assessment_code', ['assessmentCode'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_subject', ['schoolId', 'subjectId'])
    .index('by_status', ['status']),

  assessmentMarks: defineTable({
    schoolId: v.string(),
    assessmentId: v.id('continuousAssessments'),
    assessmentCode: v.string(), // Denormalized
    assessmentName: v.string(), // Denormalized
    studentId: v.string(),
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(),
    marksObtained: v.number(),
    maxMarks: v.number(),
    percentage: v.number(),
    submittedAt: v.optional(v.string()),
    isLate: v.boolean(),
    feedback: v.optional(v.string()),
    enteredBy: v.string(), // Teacher/Admin ID
    enteredByName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_assessment', ['assessmentId'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_class', ['schoolId', 'classId']),

      attendance: defineTable({
    schoolId: v.string(),
    attendanceCode: v.string(), // Auto-generated: ATT + 8 digits
    classId: v.string(),
    className: v.string(), // Denormalized
    date: v.string(), // ISO date (YYYY-MM-DD)
    session: v.union(
      v.literal('morning'),
      v.literal('afternoon'),
      v.literal('full_day')
    ),
    academicYearId: v.optional(v.string()),
    termId: v.optional(v.string()),
    totalStudents: v.number(),
    presentCount: v.number(),
    absentCount: v.number(),
    lateCount: v.number(),
    excusedCount: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('locked')
    ),
    markedBy: v.string(), // Admin ID
    markedByName: v.string(),
    markedAt: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_school', ['schoolId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_date', ['schoolId', 'date'])
    .index('by_status', ['status'])
    .index('by_attendance_code', ['attendanceCode']),

  attendanceRecords: defineTable({
    schoolId: v.string(),
    attendanceId: v.id('attendance'),
    attendanceCode: v.string(), // Denormalized
    studentId: v.string(),
    studentName: v.string(), // Denormalized
    classId: v.string(),
    className: v.string(),
    date: v.string(),
    session: v.union(
      v.literal('morning'),
      v.literal('afternoon'),
      v.literal('full_day')
    ),
    status: v.union(
      v.literal('present'),
      v.literal('absent'),
      v.literal('late'),
      v.literal('excused')
    ),
    arrivalTime: v.optional(v.string()),
    remarks: v.optional(v.string()),
    markedBy: v.string(),
    markedByName: v.string(),
    // Admin override tracking
    overriddenBy: v.optional(v.string()),
    overriddenByName: v.optional(v.string()),
    overriddenAt: v.optional(v.string()),
    overrideReason: v.optional(v.string()),
    previousStatus: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_attendance', ['attendanceId'])
    .index('by_student', ['schoolId', 'studentId'])
    .index('by_class', ['schoolId', 'classId'])
    .index('by_date', ['schoolId', 'date'])
    .index('by_status', ['status']),

  attendanceSettings: defineTable({
    schoolId: v.string(),
    enableMorningSession: v.boolean(),
    enableAfternoonSession: v.boolean(),
    morningStartTime: v.optional(v.string()), // e.g., "08:00"
    morningEndTime: v.optional(v.string()), // e.g., "12:00"
    afternoonStartTime: v.optional(v.string()), // e.g., "13:00"
    afternoonEndTime: v.optional(v.string()), // e.g., "17:00"
    lateThresholdMinutes: v.optional(v.number()), // Minutes after start time
    autoLockAttendance: v.boolean(),
    lockAfterHours: v.optional(v.number()), // Hours after marking
    requireAdminApproval: v.boolean(),
    notifyParentsOnAbsence: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_school', ['schoolId']),
});
