'use client';

import { useState, useMemo, useCallback, JSX } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Receipt,
  FileDown,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Percent,
  Calendar,
  Send,
  Users,
  Bell,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  FolderPlus,
} from 'lucide-react';
import { AddCategoryDialog } from '@/components/fees/add-category-dialog';
import { RecordPaymentDialog } from '@/components/fees/record-payment-dialog';
import { BulkUploadCSVDialog } from '@/components/fees/bulk-upload-csv-dialog';
import { AddDiscountDialog } from '@/components/fees/add-discount-dialog';
import { CreatePaymentPlanDialog } from '@/components/fees/create-payment-plan-dialog';
import { ApplyFeeStructureDialog } from '@/components/fees/apply-fee-structure-dialog';
import { SendRemindersDialog } from '@/components/fees/send-reminders-dialog';
import { CreateFeeStructureDialog } from '@/components/fees/create-fee-structure-dialog';
import { EditCategoryDialog } from '@/components/fees/edit-category-dialog';
import { DeleteCategoryDialog } from '@/components/fees/delete-category-dialog';
import { ViewCategoryDialog } from '@/components/fees/view-category-dialog';
import { ViewPaymentDialog } from '@/components/fees/view-payment-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable, createSortableHeader } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { generateFeeReceipt, exportOutstandingFeesPDF } from '@/lib/fee-exports';
import { toast } from 'sonner';

