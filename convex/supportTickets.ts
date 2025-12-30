import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all support tickets (Super Admin)
export const getAllTickets = query({
  args: {
    status: v.optional(v.union(
      v.literal('open'),
      v.literal('in_progress'),
      v.literal('waiting_customer'),
      v.literal('resolved'),
      v.literal('closed')
    )),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    )),
  },
  handler: async (ctx, args) => {
    let tickets = await ctx.db.query('supportTickets').order('desc').collect();
    
    // Apply filters if provided
    if (args.status) {
      tickets = tickets.filter((t) => t.status === args.status);
    }
    if (args.priority) {
      tickets = tickets.filter((t) => t.priority === args.priority);
    }
    
    return tickets;
  },
});

// Get tickets by requester (School Admin)
export const getTicketsByRequester = query({
  args: {
    requesterId: v.string(),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query('supportTickets')
      .withIndex('by_requester', (q) => q.eq('requesterId', args.requesterId))
      .order('desc')
      .collect();
    
    return tickets;
  },
});

// Get single ticket with messages
export const getTicketById = query({
  args: {
    ticketId: v.id('supportTickets'),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;
    
    const messages = await ctx.db
      .query('supportTicketMessages')
      .withIndex('by_ticket', (q) => q.eq('ticketId', args.ticketId))
      .order('asc')
      .collect();
    
    const attachments = await ctx.db
      .query('supportTicketAttachments')
      .withIndex('by_ticket', (q) => q.eq('ticketId', args.ticketId))
      .collect();
    
    return {
      ticket,
      messages,
      attachments,
    };
  },
});

// Get ticket statistics (Super Admin)
export const getTicketStats = query({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db.query('supportTickets').collect();
    
    const openTickets = allTickets.filter((t) => t.status === 'open').length;
    const inProgressTickets = allTickets.filter((t) => t.status === 'in_progress').length;
    const waitingCustomerTickets = allTickets.filter((t) => t.status === 'waiting_customer').length;
    const resolvedTickets = allTickets.filter((t) => t.status === 'resolved').length;
    const highPriorityTickets = allTickets.filter((t) => t.priority === 'high' || t.priority === 'urgent').length;
    const unassignedTickets = allTickets.filter((t) => !t.assignedToId).length;
    
    return {
      total: allTickets.length,
      open: openTickets,
      inProgress: inProgressTickets,
      waitingCustomer: waitingCustomerTickets,
      resolved: resolvedTickets,
      highPriority: highPriorityTickets,
      unassigned: unassignedTickets,
    };
  },
});

// Get unassigned tickets (Super Admin)
export const getUnassignedTickets = query({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query('supportTickets').order('desc').collect();
    return tickets.filter((t) => !t.assignedToId && t.status !== 'closed');
  },
});

// Create new support ticket (School Admin)
export const createTicket = mutation({
  args: {
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
    requesterId: v.string(),
    requesterName: v.string(),
    requesterEmail: v.string(),
    schoolId: v.optional(v.string()),
    schoolName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the count of existing tickets to generate ticket number
    const existingTickets = await ctx.db.query('supportTickets').collect();
    const ticketNumber = `TKT-${String(existingTickets.length + 1).padStart(4, '0')}`;
    
    const now = new Date().toISOString();
    
    const ticketId = await ctx.db.insert('supportTickets', {
      ticketNumber,
      subject: args.subject,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: 'open',
      requesterId: args.requesterId,
      requesterName: args.requesterName,
      requesterEmail: args.requesterEmail,
      schoolId: args.schoolId,
      schoolName: args.schoolName,
      createdAt: now,
      updatedAt: now,
      responseCount: 0,
      attachmentCount: 0,
    });
    
    // Create initial message
    await ctx.db.insert('supportTicketMessages', {
      ticketId: ticketId,
      senderId: args.requesterId,
      senderName: args.requesterName,
      senderRole: 'school_admin',
      message: args.description,
      isInternal: false,
      createdAt: now,
    });
    
    // Create notification for all Super Admins
    const superAdmins = await ctx.db.query('superAdmins').collect();
    
    for (const admin of superAdmins) {
      await ctx.db.insert('notifications', {
        title: 'New Support Ticket',
        message: `${args.requesterName} submitted a new ${args.priority} priority ticket: ${args.subject}`,
        type: 'info',
        timestamp: now,
        read: false,
        actionUrl: '/super-admin/support',
        recipientId: admin._id,
        recipientRole: 'super_admin',
      });
    }
    
    return ticketId;
  },
});

// Update ticket status (Super Admin)
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    status: v.union(
      v.literal('open'),
      v.literal('in_progress'),
      v.literal('waiting_customer'),
      v.literal('resolved'),
      v.literal('closed')
    ),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };
    
    if (args.status === 'resolved') {
      updates.resolvedAt = now;
    }
    if (args.status === 'closed') {
      updates.closedAt = now;
    }
    
    await ctx.db.patch(args.ticketId, updates);
    
    // Notify the requester
    await ctx.db.insert('notifications', {
      title: 'Ticket Status Updated',
      message: `Your ticket ${ticket.ticketNumber} status has been changed to ${args.status.replace('_', ' ')}`,
      type: 'info',
      timestamp: now,
      read: false,
      actionUrl: '/school-admin/support',
      recipientId: ticket.requesterId,
      recipientRole: 'school_admin',
    });
    
    return args.ticketId;
  },
});

