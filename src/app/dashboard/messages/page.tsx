
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
import { Loader2, Send, MessageSquare, Search, BookOpen, UserCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


type User = { id: string; name: string; avatarUrl?: string; role: 'student' | 'teacher' | 'admin', studentId?: string };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; teacherId?: string };
type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: number;
  read: boolean;
};

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

export default function MessagesPage() {
  const { user, role } = useAuth();
  const { data: users, loading: usersLoading } = useDatabase<User>("users");
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: messages, addData, updateData, loading: messagesLoading } = useDatabase<Message>("messages");
  const { toast } = useToast();

  const [selectedConversation, setSelectedConversation] = React.useState<User | null>(null);
  const [messageContent, setMessageContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  
  const studentListForTeacher = React.useMemo(() => {
    if (role !== 'teacher' || !user) return [];
    const studentIds = new Set<string>();
    classes.forEach(c => {
      if (c.teacherId === user.uid && c.studentIds) {
        Object.keys(c.studentIds).forEach(id => studentIds.add(id));
      }
    });
    return Array.from(studentIds).map(id => usersMap.get(id)).filter(Boolean) as User[];
  }, [role, user, classes, usersMap]);
  
  const conversationThreads = React.useMemo(() => {
    if (!user) return new Map();
    const threads = new Map<string, { user: User, lastMessage: Message, unreadCount: number }>();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
      if (msg.recipientId !== user.uid && msg.senderId !== user.uid) return;

      const otherUser = usersMap.get(otherUserId);
      if (!otherUser) return;
      
      const existing = threads.get(otherUserId);
      if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
        threads.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (!msg.read && msg.recipientId === user.uid ? 1 : 0)
        });
      } else if (!msg.read && msg.recipientId === user.uid) {
        existing.unreadCount += 1;
      }
    });

    return threads;
  }, [messages, user, usersMap]);
  
  const getContactList = () => {
    if (role === 'teacher') return studentListForTeacher;
    if (role === 'student') return Array.from(conversationThreads.values()).map(t => t.user);
    return [];
  };

  const contactList = getContactList();

  const currentMessages = React.useMemo(() => {
    if (!user || !selectedConversation) return [];
    return messages
      .filter(m => 
        (m.senderId === user.uid && m.recipientId === selectedConversation.id) ||
        (m.senderId === selectedConversation.id && m.recipientId === user.uid)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, user, selectedConversation]);

  // Mark messages as read
  React.useEffect(() => {
    if (selectedConversation && user) {
      currentMessages.forEach(msg => {
        if (!msg.read && msg.recipientId === user.uid) {
          updateData(msg.id, { read: true });
        }
      });
    }
  }, [selectedConversation, currentMessages, user, updateData]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !selectedConversation) return;
    setIsSending(true);
    try {
      await addData({
        senderId: user.uid,
        recipientId: selectedConversation.id,
        content: messageContent,
        read: false,
        timestamp: Date.now(),
      } as Omit<Message, 'id'>);
      setMessageContent("");
    } catch(e) {
      toast({ title: "Error sending message", variant: "destructive"});
    } finally {
      setIsSending(false);
    }
  }

  const studentsInClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.studentIds) return [];
    return Object.keys(cls.studentIds)
        .map(id => usersMap.get(id))
        .filter((u): u is User => !!u);
  }
  
  const filteredUsers = (userList: User[]) => {
    if (!searchQuery) return userList;
    return userList.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.studentId && u.studentId.includes(searchQuery))
    );
  }
  
  const renderContactItem = (contact: User) => (
      <Button
          key={contact.id}
          variant={selectedConversation?.id === contact.id ? 'secondary' : 'ghost'}
          className="w-full justify-start h-auto p-2 text-left"
          onClick={() => setSelectedConversation(contact)}
        >
          <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={contact.avatarUrl}/>
              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
              <p className="font-semibold">{contact.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
          </div>
          {conversationThreads.get(contact.id)?.unreadCount > 0 && (
            <Badge>{conversationThreads.get(contact.id)?.unreadCount}</Badge>
          )}
        </Button>
  )
  
  const renderAdminContacts = () => {
      const allTeachers = users.filter(u => u.role === 'teacher');
      const filteredTeachers = filteredUsers(allTeachers);
      const filteredClasses = classes.filter(c => 
        studentsInClass(c.id).some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (searchQuery) {
        return (
             <div className="space-y-2 pr-4">
              {filteredTeachers.map(renderContactItem)}
              {classes.map(c => 
                  filteredUsers(studentsInClass(c.id)).map(s => renderContactItem(s))
              )}
             </div>
        );
      }

      return (
        <Accordion type="multiple" className="w-full pr-4">
          <AccordionItem value="teachers">
            <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5"/> Teachers ({allTeachers.length})
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pl-2">
              {allTeachers.map(renderContactItem)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="classes">
            <AccordionTrigger className="hover:no-underline">
                 <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5"/> Classes
                </div>
            </AccordionTrigger>
            <AccordionContent className="pl-2">
               <Accordion type="multiple" className="w-full">
                {classes.map(c => (
                    <AccordionItem value={c.id} key={c.id}>
                        <AccordionTrigger>{c.name} ({studentsInClass(c.id).length})</AccordionTrigger>
                        <AccordionContent className="space-y-1 pl-4">
                           {studentsInClass(c.id).map(renderContactItem)}
                        </AccordionContent>
                    </AccordionItem>
                ))}
               </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
  };
  
  const loading = usersLoading || classesLoading || messagesLoading;

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
            {role === 'admin' ? (
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or ID..." 
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            ) : <CardDescription>Select a user to start a conversation.</CardDescription>}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(75vh-150px)]">
                {role === 'admin' ? renderAdminContacts() :
                    <div className="space-y-2 pr-4">
                        {contactList.map(renderContactItem)}
                    </div>
                }
            </ScrollArea>
          </CardContent>
        </div>
        <div className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
                <>
                <CardHeader className="flex flex-row items-center gap-3 border-b">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.avatarUrl}/>
                        <AvatarFallback>{getInitials(selectedConversation.name)}</AvatarFallback>
                    </Avatar>
                     <div>
                        <CardTitle className="text-lg">{selectedConversation.name}</CardTitle>
                        <CardDescription className="capitalize">{selectedConversation.role}</CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 space-y-4">
                    {currentMessages.map(msg => (
                        <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                           {msg.senderId !== user?.uid && (
                               <Avatar className="h-8 w-8">
                                    <AvatarImage src={usersMap.get(msg.senderId)?.avatarUrl} />
                                    <AvatarFallback>{getInitials(usersMap.get(msg.senderId)?.name)}</AvatarFallback>
                               </Avatar>
                           )}
                           <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                <p>{msg.content}</p>
                                <p className={cn("text-xs mt-1", msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                     {typeof msg.timestamp === 'number' ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'sending...'}
                                </p>
                           </div>
                        </div>
                    ))}
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <Input 
                            placeholder="Type your message..." 
                            value={messageContent} 
                            onChange={(e) => setMessageContent(e.target.value)}
                            disabled={isSending}
                        />
                        <Button type="submit" disabled={isSending || !messageContent.trim()}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        </Button>
                    </form>
                </div>
                </>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/50"/>
                    <h3 className="mt-4 text-lg font-semibold">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a person from the list to see your message history.</p>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}
