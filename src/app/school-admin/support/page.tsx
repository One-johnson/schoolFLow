'use client';

import { useState, useMemo, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader } from  '../../../components/ui/data-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageSquare, BookOpen, HelpCircle, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from '@/components/support/ticket-status-badge';
import { TicketDetailDialog } from '@/components/support/ticket-detail-dialog';
import { TicketForm } from '@/components/support/ticket-form';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicket {
  _id: Id<'supportTickets'>;
  _creationTime: number;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'payment' | 'technical' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  schoolId?: string;
  schoolName?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  lastResponseBy?: 'admin' | 'customer';
  lastResponseAt?: string;
  responseCount: number;
  attachmentCount: number;
}

const faqs = [
  {
    question: 'How do I create a school?',
    answer:
      'Navigate to the "Create School" page from your dashboard. Fill in all required information including school name, contact details, and student count. Once submitted, your school creation request will be reviewed by Super Admins.',
  },
  {
    question: 'How do I submit payment proof?',
    answer:
      'Go to the Payment page, select your payment method (Mobile Money or Bank Transfer), enter your transaction details, and upload a screenshot of your payment confirmation. Super Admins will verify your payment within 24-48 hours.',
  },
  {
    question: 'How do I manage my subscription?',
    answer:
      'Visit the Subscription page to view your current plan, payment history, and billing information. You can also view your trial status and subscription renewal dates here.',
  },
  {
    question: 'How do I update school details?',
    answer:
      'Access the "My School" page where you can view and update your school information including contact details, address, and student count. Some changes may require Super Admin approval.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can submit a support ticket directly from this page by clicking the "Submit Ticket" tab. Our support team typically responds within 24 hours. For urgent issues, mark your ticket as "High Priority" or "Urgent".',
  },
  {
    question: 'What are the trial terms?',
    answer:
      'New school admins receive a 14-day free trial period. During this time, you can explore all features and create your school. After the trial expires, you will need to submit payment to continue accessing the platform.',
  },
];

export default function SchoolAdminSupportPage(): React.JSX.Element {
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<Id<'supportTickets'> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('tickets');

  // Get school information first
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const myTickets = useQuery(
    api.supportTickets.getTicketsByRequester,
    schoolAdmin?._id ? { requesterId: schoolAdmin._id } : 'skip'
  ) || [];

  const school = useQuery(
    api.schools.getByAdminId,
    schoolAdmin?._id ? { adminId: schoolAdmin._id } : 'skip'
  );

  const openTickets = myTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const waitingResponseTickets = myTickets.filter((t) => t.lastResponseBy === 'admin' && t.status !== 'closed').length;
  const resolvedThisMonth = myTickets.filter((t) => {
    if (!t.resolvedAt) return false;
    const resolvedDate = new Date(t.resolvedAt);
    const now = new Date();
    return resolvedDate.getMonth() === now.getMonth() && resolvedDate.getFullYear() === now.getFullYear();
  }).length;

  const columns: ColumnDef<SupportTicket>[] = useMemo(
    () => [
      {
        accessorKey: 'ticketNumber',
        header: createSortableHeader('Ticket #'),
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.ticketNumber}</span>,
      },
      {
        accessorKey: 'subject',
        header: createSortableHeader('Subject'),
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="truncate font-medium">{row.original.subject}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: createSortableHeader('Category'),
        cell: ({ row }) => <TicketCategoryBadge category={row.original.category} />,
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'priority',
        header: createSortableHeader('Priority'),
        cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'updatedAt',
        header: createSortableHeader('Last Updated'),
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTicketId(row.original._id);
              setIsDialogOpen(true);
            }}
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

  const handleTicketSuccess = (): void => {
    setActiveTab('tickets');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support & Help</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Get help and manage your support tickets</p>
        </div>
        <Button onClick={() => setActiveTab('submit')} className="gap-2">
          <Plus className="h-4 w-4" />
          Submit New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
                <p className="text-2xl font-bold">{openTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Response</p>
                <p className="text-2xl font-bold">{waitingResponseTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Resolved This Month</p>
                <p className="text-2xl font-bold">{resolvedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="submit">Submit Ticket</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="resources">Help Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets ({myTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {myTickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No support tickets yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Submit a ticket if you need help or have questions
                  </p>
                  <Button onClick={() => setActiveTab('submit')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Your First Ticket
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={myTickets}
                  searchKey="subject"
                  searchPlaceholder="Search your tickets..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          {schoolAdmin && user && (
            <TicketForm
              requesterId={schoolAdmin._id}
              requesterName={schoolAdmin.name}
              requesterEmail={schoolAdmin.email}
              schoolId={school?._id}
              schoolName={school?.name}
              onSuccess={handleTicketSuccess}
            />
          )}
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Getting Started</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Learn how to set up your school and get started with SchoolFlow
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Payment Methods & Proof Submission</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    How to submit payment proof and what payment methods are accepted
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Managing Your School</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Update school information, manage staff, and track students
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Understanding Subscription Plans</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Learn about available plans, pricing, and billing cycles
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Common Issues & Solutions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Troubleshooting guide for common problems and their solutions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {schoolAdmin && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          userRole="school_admin"
          userId={schoolAdmin._id}
          userName={schoolAdmin.name}
        />
      )}
    </div>
  );
}
