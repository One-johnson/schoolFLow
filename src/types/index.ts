export type SchoolStatus = 'pending_payment' | 'pending_approval' | 'active' | 'suspended';

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student';

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin?: string;
}

export interface SchoolAdmin {
  id: string;
  name: string;
  email: string;
  schoolId: string;
  tempPassword?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  invitedBy: string;
}

export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: SchoolStatus;
  adminId: string;
  adminName: string;
  studentCount: number;
  subscriptionPlan: string;
  monthlyFee: number;
  registrationDate: string;
  approvalDate?: string;
  paymentVerified: boolean;
  paymentDate?: string;
}

export interface Subscription {
  id: string;
  schoolId: string;
  schoolName: string;
  plan: string;
  studentsCount: number;
  pricePerStudent: number;
  totalAmount: number;
  status: 'pending' | 'verified' | 'expired';
  paymentMethod: string;
  paymentDate?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  nextBillingDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  pendingApproval: number;
  totalStudents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeAdmins: number;
  pendingPayments: number;
}

export interface ReportData {
  date: string;
  schools: number;
  revenue: number;
  students: number;
}

export interface SupportRequest {
  id: string;
  schoolName: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  resolvedAt?: string;
}

export interface SupportTicket {
  _id: string;
  _creationTime: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'payment' | 'technical' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  schoolId?: string;
  schoolName?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  lastResponseBy?: 'admin' | 'customer';
  lastResponseAt?: string;
  responseCount: number;
  attachmentCount: number;
}

export interface SupportTicketMessage {
  _id: string;
  _creationTime: number;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'super_admin' | 'school_admin';
  message: string;
  isInternal: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface SupportTicketAttachment {
  _id: string;
  _creationTime: number;
  ticketId: string;
  messageId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageId: string;
  uploadedBy: string;
  uploadedAt: string;
}
