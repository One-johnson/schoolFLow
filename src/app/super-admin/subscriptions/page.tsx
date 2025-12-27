'use client';

import { JSX, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table';
import { toast } from 'sonner';
import { CheckCircle, DollarSign, Plus, MoreVertical, Eye, Edit, Trash } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Subscription {
  _id: Id<'subscriptions'>;
  schoolId: string;
  schoolName: string;
  plan: string;
  studentsCount: number;
  pricePerStudent: number;
  totalAmount: number;
  status: 'pending' | 'verified' | 'expired';
  paymentDate?: string;
  verifiedDate?: string;
  verifiedBy?: string;
}

interface SubscriptionPlan {
  _id: Id<'subscriptionPlans'>;
  name: string;
  description: string;
  pricePerStudent: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionsPage(): JSX.Element {
  const subscriptions = useQuery(api.subscriptions.list);
  const plans = useQuery(api.subscriptionPlans.list);
  const verifyPayment = useMutation(api.subscriptions.verifyPayment);
  const createPlan = useMutation(api.subscriptionPlans.create);
  const updatePlan = useMutation(api.subscriptionPlans.update);
  const deletePlan = useMutation(api.subscriptionPlans.remove);
  const createAuditLog = useMutation(api.auditLogs.create);

  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState<boolean>(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState<boolean>(false);
  const [isDeletePlanOpen, setIsDeletePlanOpen] = useState<boolean>(false);
  const [isViewPlanOpen, setIsViewPlanOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isViewSubscriptionOpen, setIsViewSubscriptionOpen] = useState<boolean>(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    pricePerStudent: '',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    features: '',
  });

  const resetPlanForm = (): void => {
    setPlanForm({
      name: '',
      description: '',
      pricePerStudent: '',
      billingCycle: 'monthly',
      features: '',
    });
  };

  const handleCreatePlan = async (): Promise<void> => {
    try {
      const features = planForm.features.split('\n').filter((f: string) => f.trim() !== '');
      await createPlan({
        name: planForm.name,
        description: planForm.description,
        pricePerStudent: parseFloat(planForm.pricePerStudent),
        billingCycle: planForm.billingCycle,
        features,
      });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Created Subscription Plan',
        entity: 'Subscription Plan',
        entityId: planForm.name,
        details: `Created plan: ${planForm.name}`,
        ipAddress: '192.168.1.1',
      });
      toast.success('Subscription plan created successfully');
      setIsCreatePlanOpen(false);
      resetPlanForm();
    } catch (error) {
      toast.error('Failed to create subscription plan');
    }
  };

  const handleEditPlan = async (): Promise<void> => {
    if (!selectedPlan) return;
    try {
      const features = planForm.features.split('\n').filter((f: string) => f.trim() !== '');
      await updatePlan({
        id: selectedPlan._id,
        name: planForm.name,
        description: planForm.description,
        pricePerStudent: parseFloat(planForm.pricePerStudent),
        billingCycle: planForm.billingCycle,
        features,
        isActive: selectedPlan.isActive,
      });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Updated Subscription Plan',
        entity: 'Subscription Plan',
        entityId: selectedPlan._id,
        details: `Updated plan: ${planForm.name}`,
        ipAddress: '192.168.1.1',
      });
      toast.success('Subscription plan updated successfully');
      setIsEditPlanOpen(false);
      setSelectedPlan(null);
      resetPlanForm();
    } catch (error) {
      toast.error('Failed to update subscription plan');
    }
  };

  const handleDeletePlan = async (): Promise<void> => {
    if (!selectedPlan) return;
    try {
      await deletePlan({ id: selectedPlan._id });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Deleted Subscription Plan',
        entity: 'Subscription Plan',
        entityId: selectedPlan._id,
        details: `Deleted plan: ${selectedPlan.name}`,
        ipAddress: '192.168.1.1',
      });
      toast.success('Subscription plan deleted successfully');
      setIsDeletePlanOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error('Failed to delete subscription plan');
    }
  };

  const openEditPlan = (plan: SubscriptionPlan): void => {
    setSelectedPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      pricePerStudent: plan.pricePerStudent.toString(),
      billingCycle: plan.billingCycle,
      features: plan.features.join('\n'),
    });
    setIsEditPlanOpen(true);
  };

  const openDeletePlan = (plan: SubscriptionPlan): void => {
    setSelectedPlan(plan);
    setIsDeletePlanOpen(true);
  };

  const openViewPlan = (plan: SubscriptionPlan): void => {
    setSelectedPlan(plan);
    setIsViewPlanOpen(true);
  };

  const openViewSubscription = (subscription: Subscription): void => {
    setSelectedSubscription(subscription);
    setIsViewSubscriptionOpen(true);
  };

  const handleVerifyPayment = async (id: Id<'subscriptions'>): Promise<void> => {
    try {
      await verifyPayment({ id, verifiedBy: 'super_admin' });
      await createAuditLog({
        userId: 'super_admin',
        userName: 'Super Admin',
        action: 'Verified Payment',
        entity: 'Subscription',
        entityId: id,
        details: 'Payment verified and processed',
        ipAddress: '192.168.1.1',
      });
      toast.success('Payment verified successfully');
    } catch (error) {
      toast.error('Failed to verify payment');
    }
  };

  const planColumns: ColumnDef<SubscriptionPlan>[] = useMemo(
    () => [
      createSelectColumn<SubscriptionPlan>(),
      {
        accessorKey: 'name',
        header: createSortableHeader('Plan Name'),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: createSortableHeader('Description'),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.original.description.substring(0, 50)}...
          </span>
        ),
      },
      {
        accessorKey: 'pricePerStudent',
        header: createSortableHeader('Price/Student'),
        cell: ({ row }) => `$${row.original.pricePerStudent}`,
      },
      {
        accessorKey: 'billingCycle',
        header: createSortableHeader('Billing Cycle'),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.billingCycle}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        header: createSortableHeader('Status'),
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openViewPlan(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditPlan(row.original)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeletePlan(row.original)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const subscriptionColumns: ColumnDef<Subscription>[] = useMemo(
    () => [
      createSelectColumn<Subscription>(),
      {
        accessorKey: 'schoolName',
        header: createSortableHeader('School Name'),
        cell: ({ row }) => <span className="font-medium">{row.original.schoolName}</span>,
      },
      {
        accessorKey: 'plan',
        header: createSortableHeader('Plan'),
      },
      {
        accessorKey: 'studentsCount',
        header: createSortableHeader('Students'),
      },
      {
        accessorKey: 'pricePerStudent',
        header: createSortableHeader('Price/Student'),
        cell: ({ row }) => `$${row.original.pricePerStudent}`,
      },
      {
        accessorKey: 'totalAmount',
        header: createSortableHeader('Total Amount'),
        cell: ({ row }) => `$${row.original.totalAmount.toLocaleString()}`,
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'verified'
                ? 'default'
                : row.original.status === 'pending'
                ? 'secondary'
                : 'outline'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'paymentDate',
        header: createSortableHeader('Payment Date'),
        cell: ({ row }) =>
          row.original.paymentDate ? new Date(row.original.paymentDate).toLocaleDateString() : 'N/A',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openViewSubscription(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {row.original.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleVerifyPayment(row.original._id)}
                    className="text-green-600 dark:text-green-400"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Payment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const handleExportPlans = (format: 'json' | 'csv' | 'pdf'): void => {
    if (plans) {
      if (format === 'json') {
        exportToJSON(plans, 'subscription_plans');
      } else if (format === 'csv') {
        exportToCSV(plans, 'subscription_plans');
      } else {
        exportToPDF(plans, 'subscription_plans', 'Subscription Plans Report');
      }
      toast.success(`Plans exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSubscriptions = (format: 'json' | 'csv' | 'pdf'): void => {
    if (subscriptions) {
      if (format === 'json') {
        exportToJSON(subscriptions, 'subscriptions');
      } else if (format === 'csv') {
        exportToCSV(subscriptions, 'subscriptions');
      } else {
        exportToPDF(subscriptions, 'subscriptions', 'Subscriptions Report');
      }
      toast.success(`Subscriptions exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSelectedPlans = (selected: SubscriptionPlan[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'plans_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[],'plans_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[], 'plans_selected', 'Selected Plans Report');
    }
    toast.success(`${selected.length} plan(s) exported as ${format.toUpperCase()}`);
  };

  const handleExportSelectedSubscriptions = (selected: Subscription[], format: 'json' | 'csv' | 'pdf'): void => {
    if (format === 'json') {
      exportToJSON(selected, 'subscriptions_selected');
    } else if (format === 'csv') {
      exportToCSV(selected as unknown as Record<string, unknown>[],'subscriptions_selected');
    } else {
      exportToPDF(selected as unknown as Record<string, unknown>[], 'subscriptions_selected', 'Selected Subscriptions Report');
    }
    toast.success(`${selected.length} subscription(s) exported as ${format.toUpperCase()}`);
  };

  if (!subscriptions || !plans) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalRevenue = subscriptions
    .filter((s) => s.status === 'verified')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const pendingRevenue = subscriptions
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions & Billing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage subscription plans and payment verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Revenue</p>
                <p className="text-2xl font-bold">${pendingRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Plans</p>
                <p className="text-2xl font-bold">
                  {plans.filter((p) => p.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">School Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plans ({plans.length})</CardTitle>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <FileDown className="h-4 w-4" />
                        Export All
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportPlans('json')}>
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPlans('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPlans('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={() => setIsCreatePlanOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={planColumns}
                data={plans}
                searchKey="name"
                searchPlaceholder="Search by plan name..."
                exportFormats={['json', 'csv', 'pdf']}
                onExport={handleExportSelectedPlans}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>School Subscriptions ({subscriptions.length})</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <FileDown className="h-4 w-4" />
                      Export All
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportSubscriptions('json')}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSubscriptions('csv')}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSubscriptions('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={subscriptionColumns}
                data={subscriptions}
                searchKey="schoolName"
                searchPlaceholder="Search by school..."
                exportFormats={['json', 'csv', 'pdf']}
                onExport={handleExportSelectedSubscriptions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan for schools</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g., Basic Plan, Premium Plan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Describe the plan features and benefits"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price Per Student ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={planForm.pricePerStudent}
                  onChange={(e) => setPlanForm({ ...planForm, pricePerStudent: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="billing">Billing Cycle</Label>
                <Select
                  value={planForm.billingCycle}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') =>
                    setPlanForm({ ...planForm, billingCycle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                placeholder="Student Management&#10;Teacher Portal&#10;Report Generation"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update subscription plan details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g., Basic Plan, Premium Plan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Describe the plan features and benefits"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price Per Student ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={planForm.pricePerStudent}
                  onChange={(e) => setPlanForm({ ...planForm, pricePerStudent: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-billing">Billing Cycle</Label>
                <Select
                  value={planForm.billingCycle}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') =>
                    setPlanForm({ ...planForm, billingCycle: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-features">Features (one per line)</Label>
              <Textarea
                id="edit-features"
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                placeholder="Student Management&#10;Teacher Portal&#10;Report Generation"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog open={isViewPlanOpen} onOpenChange={setIsViewPlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.name}</DialogTitle>
            <DialogDescription>{selectedPlan?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Per Student</p>
                <p className="text-2xl font-bold">${selectedPlan?.pricePerStudent}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</p>
                <Badge variant="outline" className="capitalize mt-1">
                  {selectedPlan?.billingCycle}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Features</p>
              <ul className="space-y-2">
                {selectedPlan?.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={selectedPlan?.isActive ? 'default' : 'secondary'} className="mt-1">
                  {selectedPlan?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm mt-1">
                  {selectedPlan?.updatedAt ? new Date(selectedPlan.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewPlanOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subscription Dialog */}
      <Dialog open={isViewSubscriptionOpen} onOpenChange={setIsViewSubscriptionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSubscription?.schoolName}</DialogTitle>
            <DialogDescription>Subscription Details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</p>
                <p className="text-lg font-semibold">{selectedSubscription?.plan}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <Badge
                  variant={
                    selectedSubscription?.status === 'verified'
                      ? 'default'
                      : selectedSubscription?.status === 'pending'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="mt-1"
                >
                  {selectedSubscription?.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Students Count</p>
                <p className="text-lg font-semibold">{selectedSubscription?.studentsCount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Per Student</p>
                <p className="text-lg font-semibold">${selectedSubscription?.pricePerStudent}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold">${selectedSubscription?.totalAmount.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Date</p>
                <p className="text-sm mt-1">
                  {selectedSubscription?.paymentDate
                    ? new Date(selectedSubscription.paymentDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              {selectedSubscription?.verifiedDate && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verified Date</p>
                  <p className="text-sm mt-1">
                    {new Date(selectedSubscription.verifiedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewSubscriptionOpen(false)}>
              Close
            </Button>
            {selectedSubscription?.status === 'pending' && (
              <Button onClick={() => {
                if (selectedSubscription) {
                  handleVerifyPayment(selectedSubscription._id);
                  setIsViewSubscriptionOpen(false);
                }
              }}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <AlertDialog open={isDeletePlanOpen} onOpenChange={setIsDeletePlanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscription plan &quot;{selectedPlan?.name}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
