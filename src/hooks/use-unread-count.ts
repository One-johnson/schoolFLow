
"use client";

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { useDatabase } from './use-database';

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

export function useUnreadCount() {
    const { user, role } = useAuth();
    const { data: messages } = useDatabase<Message>("messages");
    const { data: allUsers } = useDatabase<UserProfile>("users");
    const { data: classes } = useDatabase<Class>("classes");

    const usersMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);
    const studentClass = useMemo(() => user ? classes.find(c => c.studentIds && c.studentIds[user.uid]) : null, [classes, user]);
    const teacherClasses = useMemo(() => user ? classes.filter(c => c.teacherId === user.uid) : [], [classes, user]);

    const unreadCount = useMemo(() => {
        if (!user) return 0;
        
        let count = 0;

        messages.forEach(msg => {
            let isRelevantToMe = false;
            const isMyMessage = msg.senderId === user.uid;
            if(isMyMessage) return;

            const isUnread = !msg.readBy || !msg.readBy[user.uid];
            if(!isUnread) return;

            if (role === 'admin') { // Admin receives messages from teachers
                const sender = usersMap.get(msg.senderId);
                if (msg.recipientType === 'individual' && msg.recipientId === user.uid && sender?.role === 'teacher') {
                    isRelevantToMe = true;
                }
            } else if (role === 'teacher') { // Teacher messages with students, their class, and admin
                 if (msg.recipientType === 'individual' && msg.recipientId === user.uid) {
                    isRelevantToMe = true;
                } else if (msg.recipientType === 'class' && teacherClasses.some(c => c.id === msg.recipientId)) {
                    isRelevantToMe = true;
                }
            } else if (role === 'student') { // Student messages with their teacher and their class
                const sender = usersMap.get(msg.senderId);
                if (msg.recipientType === 'individual' && msg.recipientId === user.uid && sender?.role === 'teacher') {
                     isRelevantToMe = true;
                } else if (msg.recipientType === 'class' && studentClass?.id === msg.recipientId) {
                    isRelevantToMe = true;
                }
            }

            if(isRelevantToMe) {
                count++;
            }
        });

        return count;
    }, [messages, user, role, usersMap, studentClass, teacherClasses]);

    return unreadCount;
}
