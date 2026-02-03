import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// Generate unique codes
function generateCode(prefix: string): string {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${randomDigits}`;
}

// Get all conversations for a teacher
export const getTeacherConversations = query({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get conversations where teacher is participant1 or participant2
    const asParticipant1 = await ctx.db
      .query('conversations')
      .withIndex('by_participant1', (q) =>
        q.eq('schoolId', args.schoolId).eq('participant1Id', args.teacherId)
      )
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const asParticipant2 = await ctx.db
      .query('conversations')
      .withIndex('by_participant2', (q) =>
        q.eq('schoolId', args.schoolId).eq('participant2Id', args.teacherId)
      )
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // Combine and dedupe
    const allConversations = [...asParticipant1, ...asParticipant2];
    const uniqueConversations = Array.from(
      new Map(allConversations.map((c) => [c._id, c])).values()
    );

    // Add unread count and other party info for each conversation
    return uniqueConversations
      .map((conv) => {
        const isParticipant1 = conv.participant1Id === args.teacherId;
        const otherParty = isParticipant1
          ? { id: conv.participant2Id, name: conv.participant2Name, role: conv.participant2Role }
          : { id: conv.participant1Id, name: conv.participant1Name, role: conv.participant1Role };
        const unreadCount = isParticipant1 ? conv.unreadCount1 : conv.unreadCount2;

        return {
          ...conv,
          otherParty,
          unreadCount,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  },
});

// Get messages in a conversation
export const getConversationMessages = query({
  args: {
    conversationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('desc')
      .take(args.limit ?? 50);

    return messages.reverse();
  },
});

// Get unread message count for a user
export const getUnreadCount = query({
  args: {
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_read', (q) =>
        q.eq('recipientId', args.recipientId).eq('isRead', false)
      )
      .collect();

    return unreadMessages.length;
  },
});

// Start a new conversation
export const startConversation = mutation({
  args: {
    schoolId: v.string(),
    teacherId: v.string(),
    teacherName: v.string(),
    parentId: v.string(),
    parentName: v.string(),
    parentEmail: v.optional(v.string()),
    studentId: v.optional(v.string()),
    studentName: v.optional(v.string()),
    subject: v.string(),
    content: v.string(),
    messageType: v.union(
      v.literal('general'),
      v.literal('academic'),
      v.literal('behavior'),
      v.literal('attendance'),
      v.literal('fee'),
      v.literal('urgent')
    ),
    priority: v.optional(v.union(v.literal('low'), v.literal('normal'), v.literal('high'))),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const conversationCode = generateCode('CONV');
    const messageCode = generateCode('MSG');

    // Create conversation
    const conversationId = await ctx.db.insert('conversations', {
      schoolId: args.schoolId,
      conversationCode,
      participant1Id: args.teacherId,
      participant1Name: args.teacherName,
      participant1Role: 'teacher',
      participant2Id: args.parentId,
      participant2Name: args.parentName,
      participant2Role: 'parent',
      studentId: args.studentId,
      studentName: args.studentName,
      lastMessageAt: now,
      lastMessagePreview: args.content.slice(0, 100),
      unreadCount1: 0,
      unreadCount2: 1, // Parent has 1 unread
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Create message
    const messageId = await ctx.db.insert('messages', {
      schoolId: args.schoolId,
      messageCode,
      conversationId: conversationId,
      senderId: args.teacherId,
      senderName: args.teacherName,
      senderRole: 'teacher',
      recipientId: args.parentId,
      recipientName: args.parentName,
      recipientRole: 'parent',
      recipientEmail: args.parentEmail,
      studentId: args.studentId,
      studentName: args.studentName,
      subject: args.subject,
      content: args.content,
      messageType: args.messageType,
      priority: args.priority ?? 'normal',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    return { conversationId, messageId };
  },
});

// Send a message in an existing conversation
export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    senderId: v.string(),
    senderName: v.string(),
    senderRole: v.union(v.literal('teacher'), v.literal('parent')),
    content: v.string(),
    messageType: v.optional(v.union(
      v.literal('general'),
      v.literal('academic'),
      v.literal('behavior'),
      v.literal('attendance'),
      v.literal('fee'),
      v.literal('urgent')
    )),
    priority: v.optional(v.union(v.literal('low'), v.literal('normal'), v.literal('high'))),
    replyToId: v.optional(v.id('messages')),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const now = new Date().toISOString();
    const messageCode = generateCode('MSG');

    // Determine recipient
    const isParticipant1 = conversation.participant1Id === args.senderId;
    const recipientId = isParticipant1 ? conversation.participant2Id : conversation.participant1Id;
    const recipientName = isParticipant1 ? conversation.participant2Name : conversation.participant1Name;
    const recipientRole = isParticipant1 ? conversation.participant2Role : conversation.participant1Role;

    // Create message
    const messageId = await ctx.db.insert('messages', {
      schoolId: conversation.schoolId,
      messageCode,
      conversationId: args.conversationId,
      senderId: args.senderId,
      senderName: args.senderName,
      senderRole: args.senderRole,
      recipientId,
      recipientName,
      recipientRole,
      studentId: conversation.studentId,
      studentName: conversation.studentName,
      subject: '', // Reply doesn't need subject
      content: args.content,
      messageType: args.messageType ?? 'general',
      priority: args.priority ?? 'normal',
      isRead: false,
      replyToId: args.replyToId,
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation
    const updateData: {
      lastMessageAt: string;
      lastMessagePreview: string;
      updatedAt: string;
      unreadCount1?: number;
      unreadCount2?: number;
    } = {
      lastMessageAt: now,
      lastMessagePreview: args.content.slice(0, 100),
      updatedAt: now,
    };

    // Increment unread count for the recipient
    if (isParticipant1) {
      updateData.unreadCount2 = (conversation.unreadCount2 ?? 0) + 1;
    } else {
      updateData.unreadCount1 = (conversation.unreadCount1 ?? 0) + 1;
    }

    await ctx.db.patch(args.conversationId, updateData);

    return messageId;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id('conversations'),
    readerId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const now = new Date().toISOString();

    // Get all unread messages for this reader
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) =>
        q.and(
          q.eq(q.field('recipientId'), args.readerId),
          q.eq(q.field('isRead'), false)
        )
      )
      .collect();

    // Mark each message as read
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        isRead: true,
        readAt: now,
        updatedAt: now,
      });
    }

    // Reset unread count in conversation
    const isParticipant1 = conversation.participant1Id === args.readerId;
    if (isParticipant1) {
      await ctx.db.patch(args.conversationId, { unreadCount1: 0, updatedAt: now });
    } else {
      await ctx.db.patch(args.conversationId, { unreadCount2: 0, updatedAt: now });
    }

    return { markedCount: unreadMessages.length };
  },
});

// Get parents for a class (for teacher to start conversations)
export const getParentsForClass = query({
  args: {
    schoolId: v.string(),
    classId: v.string(),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query('students')
      .withIndex('by_class', (q) => q.eq('classId', args.classId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'continuing'),
          q.eq(q.field('status'), 'fresher')
        )
      )
      .collect();

    // Extract parent info with student reference
    return students.map((student) => ({
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      parentId: `parent_${student._id}`, // Use student ID as parent identifier
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      relationship: student.relationship,
    }));
  },
});

// Archive a conversation
export const archiveConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Get conversation by ID
export const getConversationById = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});
