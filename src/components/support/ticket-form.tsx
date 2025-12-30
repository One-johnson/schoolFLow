'use client';

import { JSX, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TicketFormProps {
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  schoolId?: string;
  schoolName?: string;
  onSuccess?: () => void;
}

export function TicketForm({
  requesterId,
  requesterName,
  requesterEmail,
  schoolId,
  schoolName,
  onSuccess,
}: TicketFormProps): JSX.Element {
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<'payment' | 'technical' | 'account' | 'general'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createTicket = useMutation(api.supportTickets.createTicket);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        requesterId,
        requesterName,
        requesterEmail,
        schoolId,
        schoolName,
      });

      toast.success('Support ticket submitted successfully');
      
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (): void => {
    setSubject('');
    setDescription('');
    setCategory('general');
    setPriority('medium');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Support Ticket</CardTitle>
        <CardDescription>
          Fill out the form below to submit a new support request. We will respond as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={8}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description.length}/2000 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Ticket
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
