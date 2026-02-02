'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { JSX } from 'react';

interface Message {
  _id: string;
  _creationTime: number;
  senderId: string;
  senderName: string;
  senderRole: 'super_admin' | 'school_admin';
  message: string;
  isInternal: boolean;
  createdAt: string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserRole: 'super_admin' | 'school_admin';
}

export function MessageThread({ messages, currentUserRole }: MessageThreadProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderRole === currentUserRole;
        const initials = message.senderName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={message._id}
            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className={message.senderRole === 'super_admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className={`flex-1 ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{message.senderName}</span>
                {message.isInternal && (
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                    Internal Note
                  </Badge>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <div
                className={`rounded-lg px-4 py-3 max-w-2xl ${
                  isCurrentUser
                    ? 'bg-blue-600 text-white'
                    : message.isInternal
                    ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
