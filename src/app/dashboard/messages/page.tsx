
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
import { Loader2, Send, MessageSquare, Search, BookOpen, UserCheck, MoreHorizontal, Pencil, Trash2, CheckCheck, Users, Paperclip, File as FileIcon, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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
} from "@/components/ui/alert-dialog"


type User = { id: string; name: string; avatarUrl?: string; role: 'student' | 'teacher' | 'admin' };
type Student = { id: string; name: string; avatarUrl?: string; role: 'student'; studentId?: string };
type Class = { id: string; name: string; studentIds?: Record<string, boolean>; teacherId?: string };
type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  recipientType: 'user' | 'class';
  content: string;
  timestamp: number;
  readBy?: Record<string, boolean>;
  fileUrl?: string;
  fileName?: string;
};
type ConversationTarget = (User | Class) & { isGroup?: boolean };

const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

export default function MessagesPage() {
  const { user, role } = useAuth();
  const { data: users, loading: usersLoading } = useDatabase<User>("users");
  const { data: students, loading: studentsLoading } = useDatabase<Student>('students');
  const { data: classes, loading: classesLoading } = useDatabase<Class>("classes");
  const { data: messages, addData, updateData, deleteData, uploadFile, loading: messagesLoading } = useDatabase<Message>("messages");
  const { toast } = useToast();

  const [selectedConversation, setSelectedConversation] = React.useState<ConversationTarget | null>(null);
  const [messageContent, setMessageContent] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editingContent, setEditingContent] = React.useState("");
  const [messageToDelete, setMessageToDelete] = React.useState<Message | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const usersMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const studentsMap = React.useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const classesMap = React.useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  const teacherClasses = React.useMemo(() => {
    if(role !== 'teacher' || !user) return [];
    return classes.filter(c => c.teacherId === user.uid);
  }, [role, user, classes]);
  
  const studentListForTeacher = React.useMemo(() => {
    if (role !== 'teacher' || !user) return [];
    const studentIds = new Set<string>();
    teacherClasses.forEach(c => {
      if (c.studentIds) {
        Object.keys(c.studentIds).forEach(id => studentIds.add(id));
      }
    });
    return Array.from(studentIds).map(id => usersMap.get(id)).filter(Boolean) as User[];
  }, [role, user, teacherClasses, usersMap]);
  
  const conversationThreads = React.useMemo(() => {
    if (!user) return new Map();
    const threads = new Map<string, { user: ConversationTarget, lastMessage: Message, unreadCount: number }>();
    
    messages.forEach(msg => {
      const isMyMessage = msg.senderId === user.uid;
      
      if(msg.recipientType === 'user') {
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
      } else { // Group message
          const classId = msg.recipientId;
          const targetClass = classesMap.get(classId);
          if(!targetClass) return;
          const isMember = targetClass.studentIds?.[user.uid] || targetClass.teacherId === user.uid || role === 'admin';
          if(!isMember) return;

          const existing = threads.get(classId);
          const isUnread = !isMyMessage && (!msg.readBy || !msg.readBy[user.uid]);
          
          if (!existing || msg.timestamp > existing.lastMessage.timestamp) {
            threads.set(classId, {
              user: { ...targetClass, isGroup: true },
              lastMessage: msg,
              unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
            });
          } else if (isUnread) {
            existing.unreadCount += 1;
          }
      }
    });

    return threads;
  }, [messages, user, usersMap, classesMap, role]);
  

  const currentMessages = React.useMemo(() => {
    if (!user || !selectedConversation) return [];
    if(selectedConversation.isGroup) {
      return messages.filter(m => m.recipientType === 'class' && m.recipientId === selectedConversation.id)
          .sort((a,b) => a.timestamp - b.timestamp);
    }
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
        if (!msg.readBy?.[user.uid] && msg.senderId !== user.uid) {
          updateData(msg.id, { [`readBy/${user.uid}`]: true });
        }
      });
    }
  }, [selectedConversation, currentMessages, user, updateData]);

  const handleSendMessage = async () => {
    if ((!messageContent.trim() && !file) || !user || !selectedConversation) return;
    setIsSending(true);
    
    try {
      let filePayload: { fileUrl?: string; fileName?: string } = {};
      if(file) {
          const downloadURL = await uploadFile(file, `message_attachments/${user.uid}/${file.name}`);
          filePayload = { fileUrl: downloadURL, fileName: file.name };
      }

      await addData({
        senderId: user.uid,
        recipientId: selectedConversation.id,
        recipientType: selectedConversation.isGroup ? 'class' : 'user',
        content: messageContent,
        readBy: { [user.uid]: true },
        timestamp: Date.now(),
        ...filePayload,
      } as Omit<Message, 'id'>);

      setMessageContent("");
      setFile(null);
    } catch(e) {
      toast({ title: "Error sending message", variant: "destructive"});
      console.error(e);
    } finally {
      setIsSending(false);
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  }


  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  }

  const handleUpdateMessage = async () => {
    if(!editingMessageId || !editingContent.trim()) return;
    setIsUpdating(true);
    try {
        await updateData(editingMessageId, { content: editingContent });
        toast({ title: "Message updated" });
        handleCancelEdit();
    } catch (e) {
        toast({ title: "Error updating message", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  }

  const handleDeleteMessage = async () => {
    if(!messageToDelete) return;
    setIsUpdating(true);
    try {
        await deleteData(messageToDelete.id);
        toast({ title: "Message deleted" });
        setMessageToDelete(null);
    } catch (e) {
         toast({ title: "Error deleting message", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  }

  const studentsInClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls || !cls.studentIds) return [];
    return Object.keys(cls.studentIds)
        .map(id => usersMap.get(id))
        .filter((u): u is User => !!u);
  }
  
  const renderContactItem = (contact: ConversationTarget) => {
    const studentDetail = studentsMap.get(contact.id);
    const itemKey = contact.id;
    return (
      <Button
          key={itemKey}
          variant={selectedConversation?.id === itemKey ? 'secondary' : 'ghost'}
          className="w-full justify-start h-auto p-2 text-left"
          onClick={() => setSelectedConversation(contact)}
        >
          <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={contact.isGroup ? undefined : (contact as User).avatarUrl}/>
              <AvatarFallback>{contact.isGroup ? <Users className="h-5 w-5"/> : getInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
              <p className="font-semibold">{contact.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {contact.isGroup ? 'Class Group' : (contact as User).role === 'student' ? studentDetail?.studentId : (contact as User).role}
              </p>
          </div>
          {conversationThreads.get(itemKey)?.unreadCount > 0 && (
            <Badge>{conversationThreads.get(itemKey)?.unreadCount}</Badge>
          )}
        </Button>
    )
  }
  
 const renderAdminContacts = () => {
      const allTeachers = users.filter(u => u.role === 'teacher');
      const filteredTeachers = filteredUsers(allTeachers);
      const filteredClasses = classes.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        studentsInClass(c.id).some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (searchQuery) {
        const studentResults = users.filter(u => u.role === 'student' && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || studentsMap.get(u.id)?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())));

        return (
             <div className="space-y-2 pr-4">
              {filteredTeachers.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-muted-foreground px-2 pt-2">Teachers</h4>
                  {filteredTeachers.map(u => renderContactItem(u as ConversationTarget))}
                </>
              )}
               {studentResults.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-muted-foreground px-2 pt-2">Students</h4>
                  {studentResults.map(u => renderContactItem(u as ConversationTarget))}
                </>
              )}
              {filteredClasses.length > 0 && (
                <>
                   <h4 className="text-sm font-semibold text-muted-foreground px-2 pt-2">Classes</h4>
                   {filteredClasses.map(c => renderContactItem({ ...c, isGroup: true }))}
                </>
              )}
             </div>
        );
      }

      return (
        <Accordion type="multiple" className="w-full pr-4">
          <AccordionItem value="teachers">
            <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2"><UserCheck className="h-5 w-5"/> Teachers ({allTeachers.length})</div></AccordionTrigger>
            <AccordionContent className="space-y-1 pl-2">{allTeachers.map(u => renderContactItem(u as ConversationTarget))}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="classes">
            <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5"/> Classes</div></AccordionTrigger>
            <AccordionContent className="pl-2">
               <Accordion type="multiple" className="w-full">
                {classes.map(c => (
                    <AccordionItem value={c.id} key={c.id}>
                        <AccordionTrigger>{c.name} (group chat)</AccordionTrigger>
                        <AccordionContent className="space-y-1 pl-4">
                            {renderContactItem({ ...c, isGroup: true })}
                        </AccordionContent>
                    </AccordionItem>
                ))}
               </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
  };
  
  const getContactList = () => {
    let contacts: ConversationTarget[] = [];
    if (role === 'teacher') {
        contacts = [...teacherClasses.map(c => ({...c, isGroup: true})), ...studentListForTeacher];
    }
    if (role === 'student') {
        const studentClass = classes.find(c => c.studentIds?.[user?.uid || '']);
        const teacher = studentClass?.teacherId ? usersMap.get(studentClass.teacherId) : null;
        if(studentClass) contacts.push({...studentClass, isGroup: true});
        if(teacher) contacts.push(teacher);
    }
    return contacts;
  };

  const filteredUsers = (userList: ConversationTarget[]) => {
    if (!searchQuery) return userList;
    return userList.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (!u.isGroup && studentsMap.get(u.id)?.studentId?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  const loading = usersLoading || classesLoading || messagesLoading || studentsLoading;

  if (loading) {
      return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <MessageSquare className="h-8 w-8" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Direct and group messaging with students and staff.</p>
        </div>
      </div>
      <Card className="h-[75vh] grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1 border-r">
          <CardHeader>
            <CardTitle>Contacts & Groups</CardTitle>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(75vh-150px)]">
                {role === 'admin' ? renderAdminContacts() :
                    <div className="space-y-2 pr-4">
                        {filteredUsers(getContactList()).map(renderContactItem)}
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
                        <AvatarImage src={!selectedConversation.isGroup ? (selectedConversation as User).avatarUrl : undefined}/>
                        <AvatarFallback>{selectedConversation.isGroup ? <Users className="h-5 w-5"/> : getInitials(selectedConversation.name)}</AvatarFallback>
                    </Avatar>
                     <div>
                        <CardTitle className="text-lg">{selectedConversation.name}</CardTitle>
                        <CardDescription className="capitalize">
                            {selectedConversation.isGroup ? 'Class Group' : (selectedConversation as User).role}
                        </CardDescription>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4 space-y-4">
                    {currentMessages.map(msg => {
                        const sender = usersMap.get(msg.senderId);
                        return (
                        <div key={msg.id} className={cn("group flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                            {msg.senderId !== user?.uid && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={sender?.avatarUrl} />
                                    <AvatarFallback>{getInitials(sender?.name)}</AvatarFallback>
                               </Avatar>
                           )}
                           
                           {msg.senderId === user?.uid && (
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleEditMessage(msg)} disabled={!!msg.fileUrl}>
                                            <Pencil className="mr-2 h-4 w-4"/> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onSelect={() => setMessageToDelete(msg)}>
                                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                               </DropdownMenu>
                           )}

                           <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {editingMessageId === msg.id ? (
                                    <div className="space-y-2">
                                        <Input value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="bg-background text-foreground" disabled={isUpdating}/>
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isUpdating}>Cancel</Button>
                                            <Button size="sm" onClick={handleUpdateMessage} disabled={isUpdating}>{isUpdating && <Loader2 className="h-4 w-4 animate-spin"/>} Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {msg.fileUrl && (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-md hover:bg-black/20 mb-2">
                                                <FileIcon className="h-5 w-5"/>
                                                <span className="truncate">{msg.fileName}</span>
                                            </a>
                                        )}
                                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                        <div className={cn("flex items-center justify-end gap-1 text-xs mt-1", msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                            {msg.senderId !== user?.uid && <span className="font-semibold">{sender?.name?.split(' ')[0]} -</span>}
                                            <span>{typeof msg.timestamp === 'number' ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'sending...'}</span>
                                            {msg.senderId === user?.uid && typeof msg.timestamp === 'number' && msg.readBy && Object.keys(msg.readBy).length > 1 && (
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
                    {file && <div className="text-sm p-2 mb-2 bg-muted rounded-md flex justify-between items-center"><span>{file.name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}><XCircle className="h-4 w-4"/></Button></div>}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <Input placeholder="Type your message..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} disabled={isSending}/>
                        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="h-4 w-4"/></Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <Button type="submit" disabled={isSending || (!messageContent.trim() && !file)}><Send className="h-4 w-4"/></Button>
                    </form>
                </div>
                </>
            ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/50"/>
                    <h3 className="mt-4 text-lg font-semibold">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a person or group from the list to start messaging.</p>
                </div>
            )}
        </div>
      </Card>
      
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this message?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The message will be permanently deleted for everyone in the chat.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90" disabled={isUpdating}>{isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
