'use client';

import { JSX, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, User, Clock, Tag, AlertCircle } from 'lucide-react';
import { MessageThread } from './message-thread';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from './ticket-status-badge';
import { formatDistanceToNow } from 'date-fns';

interface TicketDetailDialogProps {
  ticketId: Id<'supportTickets'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'super_admin' | 'school_admin';
  userId: string;
  userName: string;
}

export function TicketDetailDialog({
  ticketId,
  open,
  onOpenChange,
  userRole,
  userId,
  userName,
}: TicketDetailDialogProps): JSX.Element {
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');

  const ticketData = useQuery(
    api.supportTickets.getTicketById,
    ticketId ? { ticketId } : 'skip'
  );

  const addMessage = useMutation(api.supportTickets.addMessage);
  const addInternalNote = useMutation(api.supportTickets.addInternalNote);
  const updateStatus = useMutation(api.supportTickets.updateTicketStatus);
  const updatePriority = useMutation(api.supportTickets.updateTicketPriority);
  const assignTicket = useMutation(api.supportTickets.assignTicket);
  const closeTicket = useMutation(api.supportTickets.closeTicket);
  const reopenTicket = useMutation(api.supportTickets.reopenTicket);

  const ticket = ticketData?.ticket;
  const messages = ticketData?.messages || [];

  const handleAddMessage = async (): Promise<void> => {
    if (!ticketId || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await addMessage({
        ticketId,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        message: message.trim(),
        isInternal: false,
      });

      toast.success('Response sent successfully');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInternalNote = async (): Promise<void> => {
    if (!ticketId || !internalNote.trim() || userRole !== 'super_admin') return;

    setIsSubmitting(true);
    try {
      await addInternalNote({
        ticketId,
        adminId: userId,
        adminName: userName,
        note: internalNote.trim(),
      });

      toast.success('Internal note added');
      setInternalNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (): Promise<void> => {
    if (!ticketId || !newStatus || userRole !== 'super_admin') return;

    try {
      await updateStatus({
        ticketId,
        status: newStatus as 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed',
        adminId: userId,
      });

      toast.success('Status updated successfully');
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleUpdatePriority = async (): Promise<void> => {
    if (!ticketId || !newPriority || userRole !== 'super_admin') return;

    try {
      await updatePriority({
        ticketId,
        priority: newPriority as 'low' | 'medium' | 'high' | 'urgent',
      });

      toast.success('Priority updated successfully');
      setNewPriority('');
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleAssignToMe = async (): Promise<void> => {
    if (!ticketId || userRole !== 'super_admin') return;

    try {
      await assignTicket({
        ticketId,
        adminId: userId,
        adminName: userName,
      });

      toast.success('Ticket assigned to you');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const handleCloseTicket = async (): Promise<void> => {
    if (!ticketId || userRole !== 'super_admin') return;

    try {
      await closeTicket({
        ticketId,
        adminId: userId,
      });

      toast.success('Ticket closed successfully');
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Failed to close ticket');
    }
  };

  const handleReopenTicket = async (): Promise<void> => {
    if (!ticketId) return;

    try {
      await reopenTicket({
        ticketId,
        userId,
        userRole,
      });

      toast.success('Ticket reopened successfully');
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error('Failed to reopen ticket');
    }
  };

  if (!ticket) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTitle></DialogTitle>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{ticket.ticketNumber}</span>
            <TicketStatusBadge status={ticket.status} />
          </DialogTitle>
          <DialogDescription>{ticket.subject}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400">Requester</p>
              <p className="font-medium">{ticket.requesterName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400">Category</p>
              <TicketCategoryBadge category={ticket.category} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400">Priority</p>
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        {ticket.schoolName && (
          <div className="flex items-center gap-2 pb-2">
            <Badge variant="outline">School: {ticket.schoolName}</Badge>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pb-2">
          <Clock className="h-4 w-4" />
          <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
          {ticket.assignedToName && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>Assigned to: {ticket.assignedToName}</span>
            </>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[300px] pr-4">
          <MessageThread messages={messages} currentUserRole={userRole} />
        </ScrollArea>

        <Separator />

        {ticket.status !== 'closed' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddMessage} disabled={isSubmitting || !message.trim()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Response
              </Button>
            </div>

            {userRole === 'super_admin' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="internal-note">Internal Note (Admins Only)</Label>
                  <Textarea
                    id="internal-note"
                    placeholder="Add an internal note..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={2}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddInternalNote}
                    disabled={isSubmitting || !internalNote.trim()}
                  >
                    Add Internal Note
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!ticket.assignedToId && (
                    <Button variant="outline" onClick={handleAssignToMe}>
                      Assign to Me
                    </Button>
                  )}

                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  {newStatus && (
                    <Button variant="outline" onClick={handleUpdateStatus}>
                      Update Status
                    </Button>
                  )}

                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  {newPriority && (
                    <Button variant="outline" onClick={handleUpdatePriority}>
                      Update Priority
                    </Button>
                  )}

                  {ticket.status === 'resolved' && (
                    <Button variant="destructive" onClick={handleCloseTicket}>
                      Close Ticket
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This ticket is closed. You can reopen it if needed.
            </p>
            <Button variant="outline" onClick={handleReopenTicket}>
              Reopen Ticket
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
