/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useMemo, } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, BookOpen, MessageSquare,  AlertTriangle, Clock } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';
import { TicketStatusBadge, TicketPriorityBadge, TicketCategoryBadge } from '@/components/support/ticket-status-badge';
import { TicketDetailDialog } from '@/components/support/ticket-detail-dialog';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    question: 'How do I approve a new school?',
    answer:
      'Navigate to the Schools page, verify the payment status, and click the "Approve" button for schools with pending approval status.',
  },
  {
    question: 'How do I verify payments?',
    answer:
      'Go to the Subscriptions/Billing page, review the payment details, and click "Verify" for pending payments.',
  },
  {
    question: 'How do I invite a School Admin?',
    answer:
      'Visit the School Admins page, click "Invite School Admin", fill in the details, and the system will generate temporary credentials.',
  },
  {
    question: 'How can I view audit logs?',
    answer:
      'Access the Audit Logs page to see all platform activities including user actions, timestamps, and IP addresses.',
  },
  {
    question: 'How do I export platform data?',
    answer:
      'Use the "Export All" or "Export Selected" buttons available on all table pages to download data in JSON, CSV, or PDF format.',
  },
];

export default function SupportPage(): React.JSX.Element {
  const { user } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<Id<'supportTickets'> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const allTickets = useQuery(api.supportTickets.getAllTickets, {}) || [];
  const ticketStats = useQuery(api.supportTickets.getTicketStats) || {
    total: 0,
    open: 0,
    inProgress: 0,
    waitingCustomer: 0,
    resolved: 0,
    highPriority: 0,
    unassigned: 0,
  };

  // Apply filters
  const filteredTickets = useMemo(() => {
    let tickets = [...allTickets];

    if (statusFilter !== 'all') {
      tickets = tickets.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      tickets = tickets.filter((t) => t.priority === priorityFilter);
    }

    return tickets;
  }, [allTickets, statusFilter, priorityFilter]);

  const columns: ColumnDef<SupportTicket>[] = useMemo(
    () => [
      createSelectColumn<SupportTicket>(),
      {
        accessorKey: 'ticketNumber',
        header: createSortableHeader('Ticket #'),
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.ticketNumber}</span>,
      },
      {
        accessorKey: 'schoolName',
        header: createSortableHeader('School'),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.schoolName || 'No School'}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: createSortableHeader('Subject'),
        cell: ({ row }) => (
          <div className="max-w-xs">
            <p className="truncate">{row.original.subject}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: createSortableHeader('Category'),
        cell: ({ row }) => <TicketCategoryBadge category={row.original.category} />,
      },
      {
        accessorKey: 'priority',
        header: createSortableHeader('Priority'),
        cell: ({ row }) => <TicketPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'assignedToName',
        header: createSortableHeader('Assigned To'),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.assignedToName || 'Unassigned'}</span>
        ),
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

  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(filteredTickets, 'support_tickets');
    } else if (format === 'csv') {
      exportToCSV(filteredTickets, 'support_tickets');
    } else {
      exportToPDF(filteredTickets, 'support_tickets', 'Support Tickets Report');
    }
    toast.success(`Support tickets exported as ${format.toUpperCase()}`);
  };

  const handleExportSelected = (selected: SupportTicket[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'support_tickets_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[], 'support_tickets_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[], 'support_tickets_selected', 'Selected Support Tickets Report');
    }
    toast.success(`${selected.length} ticket(s) exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support & Help</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage support requests and help resources</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export All Tickets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExportAll('json')}>Export as JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportAll('csv')}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportAll('pdf')}>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
                <p className="text-2xl font-bold">{ticketStats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold">{ticketStats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unassigned</p>
                <p className="text-2xl font-bold">{ticketStats.unassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Support Requests ({filteredTickets.length})</CardTitle>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredTickets}
                searchKey="subject"
                searchPlaceholder="Search tickets..."
                exportFormats={['json', 'csv', 'pdf']}
                onExport={handleExportSelected}
              />
            </CardContent>
          </Card>
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

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Getting Started Guide</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Learn the basics of managing your SchoolFlow platform
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">School Management</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    How to approve, manage, and monitor schools
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Payment Verification</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Step-by-step guide to verify school payments
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">Security Best Practices</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Keep your platform secure with these guidelines
                  </p>
                </div>
                <div className="p-4 border dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                  <h3 className="font-semibold">API Documentation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Integration guides and API references
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {user && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          userRole="super_admin"
          userId={user.userId}
          userName={user.role}
        />
      )}
    </div>
  );
}
