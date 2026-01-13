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
});
