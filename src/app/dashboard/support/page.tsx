'use client';

import { JSX, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { SupportRequest } from '@/types';
import { HelpCircle, BookOpen, MessageSquare, Mail } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';

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
      'Use the "Export All" or "Export Selected" buttons available on all table pages to download data in JSON format.',
  },
];

export default function SupportPage(): JSX.Element {
  const supportRequests = useQuery(api.support.getRequests) || [];

  const columns: ColumnDef<SupportRequest>[] = useMemo(
    () => [
      createSelectColumn<SupportRequest>(),
      {
        accessorKey: 'schoolName',
        header: createSortableHeader('School'),
        cell: ({ row }) => <span className="font-medium">{row.original.schoolName}</span>,
      },
      {
        accessorKey: 'subject',
        header: createSortableHeader('Subject'),
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'open'
                ? 'secondary'
                : row.original.status === 'in_progress'
                ? 'default'
                : 'outline'
            }
          >
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'priority',
        header: createSortableHeader('Priority'),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.priority === 'high'
                ? 'destructive'
                : row.original.priority === 'medium'
                ? 'default'
                : 'outline'
            }
          >
            {row.original.priority}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: createSortableHeader('Created'),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <Button size="sm" variant="outline">
            View
          </Button>
        ),
      },
    ],
    []
  );

  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(supportRequests, 'support_tickets');
    } else if (format === 'csv') {
      exportToCSV(supportRequests, 'support_tickets');
    } else {
      exportToPDF(supportRequests, 'support_tickets', 'Support Tickets Report');
    }
    toast.success(`Support tickets exported as ${format.toUpperCase()}`);
  };

  const handleExportSelected = (selected: SupportRequest[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'support_tickets_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[], 'support_tickets_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[],'support_tickets_selected', 'Selected Support Tickets Report');
    }
    toast.success(`${selected.length} ticket(s) exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support & Help</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Get help and manage support requests</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
                <p className="text-2xl font-bold">
                  {supportRequests.filter((r: SupportRequest) => r.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold">
                  {supportRequests.filter((r: SupportRequest) => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Support Email</p>
                <p className="text-sm font-medium">support@schoolflow.com</p>
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
              <CardTitle>Support Requests ({supportRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={supportRequests}
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
    </div>
  );
}
