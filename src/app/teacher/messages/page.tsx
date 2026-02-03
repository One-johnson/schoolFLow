'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  ArrowLeft,
  User,
  Clock,
  CheckCheck,
  AlertCircle,
  BookOpen,
  UserCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

type MessageType = 'general' | 'academic' | 'behavior' | 'attendance' | 'fee' | 'urgent';
type Priority = 'low' | 'normal' | 'high';

interface Conversation {
  _id: Id<'conversations'>;
  conversationCode: string;
  studentName?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  otherParty: {
    id: string;
    name: string;
    role: 'teacher' | 'parent';
  };
  unreadCount: number;
}

interface Message {
  _id: Id<'messages'>;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent';
  content: string;
  messageType: MessageType;
  priority: Priority;
  isRead: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { teacher } = useTeacherAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageData, setNewMessageData] = useState({
    parentId: '',
    parentName: '',
    parentEmail: '',
    studentId: '',
    studentName: '',
    subject: '',
    content: '',
    messageType: 'general' as MessageType,
    priority: 'normal' as Priority,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const conversations = useQuery(
    api.messages.getTeacherConversations,
    teacher ? { schoolId: teacher.schoolId, teacherId: teacher.id } : 'skip'
  );

  const messages = useQuery(
    api.messages.getConversationMessages,
    selectedConversation ? { conversationId: selectedConversation._id } : 'skip'
  );

  const classId = teacher?.classIds?.[0];
  const parents = useQuery(
    api.messages.getParentsForClass,
    teacher && classId ? { schoolId: teacher.schoolId, classId } : 'skip'
  );

  const unreadCount = useQuery(
    api.messages.getUnreadCount,
    teacher ? { recipientId: teacher.id } : 'skip'
  );

  // Mutations
  const startConversation = useMutation(api.messages.startConversation);
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && teacher && selectedConversation.unreadCount > 0) {
      markAsRead({
        conversationId: selectedConversation._id,
        readerId: teacher.id,
      });
    }
  }, [selectedConversation, teacher, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !teacher) return;

    try {
      await sendMessage({
        conversationId: selectedConversation._id,
        senderId: teacher.id,
        senderName: `${teacher.firstName} ${teacher.lastName}`,
        senderRole: 'teacher',
        content: messageInput.trim(),
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartNewConversation = async () => {
    if (!teacher || !newMessageData.parentId || !newMessageData.subject || !newMessageData.content) return;

    try {
      const result = await startConversation({
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        parentId: newMessageData.parentId,
        parentName: newMessageData.parentName,
        parentEmail: newMessageData.parentEmail || undefined,
        studentId: newMessageData.studentId || undefined,
        studentName: newMessageData.studentName || undefined,
        subject: newMessageData.subject,
        content: newMessageData.content,
        messageType: newMessageData.messageType,
        priority: newMessageData.priority,
      });

      setNewMessageOpen(false);
      setNewMessageData({
        parentId: '',
        parentName: '',
        parentEmail: '',
        studentId: '',
        studentName: '',
        subject: '',
        content: '',
        messageType: 'general',
        priority: 'normal',
      });

      // Select the new conversation
      if (result.conversationId) {
        // Refresh will happen automatically with Convex
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleParentSelect = (parentId: string) => {
    const parent = parents?.find((p) => p.parentId === parentId);
    if (parent) {
      setNewMessageData({
        ...newMessageData,
        parentId: parent.parentId,
        parentName: parent.parentName,
        parentEmail: parent.parentEmail,
        studentId: parent.studentId,
        studentName: parent.studentName,
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageTypeIcon = (type: MessageType) => {
    const icons = {
      general: MessageSquare,
      academic: BookOpen,
      behavior: UserCheck,
      attendance: Calendar,
      fee: DollarSign,
      urgent: AlertTriangle,
    };
    return icons[type] || MessageSquare;
  };

  const getMessageTypeColor = (type: MessageType) => {
    const colors = {
      general: 'bg-gray-100 text-gray-700',
      academic: 'bg-blue-100 text-blue-700',
      behavior: 'bg-purple-100 text-purple-700',
      attendance: 'bg-green-100 text-green-700',
      fee: 'bg-amber-100 text-amber-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[type] || colors.general;
  };

  const filteredConversations = conversations?.filter((conv) =>
    conv.otherParty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!teacher) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Communicate with parents
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        <Sheet open={newMessageOpen} onOpenChange={setNewMessageOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>New Message</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Select Parent</label>
                <Select onValueChange={handleParentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a parent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parents?.map((parent) => (
                      <SelectItem key={parent.parentId} value={parent.parentId}>
                        <div className="flex items-center gap-2">
                          <span>{parent.parentName}</span>
                          <span className="text-muted-foreground text-xs">
                            ({parent.studentName})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newMessageData.parentId && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p>
                    <strong>Parent:</strong> {newMessageData.parentName}
                  </p>
                  <p>
                    <strong>Student:</strong> {newMessageData.studentName}
                  </p>
                  {newMessageData.parentEmail && (
                    <p>
                      <strong>Email:</strong> {newMessageData.parentEmail}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select
                  value={newMessageData.messageType}
                  onValueChange={(value) =>
                    setNewMessageData({ ...newMessageData, messageType: value as MessageType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="fee">Fee Related</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newMessageData.priority}
                  onValueChange={(value) =>
                    setNewMessageData({ ...newMessageData, priority: value as Priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Enter message subject..."
                  value={newMessageData.subject}
                  onChange={(e) =>
                    setNewMessageData({ ...newMessageData, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  rows={5}
                  value={newMessageData.content}
                  onChange={(e) =>
                    setNewMessageData({ ...newMessageData, content: e.target.value })
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={handleStartNewConversation}
                disabled={
                  !newMessageData.parentId ||
                  !newMessageData.subject ||
                  !newMessageData.content
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <Card className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96`}>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {!conversations ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredConversations?.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a new message to begin
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations?.map((conv) => (
                    <button
                      key={conv._id}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?._id === conv._id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.otherParty.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {conv.otherParty.name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          {conv.studentName && (
                            <p className="text-xs text-muted-foreground">
                              Re: {conv.studentName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conv.lastMessagePreview}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedConversation.otherParty.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {selectedConversation.otherParty.name}
                    </CardTitle>
                    {selectedConversation.studentName && (
                      <p className="text-xs text-muted-foreground">
                        Parent of {selectedConversation.studentName}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  {!messages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-3/4" />
                      <Skeleton className="h-16 w-3/4 ml-auto" />
                      <Skeleton className="h-16 w-3/4" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message: Message) => {
                        const isOwn = message.senderId === teacher.id;
                        const TypeIcon = getMessageTypeIcon(message.messageType);

                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <TypeIcon className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {message.senderName}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-2">
                                <span className="text-xs opacity-70">
                                  {formatTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <CheckCheck
                                    className={`h-3 w-3 ${
                                      message.isRead ? 'text-blue-400' : 'opacity-70'
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
