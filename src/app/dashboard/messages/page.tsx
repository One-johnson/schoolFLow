
"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDatabase } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageSquare, Search, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type User = { id: string; name: string; avatarUrl?: string; role: 'student' | 'teacher' | 'admin' };
type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: number;
  readBy?: Record<string, boolean>;
};

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

export default function MessagesPage() {
  const { user, role } = useAuth();
  const { data: users, loading: usersLoading } = useDatabase<User>("users");
  const { data: messages, addData, updateData, loading: messagesLoading } = useDatabase<Message>("messages");
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [messageContent, setMessageContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const conversationThreads = React.useMemo(() => {
    if (!user) return new Map();
    const threads = new Map<string, { user: User, lastMessage: Message, unreadCount: number }>();
    
    messages.forEach(msg => {
      const isMyMessage = msg.senderId === user.uid;
      const otherUserId = isMyMessage ? msg.recipientId : msg.senderId;

      if (msg.recipientId !== user.uid && msg.senderId !== user.uid) return;

      const otherUser = usersMap.get(otherUserId);
      if (!otherUser) return;
      
      const existing = threads.get(otherUserId);
      const isUnread = !isMyMessage && (!msg.readBy || !msg.readBy[user.uid]);

      if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
        threads.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
        });
      } else if (isUnread) {
        existing.unreadCount += 1;
      }
    });

    return threads;
  }, [messages, user, usersMap]);
  
  const currentMessages = React.useMemo(() => {
    if (!user || !selectedUser) return [];
    return messages
      .filter(m => 
        (m.senderId === user.uid && m.recipientId === selectedUser.id) ||
        (m.senderId === selectedUser.id && m.recipientId === user.uid)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, user, selectedUser]);

  // Mark messages as read
  React.useEffect(() => {
    if (selectedUser && user) {
      currentMessages.forEach(msg => {
        if (!msg.readBy?.[user.uid] && msg.senderId !== user.uid) {
          updateData(msg.id, { [`readBy/${user.uid}`]: true });
        }
      });
    }
  }, [selectedUser, currentMessages, user, updateData]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !selectedUser) return;
    setIsSending(true);

    try {
        await addData({
            senderId: user.uid,
            recipientId: selectedUser.id,
            content: messageContent,
            readBy: { [user.uid]: true },
            timestamp: Date.now(),
        } as Omit<Message, 'id'>);
        setMessageContent("");
    } catch (e) {
        toast({ title: "Error sending message", variant: "destructive"});
        console.error(e);
    } finally {
        setIsSending(false);
    }
  }

  const getContactList = () => {
    if (!user) return [];
    const contacts = Array.from(conversationThreads.values()).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    let allUsers;
    if (role === 'admin') {
        allUsers = users.filter(u => u.id !== user.uid);
    } else if (role === 'teacher') {
        allUsers = users.filter(u => u.role === 'student' || u.role === 'admin');
    } else { // student
        allUsers = users.filter(u => u.role === 'teacher' || u.role === 'admin');
    }

    const contactMap = new Map(contacts.map(c => [c.user.id, c.user]));
    allUsers.forEach(u => {
      if(!contactMap.has(u.id)) {
        contactMap.set(u.id, u);
      }
    });

    return Array.from(contactMap.values());
  };

  const filteredUsers = getContactList().filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const loading = usersLoading || messagesLoading;

  if (loading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <MessageSquare className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Direct messaging with students and staff.</p>
        </div>
      </div>
      <Card className="h-[75vh] grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 border-r">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(75vh-150px)]">
                <div className="space-y-2 pr-4">
                {filteredUsers.map(u => (
                    <Button
                        key={u.id}
                        variant={selectedUser?.id === u.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-auto p-2 text-left"
                        onClick={() => setSelectedUser(u)}
                    >
                        <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={u.avatarUrl}/>
                            <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                        </div>
                        {conversationThreads.get(u.id)?.unreadCount > 0 && (
                          <Badge>{conversationThreads.get(u.id)?.unreadCount}</Badge>
                        )}
                    </Button>
                ))}
                </div>
            </ScrollArea>
          </CardContent>
        </div>
        <div className="md:col-span-2 flex flex-col">
            {selectedUser ? (
                <>
                <CardHeader className="flex flex-row items-center gap-3 border-b">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.avatarUrl}/>
                        <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                    </Avatar>
                     <div>
                        <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                        <CardDescription className="capitalize">{selectedUser.role}</CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 space-y-4">
                    {currentMessages.map(msg => {
                        const sender = usersMap.get(msg.senderId);
                        return (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                            {msg.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={sender?.avatarUrl} />
                                    <AvatarFallback>{getInitials(sender?.name)}</AvatarFallback>
                               </Avatar>
                           )}
                           <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className={cn("flex items-center justify-end gap-1 text-xs mt-1", msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    <span>{typeof msg.timestamp === 'number' ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'sending...'}</span>
                                    {msg.senderId === user?.uid && typeof msg.timestamp === 'number' && msg.readBy && Object.keys(msg.readBy).length > 1 && (
                                        <CheckCheck className="h-4 w-4 text-blue-400" />
                                    )}
                                </div>
                           </div>
                        </div>
                    )})}
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <Input placeholder="Type your message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} disabled={isSending}/>
                        <Button type="submit" disabled={isSending || !messageContent.trim()}><Send className="h-4 w-4"/></Button>
                    </form>
                </div>
                </>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/50"/>
                    <h3 className="mt-4 text-lg font-semibold">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a person from the list to start messaging.</p>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}
