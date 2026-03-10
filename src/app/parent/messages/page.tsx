'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParentAuth } from '@/hooks/useParentAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '../../../../convex/_generated/dataModel';

interface Conversation {
  _id: Id<'conversations'>;
  studentName?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  otherParty: { id: string; name: string; role: string };
  unreadCount: number;
}

interface Message {
  _id: Id<'messages'>;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent';
  content: string;
  isRead: boolean;
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export default function ParentMessagesPage() {
  const { parent } = useParentAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<Id<'messages'> | null>(null);
  const [editInput, setEditInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery(
    api.messages.getParentConversations,
    parent
      ? {
          schoolId: parent.schoolId,
          parentId: parent.id,
          studentIds: parent.studentIds ?? [],
        }
      : 'skip'
  );

  const messages = useQuery(
    api.messages.getConversationMessages,
    selectedConversation ? { conversationId: selectedConversation._id } : 'skip'
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && parent && selectedConversation.unreadCount > 0) {
      markAsRead({
        conversationId: selectedConversation._id,
        readerId: parent.id,
      });
    }
  }, [selectedConversation, parent, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !parent) return;

    try {
      await sendMessage({
        conversationId: selectedConversation._id,
        senderId: parent.id,
        senderName: parent.name,
        senderRole: 'parent',
        content: messageInput.trim(),
      });
      setMessageInput('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleStartEditing = (message: Message) => {
    setEditingMessageId(message._id);
    setEditInput(message.content);
  };

  const handleCancelEditing = () => {
    setEditingMessageId(null);
    setEditInput('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editInput.trim() || !parent) return;

    try {
      await editMessage({
        messageId: editingMessageId,
        senderId: parent.id,
        content: editInput.trim(),
      });
      setEditingMessageId(null);
      setEditInput('');
      toast.success('Message updated');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to update message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: Id<'messages'>) => {
    if (!parent) return;
    const confirmDelete = window.confirm('Delete this message for everyone?');
    if (!confirmDelete) return;

    try {
      await deleteMessage({
        messageId,
        senderId: parent.id,
      });
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message. Please try again.');
    }
  };

  if (!parent) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-7 w-7" />
          Messages
        </h1>
        <p className="text-muted-foreground mt-1">Conversations with teachers</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        <Card className="md:col-span-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {conversations === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : conversations.length === 0 ? (
                <p className="p-4 text-muted-foreground text-sm text-center">
                  No conversations yet. Teachers will start conversations with you.
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation?._id === conv._id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium truncate">{conv.otherParty.name}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.studentName && (
                      <p className="text-xs text-muted-foreground truncate">
                        Re: {conv.studentName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessagePreview}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b">
                <p className="font-semibold">{selectedConversation.otherParty.name}</p>
                {selectedConversation.studentName && (
                  <p className="text-sm text-muted-foreground">
                    About: {selectedConversation.studentName}
                  </p>
                )}
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages === undefined ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    messages.map((msg: Message) => {
                      const isOwn = msg.senderRole === 'parent' && parent && msg.senderId === parent.id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{msg.senderName}</p>
                              {isOwn && !msg.isDeleted && (
                                <div className="flex items-center gap-1 text-[10px] opacity-80">
                                  <button
                                    type="button"
                                    className="underline-offset-2 hover:underline"
                                    onClick={() => handleStartEditing(msg)}
                                  >
                                    Edit
                                  </button>
                                  <span>·</span>
                                  <button
                                    type="button"
                                    className="underline-offset-2 hover:underline"
                                    onClick={() => handleDeleteMessage(msg._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {msg.isDeleted ? (
                              <p className="text-xs italic opacity-80">
                                This message was deleted
                              </p>
                            ) : editingMessageId === msg._id ? (
                              <div className="space-y-2 mt-1">
                                <Input
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value)}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    type="button"
                                    className="underline-offset-2 hover:underline"
                                    onClick={handleCancelEditing}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="underline-offset-2 hover:underline font-medium"
                                    onClick={handleSaveEdit}
                                    disabled={!editInput.trim()}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm mt-1">{msg.content}</p>
                            )}
                            <p className="text-xs opacity-80 mt-1">
                              {new Date(msg.createdAt).toLocaleString()}
                              {msg.isEdited && !msg.isDeleted && ' · edited'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Reply to teacher..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
