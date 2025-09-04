
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
import { Loader2, Send, MessageSquare, Search, CheckCheck, BookOpen, Users, ChevronsUpDown, Paperclip, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type UserProfile = { id: string; name: string; avatarUrl?: string; role: 'student' | 'teacher' | 'admin' };
type Class = { id: string; name: string, studentIds?: Record<string, boolean>, teacherId?: string };
type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  recipientType: 'individual' | 'class';
  content: string;
  timestamp: number;
  readBy?: Record<string, boolean>;
};
type Contact = (UserProfile | Class) & { type: 'user' | 'class' };

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

export default function MessagesPage() {
  const { user, role } = useAuth();
  const { data: allUsers, loading: usersLoading } = useDatabase<UserProfile>("users");
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: messages, addData, updateData, deleteData, loading: messagesLoading } = useDatabase<Message>("messages");
  const { toast } = useToast();

  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [messageContent, setMessageContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editingContent, setEditingContent] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const usersMap = React.useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);
  const studentClass = React.useMemo(() => user ? classes.find(c => c.studentIds && c.studentIds[user.uid]) : null, [classes, user]);
  const teacherClasses = React.useMemo(() => user ? classes.filter(c => c.teacherId === user.uid) : [], [classes, user]);

  const conversationThreads = React.useMemo(() => {
    if (!user) return new Map();
    const threads = new Map<string, { contact: Contact, lastMessage: Message, unreadCount: number }>();
    
    messages.forEach(msg => {
        let conversationId: string | undefined;
        let isRelevantToMe = false;

        // Admin-Teacher chat
        if (role === 'admin' && msg.recipientType === 'individual') {
            const otherUserId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
            const otherUser = usersMap.get(otherUserId);
            if (otherUser?.role === 'teacher') {
                isRelevantToMe = true;
                conversationId = otherUserId;
            }
        }
        // Teacher-Student or Teacher-Admin chat
        else if (role === 'teacher' && msg.recipientType === 'individual') {
            const otherUserId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
            isRelevantToMe = true;
            conversationId = otherUserId;
        }
        // Teacher-Class chat
        else if (role === 'teacher' && msg.recipientType === 'class') {
             if (teacherClasses.some(c => c.id === msg.recipientId)) {
                isRelevantToMe = true;
                conversationId = msg.recipientId;
             }
        }
        // Student chat
        else if (role === 'student') {
             if (msg.recipientType === 'individual') {
                 const otherUserId = msg.senderId === user.uid ? msg.recipientId : msg.senderId;
                 const otherUser = usersMap.get(otherUserId);
                 if (otherUser?.role === 'teacher') {
                    isRelevantToMe = true;
                    conversationId = otherUserId;
                 }
             } else if (msg.recipientType === 'class') {
                 if (studentClass?.id === msg.recipientId) {
                    isRelevantToMe = true;
                    conversationId = msg.recipientId;
                 }
             }
        }
        
        if (!isRelevantToMe || !conversationId) return;

        let contact: Contact | undefined;
        const potentialClass = classes.find(c => c.id === conversationId);
        if (potentialClass) {
            contact = {...potentialClass, type: 'class'};
        } else {
            const potentialUser = usersMap.get(conversationId);
            if (potentialUser) contact = {...potentialUser, type: 'user'};
        }

        if (!contact) return;

        const isMyMessage = msg.senderId === user.uid;
        const isUnread = !isMyMessage && (!msg.readBy || !msg.readBy[user.uid]);
        const existing = threads.get(conversationId);

        if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
            threads.set(conversationId, {
                contact,
                lastMessage: msg,
                unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
            });
        } else if (isUnread) {
            existing.unreadCount++;
        }
    });

    return threads;
  }, [messages, user, usersMap, classes, studentClass, teacherClasses, role]);
  
  const currentMessages = React.useMemo(() => {
    if (!user || !selectedContact) return [];
    
    // Class chat for students and teachers
    if (selectedContact.type === 'class') {
      return messages
        .filter(m => m.recipientType === 'class' && m.recipientId === selectedContact.id)
        .sort((a,b) => a.timestamp - b.timestamp);
    }
    
    // Individual chat logic for all roles
    return messages
      .filter(m => 
        m.recipientType === 'individual' && (
          (m.senderId === user.uid && m.recipientId === selectedContact.id) ||
          (m.senderId === selectedContact.id && m.recipientId === user.uid)
        )
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, user, selectedContact]);

  // Mark messages as read
  React.useEffect(() => {
    if (selectedContact && user) {
      currentMessages.forEach(msg => {
        if (!msg.readBy?.[user.uid] && msg.senderId !== user.uid) {
          updateData(msg.id, { [`readBy/${user.uid}`]: true });
        }
      });
    }
  }, [selectedContact, currentMessages, user, updateData]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !selectedContact) return;
    setIsSending(true);

    try {
        await addData({
            senderId: user.uid,
            recipientId: selectedContact.id,
            recipientType: selectedContact.type === 'class' ? 'class' : 'individual',
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

  const handleUpdateMessage = async () => {
    if(!editingMessageId || !editingContent.trim() || !user) return;
    setIsSending(true);
    try {
        await updateData(editingMessageId, { content: editingContent });
        setEditingMessageId(null);
        setEditingContent("");
        toast({ title: "Message updated" });
    } catch(e) {
        toast({ title: "Error updating message", variant: "destructive"});
    } finally {
        setIsSending(false);
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    setIsDeleting(true);
    try {
        await deleteData(messageId);
        toast({ title: "Message deleted" });
    } catch (e) {
        toast({ title: "Error deleting message", variant: "destructive"});
    } finally {
        setIsDeleting(false);
    }
  }

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }

  const getContactList = (): { classes: Contact[], users: Contact[] } => {
    if (!user || !role) return { classes: [], users: [] };
    
    const contactMap = new Map<string, Contact>();
    conversationThreads.forEach(({ contact }) => {
        contactMap.set(contact.id, contact);
    });

    let additionalClasses: Contact[] = [];
    let additionalUsers: Contact[] = [];

    if (role === 'admin') {
      additionalUsers = allUsers.filter(u => u.role === 'teacher').map(u => ({...u, type: 'user'}));
    } else if (role === 'teacher') {
      additionalClasses = teacherClasses.map(c => ({ ...c, type: 'class' }));
      const studentIds = new Set<string>();
      teacherClasses.forEach(c => {
          if (c.studentIds) Object.keys(c.studentIds).forEach(id => studentIds.add(id));
      });
      additionalUsers = allUsers.filter(u => studentIds.has(u.id) || u.role === 'admin').map(u => ({...u, type: 'user'}));
    } else if (role === 'student') {
      if (studentClass) {
        additionalClasses = [{ ...studentClass, type: 'class' }];
        const teacherId = studentClass.teacherId;
        const teacher = allUsers.find(u => u.id === teacherId);
        if (teacher) {
            additionalUsers = [{...teacher, type: 'user'}];
        }
      }
    }
    
    additionalClasses.forEach(c => { if(!contactMap.has(c.id)) contactMap.set(c.id, c) });
    additionalUsers.forEach(u => { if(!contactMap.has(u.id)) contactMap.set(u.id, u) });

    const allContacts = Array.from(contactMap.values());

    return { 
      classes: allContacts.filter(c => c.type === 'class'), 
      users: allContacts.filter(c => c.type === 'user' && c.id !== user.uid),
    };
  };


  const { classes: contactClasses, users: contactUsers } = getContactList();

  const filteredUsers = contactUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredClasses = contactClasses.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const loading = usersLoading || messagesLoading || classesLoading;

  if (loading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <MessageSquare className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Direct and group messaging.</p>
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
                  {(role === 'teacher' || role === 'student') && filteredClasses.length > 0 && (
                     <Collapsible defaultOpen={true}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-semibold text-sm">
                            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4"/> Classes</div>
                            <ChevronsUpDown className="h-4 w-4"/>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1">
                          {filteredClasses.map(c => (
                             <Button
                                key={c.id}
                                variant={selectedContact?.id === c.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start h-auto p-2 text-left"
                                onClick={() => setSelectedContact(c)}
                            >
                                <Avatar className="h-10 w-10 mr-3 bg-primary text-primary-foreground">
                                    <AvatarFallback><BookOpen className="h-5 w-5"/></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <p className="font-semibold">{c.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                                </div>
                                {conversationThreads.get(c.id)?.unreadCount > 0 && (
                                  <Badge>{conversationThreads.get(c.id)?.unreadCount}</Badge>
                                )}
                            </Button>
                          ))}
                        </CollapsibleContent>
                     </Collapsible>
                  )}
                  {filteredUsers.length > 0 && (
                    <Collapsible defaultOpen={true}>
                       <CollapsibleTrigger className="flex w-full items-center justify-between py-2 font-semibold text-sm">
                            <div className="flex items-center gap-2"><Users className="h-4 w-4"/> People</div>
                            <ChevronsUpDown className="h-4 w-4"/>
                        </CollapsibleTrigger>
                       <CollapsibleContent className="space-y-1">
                          {filteredUsers.map(u => (
                              <Button
                                  key={u.id}
                                  variant={selectedContact?.id === u.id ? 'secondary' : 'ghost'}
                                  className="w-full justify-start h-auto p-2 text-left"
                                  onClick={() => setSelectedContact(u)}
                              >
                                  <Avatar className="h-10 w-10 mr-3">
                                      <AvatarImage src={(u as UserProfile).avatarUrl}/>
                                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 truncate">
                                      <p className="font-semibold">{u.name}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{(u as UserProfile).role}</p>
                                  </div>
                                  {conversationThreads.get(u.id)?.unreadCount > 0 && (
                                    <Badge>{conversationThreads.get(u.id)?.unreadCount}</Badge>
                                  )}
                              </Button>
                          ))}
                       </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
            </ScrollArea>
          </CardContent>
        </div>
        <div className="md:col-span-2 flex flex-col">
            {selectedContact ? (
                <>
                <CardHeader className="flex flex-row items-center gap-3 border-b">
                    <Avatar className="h-10 w-10">
                        {selectedContact.type === 'user' ? (
                          <>
                           <AvatarImage src={(selectedContact as UserProfile).avatarUrl}/>
                           <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                          </>
                        ) : (
                           <AvatarFallback className="bg-primary text-primary-foreground"><BookOpen className="h-5 w-5"/></AvatarFallback>
                        )}
                    </Avatar>
                     <div>
                        <CardTitle className="text-lg">{selectedContact.name}</CardTitle>
                        <CardDescription className="capitalize">
                           {selectedContact.type === 'user' ? (selectedContact as UserProfile).role : `${selectedContact.type}`}
                        </CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 space-y-4">
                    {currentMessages.map(msg => {
                        const sender = usersMap.get(msg.senderId);
                        const isMyMessage = msg.senderId === user?.uid;
                        const isEditingThisMessage = editingMessageId === msg.id;

                        return (
                        <div key={msg.id} className={cn("flex items-end gap-2 group", isMyMessage ? "justify-end" : "justify-start")}>
                            {!isMyMessage && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={sender?.avatarUrl} />
                                    <AvatarFallback>{getInitials(sender?.name)}</AvatarFallback>
                               </Avatar>
                           )}
                           {isMyMessage && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => startEditing(msg)}>
                                        <Pencil className="mr-2 h-4 w-4"/> Edit
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                 <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this message?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Delete"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                             </DropdownMenu>
                           )}
                           <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm", isMyMessage ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {msg.recipientType === 'class' && !isMyMessage && <p className="text-xs font-bold mb-1">{sender?.name}</p>}
                                {isEditingThisMessage ? (
                                    <div className="flex flex-col gap-2">
                                        <Input 
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            onKeyDown={(e) => { if(e.key === 'Enter') handleUpdateMessage(); if(e.key === 'Escape') setEditingMessageId(null);}}
                                            className="bg-primary-foreground/10 h-8"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button size="xs" variant="secondary" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                                            <Button size="xs" onClick={handleUpdateMessage} disabled={isSending}>
                                                {isSending ? <Loader2 className="h-3 w-3 animate-spin"/> : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        <div className={cn("flex items-center justify-end gap-1 text-xs mt-1", isMyMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                            <span>{typeof msg.timestamp === 'number' ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'sending...'}</span>
                                            {isMyMessage && typeof msg.timestamp === 'number' && msg.readBy && Object.keys(msg.readBy).length > 1 && (
                                                <CheckCheck className="h-4 w-4 text-blue-400" />
                                            )}
                                        </div>
                                    </>
                                )}
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
                    <p className="text-muted-foreground">Choose a person or class from the list to start messaging.</p>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}