// Update ticket priority (Super Admin)
export const updateTicketPriority = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      priority: args.priority,
      updatedAt: new Date().toISOString(),
    });
    
    return args.ticketId;
  },
});

// Assign ticket to Super Admin
export const assignTicket = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    adminId: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.ticketId, {
      assignedToId: args.adminId,
      assignedToName: args.adminName,
      assignedAt: now,
      updatedAt: now,
      status: 'in_progress',
    });
    
    return args.ticketId;
  },
});

// Add message to ticket
export const addMessage = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    senderId: v.string(),
    senderName: v.string(),
    senderRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
    message: v.string(),
    isInternal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const now = new Date().toISOString();
    
    const messageId = await ctx.db.insert('supportTicketMessages', {
      ticketId: args.ticketId,
      senderId: args.senderId,
      senderName: args.senderName,
      senderRole: args.senderRole,
      message: args.message,
      isInternal: args.isInternal,
      createdAt: now,
    });
    
    // Update ticket
    await ctx.db.patch(args.ticketId, {
      lastResponseBy: args.senderRole === 'super_admin' ? 'admin' : 'customer',
      lastResponseAt: now,
      responseCount: ticket.responseCount + 1,
      updatedAt: now,
    });
    
    // Send notification to the other party (unless internal note)
    if (!args.isInternal) {
      const recipientId = args.senderRole === 'super_admin' ? ticket.requesterId : ticket.assignedToId;
      const recipientRole = args.senderRole === 'super_admin' ? 'school_admin' : 'super_admin';
      
      if (recipientId) {
        await ctx.db.insert('notifications', {
          title: 'New Ticket Response',
          message: `${args.senderName} replied to ticket ${ticket.ticketNumber}`,
          type: 'info',
          timestamp: now,
          read: false,
          actionUrl: args.senderRole === 'super_admin' ? '/school-admin/support' : '/super-admin/support',
          recipientId: recipientId,
          recipientRole: recipientRole,
        });
      }
    }
    
    return messageId;
  },
});

// Add internal note (Super Admin only)
export const addInternalNote = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    adminId: v.string(),
    adminName: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const messageId = await ctx.db.insert('supportTicketMessages', {
      ticketId: args.ticketId,
      senderId: args.adminId,
      senderName: args.adminName,
      senderRole: 'super_admin',
      message: args.note,
      isInternal: true,
      createdAt: now,
    });
    
    return messageId;
  },
});

// Close ticket (Super Admin)
export const closeTicket = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.ticketId, {
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    });
    
    // Notify the requester
    await ctx.db.insert('notifications', {
      title: 'Ticket Closed',
      message: `Your ticket ${ticket.ticketNumber} has been closed`,
      type: 'info',
      timestamp: now,
      read: false,
      actionUrl: '/school-admin/support',
      recipientId: ticket.requesterId,
      recipientRole: 'school_admin',
    });
    
    return args.ticketId;
  },
});

// Reopen ticket
export const reopenTicket = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    userId: v.string(),
    userRole: v.union(v.literal('super_admin'), v.literal('school_admin')),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.ticketId, {
      status: 'open',
      updatedAt: now,
    });
    
    // Notify the relevant party
    if (args.userRole === 'school_admin') {
      // Notify Super Admins
      const superAdmins = await ctx.db.query('superAdmins').collect();
      for (const admin of superAdmins) {
        await ctx.db.insert('notifications', {
          title: 'Ticket Reopened',
          message: `Ticket ${ticket.ticketNumber} has been reopened by ${ticket.requesterName}`,
          type: 'warning',
          timestamp: now,
          read: false,
          actionUrl: '/super-admin/support',
          recipientId: admin._id,
          recipientRole: 'super_admin',
        });
      }
    } else {
      // Notify the requester
      await ctx.db.insert('notifications', {
        title: 'Ticket Reopened',
        message: `Your ticket ${ticket.ticketNumber} has been reopened`,
        type: 'info',
        timestamp: now,
        read: false,
        actionUrl: '/school-admin/support',
        recipientId: ticket.requesterId,
        recipientRole: 'school_admin',
      });
    }
    
    return args.ticketId;
  },
});

// Add attachment to ticket
export const addAttachment = mutation({
  args: {
    ticketId: v.id('supportTickets'),
    messageId: v.optional(v.id('supportTicketMessages')),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    uploadedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const now = new Date().toISOString();
    
    const attachmentId = await ctx.db.insert('supportTicketAttachments', {
      ticketId: args.ticketId,
      messageId: args.messageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      uploadedBy: args.uploadedBy,
      uploadedAt: now,
    });
    
    // Update ticket attachment count
    await ctx.db.patch(args.ticketId, {
      attachmentCount: ticket.attachmentCount + 1,
      updatedAt: now,
    });
    
    return attachmentId;
  },
});