interface FeeCategory {
  _id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isOptional: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface FeePayment {
  _id: string;
  paymentId: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  categoryId: string;
  categoryName: string;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  transactionReference?: string;
  paymentDate: string;
  paymentStatus: 'paid' | 'partial' | 'pending';
  paidBy?: string;
  collectedByName: string;
  notes?: string;
  createdAt: string;
}

export default function FeesPage(): JSX.Element {
  const { user } = useAuth();
  const [addCategoryOpen, setAddCategoryOpen] = useState<boolean>(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState<boolean>(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState<boolean>(false);
  const [addDiscountOpen, setAddDiscountOpen] = useState<boolean>(false);
  const [createPlanOpen, setCreatePlanOpen] = useState<boolean>(false);
  const [applyStructureOpen, setApplyStructureOpen] = useState<boolean>(false);
  const [sendRemindersOpen, setSendRemindersOpen] = useState<boolean>(false);
  const [createStructureOpen, setCreateStructureOpen] = useState<boolean>(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState<boolean>(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState<boolean>(false);
  const [viewCategoryOpen, setViewCategoryOpen] = useState<boolean>(false);
  const [viewPaymentOpen, setViewPaymentOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<FeeCategory | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);

  // Fetch school data
  const schoolAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const school = useQuery(
    api.schools.getBySchoolId,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  // Fetch fee data
  const categories = useQuery(
    api.feeCategories.getCategoriesBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  ) as FeeCategory[] | undefined;

  const payments = useQuery(
    api.feePayments.getPaymentsBySchool,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  ) as FeePayment[] | undefined;

  const outstandingPayments = useQuery(
    api.feePayments.getOutstandingPayments,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  ) as FeePayment[] | undefined;

  const paymentStats = useQuery(
    api.feePayments.getPaymentStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  const categoryStats = useQuery(
    api.feeCategories.getCategoryStats,
    schoolAdmin?.schoolId ? { schoolId: schoolAdmin.schoolId } : 'skip'
  );

  // Generate receipt handler
  const handleGenerateReceipt = useCallback((payment: FeePayment): void => {
    if (!school) {
      toast.error('School information not available');
      return;
    }

    generateFeeReceipt({
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      studentName: payment.studentName,
      studentId: payment.studentId,
      className: payment.className,
      categoryName: payment.categoryName,
      amountDue: payment.amountDue,
      amountPaid: payment.amountPaid,
      remainingBalance: payment.remainingBalance,
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      paidBy: payment.paidBy,
      collectedByName: payment.collectedByName,
      schoolName: school.name,
      schoolAddress: school.address,
      schoolPhone: school.phone,
    });

    toast.success('Receipt downloaded successfully');
  }, [school]);

  // Export outstanding fees
  const handleExportOutstanding = useCallback((): void => {
    if (!outstandingPayments || outstandingPayments.length === 0) {
      toast.error('No outstanding fees to export');
      return;
    }

    if (!school) {
      toast.error('School information not available');
      return;
    }

    exportOutstandingFeesPDF(
      outstandingPayments.map(p => ({
        studentName: p.studentName,
        studentId: p.studentId,
        className: p.className,
        categoryName: p.categoryName,
        amountDue: p.amountDue,
        amountPaid: p.amountPaid,
        remainingBalance: p.remainingBalance,
        paymentDate: p.paymentDate,
      })),
      school.name
    );

    toast.success('Outstanding fees report downloaded');
  }, [outstandingPayments, school]);

  // Category columns
  const categoryColumns: ColumnDef<FeeCategory>[] = useMemo(() => [
    {
      accessorKey: 'categoryCode',
      header: createSortableHeader('Code'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('categoryCode')}</span>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: createSortableHeader('Category Name'),
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue('categoryName')}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('description') || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'isOptional',
      header: 'Type',
      cell: ({ row }) => {
        const isOptional = row.getValue('isOptional') as boolean;
        return isOptional ? (
          <Badge variant="outline">Optional</Badge>
        ) : (
          <Badge className="bg-blue-500">Mandatory</Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return status === 'active' ? (
          <Badge className="bg-green-500">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCategory(category);
                  setViewCategoryOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCategory(category);
                  setEditCategoryOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCategory(category);
                  setDeleteCategoryOpen(true);
                }}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  // Payment columns
  const paymentColumns: ColumnDef<FeePayment>[] = useMemo(() => [
    {
      accessorKey: 'receiptNumber',
      header: createSortableHeader('Receipt No.'),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('receiptNumber')}</span>
      ),
    },
    {
      accessorKey: 'studentName',
      header: createSortableHeader('Student'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('studentName')}</div>
          <div className="text-sm text-muted-foreground">{row.original.className}</div>
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => row.getValue('categoryName'),
    },
    {
      accessorKey: 'amountPaid',
      header: createSortableHeader('Amount Paid'),
      cell: ({ row }) => (
        <span className="font-medium">
          GHS {(row.getValue('amountPaid') as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalance',
      header: createSortableHeader('Balance'),
      cell: ({ row }) => {
        const balance = row.getValue('remainingBalance') as number;
        return (
          <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
            GHS {balance.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('paymentStatus') as string;
        if (status === 'paid') {
          return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Paid</Badge>;
        } else if (status === 'partial') {
          return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" />Partial</Badge>;
        } else {
          return <Badge className="bg-red-500"><XCircle className="mr-1 h-3 w-3" />Pending</Badge>;
        }
      },
    },
    {
      accessorKey: 'paymentDate',
      header: createSortableHeader('Payment Date'),
      cell: ({ row }) => new Date(row.getValue('paymentDate')).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(payment);
                  setViewPaymentOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReceipt(payment)}>
                <Receipt className="mr-2 h-4 w-4" />
                Download Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleGenerateReceipt]);

  // Outstanding payment columns
  const outstandingColumns: ColumnDef<FeePayment>[] = useMemo(() => [
    {
      accessorKey: 'studentName',
      header: createSortableHeader('Student'),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('studentName')}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.studentId} - {row.original.className}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Fee Category',
    },
    {
      accessorKey: 'amountDue',
      header: createSortableHeader('Amount Due'),
      cell: ({ row }) => (
        <span className="font-medium">
          GHS {(row.getValue('amountDue') as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: createSortableHeader('Amount Paid'),
      cell: ({ row }) => (
        <span>GHS {(row.getValue('amountPaid') as number).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'remainingBalance',
      header: createSortableHeader('Balance'),
      cell: ({ row }) => (
        <span className="text-red-600 font-bold">
          GHS {(row.getValue('remainingBalance') as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('paymentStatus') as string;
        if (status === 'partial') {
          return <Badge className="bg-yellow-500">Partial Payment</Badge>;
        } else {
          return <Badge className="bg-red-500">Pending</Badge>;
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPayment(payment);
                  setViewPaymentOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateReceipt(payment)}>
                <Receipt className="mr-2 h-4 w-4" />
                Download Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleGenerateReceipt]);

  // Show loading
  if (!user || !schoolAdmin || !school) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-muted-foreground">
              Complete fee management with discounts, payment plans, and reminders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateStructureOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Structure
            </Button>
            <Button variant="outline" onClick={() => setAddCategoryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
            <Button onClick={() => setRecordPaymentOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddDiscountOpen(true)}>
            <Percent className="mr-2 h-4 w-4" />
            Add Discount
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreatePlanOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Payment Plan
          </Button>
          <Button variant="outline" size="sm" onClick={() => setApplyStructureOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Apply Fees
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSendRemindersOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {paymentStats?.totalCollected?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentStats?.paidCount || 0} paid payments
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {paymentStats?.totalOutstanding?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(paymentStats?.partialCount || 0) + (paymentStats?.pendingCount || 0)} outstanding
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Categories</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {categoryStats?.active || 0} active categories
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats?.totalPayments || 0}</div>
            <p className="text-xs text-muted-foreground">
              All payment records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="categories">Fee Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Fee Payments</CardTitle>
              <CardDescription>
                View and manage all fee payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No payments recorded</h3>
                  <p className="text-muted-foreground">
                    Start by recording your first fee payment
                  </p>
                  <Button onClick={() => setRecordPaymentOpen(true)} className="mt-4">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={paymentColumns}
                  data={payments}
                  searchKey="studentName"
                  searchPlaceholder="Search by student name..."
                  additionalSearchKeys={['receiptNumber', 'categoryName']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outstanding Fees</CardTitle>
                  <CardDescription>
                    Students with pending or partial payments
                  </CardDescription>
                </div>
                {outstandingPayments && outstandingPayments.length > 0 && (
                  <Button variant="outline" onClick={handleExportOutstanding}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!outstandingPayments || outstandingPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">All fees are paid!</h3>
                  <p className="text-muted-foreground">
                    There are no outstanding fees at the moment
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={outstandingColumns}
                  data={outstandingPayments}
                  searchKey="studentName"
                  searchPlaceholder="Search by student name..."
                  additionalSearchKeys={['studentId', 'className']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Categories</CardTitle>
              <CardDescription>
                Manage fee categories (Tuition, Transport, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!categories || categories.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No fee categories</h3>
                  <p className="text-muted-foreground">
                    Create your first fee category to get started
                  </p>
                  <Button onClick={() => setAddCategoryOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={categoryColumns}
                  data={categories}
                  searchKey="categoryName"
                  searchPlaceholder="Search categories..."
                  additionalSearchKeys={['categoryCode']}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {schoolAdmin.schoolId && (
        <>
          <AddCategoryDialog
            open={addCategoryOpen}
            onOpenChange={setAddCategoryOpen}
            schoolId={schoolAdmin.schoolId}
          />

          <RecordPaymentDialog
            open={recordPaymentOpen}
            onOpenChange={setRecordPaymentOpen}
            schoolId={schoolAdmin.schoolId}
            schoolAdminName={schoolAdmin.name}
          />

          <BulkUploadCSVDialog
            open={bulkUploadOpen}
            onOpenChange={setBulkUploadOpen}
            schoolId={schoolAdmin.schoolId}
            collectedBy={schoolAdmin._id}
            collectedByName={schoolAdmin.name}
          />

          <AddDiscountDialog
            open={addDiscountOpen}
            onOpenChange={setAddDiscountOpen}
            schoolId={schoolAdmin.schoolId}
            createdBy={schoolAdmin._id}
          />

          <CreatePaymentPlanDialog
            open={createPlanOpen}
            onOpenChange={setCreatePlanOpen}
            schoolId={schoolAdmin.schoolId}
            createdBy={schoolAdmin._id}
          />

          <ApplyFeeStructureDialog
            open={applyStructureOpen}
            onOpenChange={setApplyStructureOpen}
            schoolId={schoolAdmin.schoolId}
            collectedBy={schoolAdmin._id}
            collectedByName={schoolAdmin.name}
          />

          <SendRemindersDialog
            open={sendRemindersOpen}
            onOpenChange={setSendRemindersOpen}
            schoolId={schoolAdmin.schoolId}
          />

          <CreateFeeStructureDialog
            open={createStructureOpen}
            onOpenChange={setCreateStructureOpen}
            schoolId={schoolAdmin.schoolId}
            createdBy={schoolAdmin._id}
          />

          <EditCategoryDialog
            open={editCategoryOpen}
            onOpenChange={setEditCategoryOpen}
            category={
              selectedCategory
                ? {
                    ...selectedCategory,
                    // Assuming selectedCategory._id is a string,
                    // and EditCategoryDialog expects _id: Id<"feeCategories">
                    // This will cast the string to match the expected type.
                    _id: { __tableName: "feeCategories" } as any,
                  }
                : null
            }
          />

          <DeleteCategoryDialog
            open={deleteCategoryOpen}
            onOpenChange={setDeleteCategoryOpen}
            category={
              selectedCategory
                ? {
                    ...selectedCategory,
                    _id: { __tableName: "feeCategories" } as any,
                  }
                : null
            }
          />

          <ViewCategoryDialog
            open={viewCategoryOpen}
            onOpenChange={setViewCategoryOpen}
            category={selectedCategory}
          />

          <ViewPaymentDialog
            open={viewPaymentOpen}
            onOpenChange={setViewPaymentOpen}
            payment={selectedPayment}
          />
        </>
      )}
    </div>
  );
}
