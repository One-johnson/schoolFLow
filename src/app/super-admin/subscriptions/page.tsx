'use client';

import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { DataTable, createSortableHeader, createSelectColumn } from '../../../components/ui/data-table'
import { exportToJSON, exportToCSV, exportToPDF } from '../../../lib/exports';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { JSX } from 'react';

interface PlanForm {
  name: string;
  price: number;
  maxStudents: number;
  billingCycle: 'monthly' | 'termly';
  features: string;
}

interface SubscriptionTableRow {
  _id: string;
  schoolAdminEmail: string;
  type: string;
  planName: string;
  price: string;
  studentCapacity: string;
  trialEndDate: string;
  status: string;
  requestedDate: string;
}

export default function SubscriptionsPage(): React.JSX.Element {
  const subscriptionPlans = useQuery(api.subscriptionPlans.list);
  const subscriptionRequests = useQuery(api.subscriptionRequests.list);
  const createPlan = useMutation(api.subscriptionPlans.create);
  const updatePlan = useMutation(api.subscriptionPlans.update);
  const deletePlan = useMutation(api.subscriptionPlans.remove);
  const bulkDeleteRequests = useMutation(api.subscriptionRequests.bulkDelete);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState<boolean>(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = React.useState<Id<'subscriptionPlans'> | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<SubscriptionTableRow[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState<boolean>(false);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const [planForm, setPlanForm] = React.useState<PlanForm>({
    name: '',
    price: 0,
    maxStudents: 0,
    billingCycle: 'monthly' as 'monthly' | 'termly',
    features: '',
  });

  const selectedPlan = React.useMemo(() => {
    if (!selectedPlanId || !subscriptionPlans) return null;
    return subscriptionPlans.find((p) => p._id === selectedPlanId);
  }, [selectedPlanId, subscriptionPlans]);

  React.useEffect(() => {
    if (selectedPlan && isEditDialogOpen) {
      setPlanForm({
        name: selectedPlan.name,
        price: selectedPlan.price,
        maxStudents: selectedPlan.maxStudents,
        billingCycle: selectedPlan.billingCycle as 'monthly' | 'termly',
        features: selectedPlan.features.join(', '),
      });
    }
  }, [selectedPlan, isEditDialogOpen]);

  const handleCreatePlan = async (): Promise<void> => {
    if (!planForm.name || planForm.price <= 0 || planForm.maxStudents <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlan({
        name: planForm.name,
        price: planForm.price,
        maxStudents: planForm.maxStudents,
        billingCycle: planForm.billingCycle,
        features: planForm.features.split(',').map((f) => f.trim()).filter(Boolean),
      });
      toast.success('Subscription plan created successfully');
      setIsCreateDialogOpen(false);
      setPlanForm({
        name: '',
        price: 0,
        maxStudents: 0,
        billingCycle: 'monthly',
        features: '',
      });
    } catch (error) {
      toast.error('Failed to create subscription plan');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (): Promise<void> => {
    if (!selectedPlanId || !planForm.name || planForm.price <= 0 || planForm.maxStudents <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePlan({
        id: selectedPlanId,
        name: planForm.name,
        price: planForm.price,
        maxStudents: planForm.maxStudents,
        billingCycle: planForm.billingCycle,
        features: planForm.features.split(',').map((f) => f.trim()).filter(Boolean),
      });
      toast.success('Subscription plan updated successfully');
      setIsEditDialogOpen(false);
      setSelectedPlanId(null);
    } catch (error) {
      toast.error('Failed to update subscription plan');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (): Promise<void> => {
    if (!selectedPlanId) return;

    setIsSubmitting(true);
    try {
      await deletePlan({ id: selectedPlanId });
      toast.success('Subscription plan deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPlanId(null);
    } catch (error) {
      toast.error('Failed to delete subscription plan');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedRows.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const ids = selectedRows.map((row) => row._id as Id<'subscriptionRequests'>);
      await bulkDeleteRequests({ ids });
      toast.success(`${selectedRows.length} subscription(s) deleted successfully`);
      setIsBulkDeleteDialogOpen(false);
      setSelectedRows([]);
    } catch (error) {
      toast.error('Failed to delete subscriptions');
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getStatusBadge = (status: string): React.JSX.Element => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType }> = {
      approved: { variant: 'default', icon: CheckCircle2 },
      pending: { variant: 'secondary', icon: Clock },
      rejected: { variant: 'destructive', icon: XCircle },
      expired: { variant: 'outline', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp || isNaN(timestamp)) {
      return 'N/A';
    }
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Transform subscription requests to table data
  const tableData = React.useMemo((): SubscriptionTableRow[] => {
    if (!subscriptionRequests || !subscriptionPlans) return [];
    
    return subscriptionRequests.map((request) => {
      const plan = subscriptionPlans.find((p) => p._id === request.planId);
      const isTrial = request.isTrial || false;
      
      return {
        _id: request._id,
        schoolAdminEmail: request.schoolAdminEmail,
        type: isTrial ? 'Trial' : 'Paid',
        planName: plan?.name || 'N/A',
        price: `₵${plan?.price || 0}`,
        studentCapacity: `${plan?.maxStudents || 0} students`,
        trialEndDate: isTrial && request.trialEndDate ? formatDate(Number(request.trialEndDate)) : 'N/A',
        status: request.status,
        requestedDate: formatDate(Number(request._creationTime)),
      };
    });
  }, [subscriptionRequests, subscriptionPlans]);

  // Filter data by status
  const filteredTableData = React.useMemo(() => {
    if (statusFilter === 'all') return tableData;
    return tableData.filter((row) => row.status === statusFilter);
  }, [tableData, statusFilter]);

  // Define columns for the data table
  const columns: ColumnDef<SubscriptionTableRow>[] = React.useMemo(
    () => [
      createSelectColumn<SubscriptionTableRow>(),
      {
        accessorKey: 'schoolAdminEmail',
        header: createSortableHeader('School Admin'),
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.schoolAdminEmail}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: createSortableHeader('Type'),
        cell: ({ row }) => (
          row.original.type === 'Trial' ? (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Trial
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1">
              <DollarSign className="h-3 w-3" />
              Paid
            </Badge>
          )
        ),
      },
      {
        accessorKey: 'planName',
        header: createSortableHeader('Plan'),
        cell: ({ row }) => <span className="text-sm">{row.original.planName}</span>,
      },
      {
        accessorKey: 'price',
        header: createSortableHeader('Price'),
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.price}</span>,
      },
      {
        accessorKey: 'studentCapacity',
        header: createSortableHeader('Student Capacity'),
        cell: ({ row }) => <span className="text-sm">{row.original.studentCapacity}</span>,
      },
      {
        accessorKey: 'trialEndDate',
        header: createSortableHeader('Trial End Date'),
        cell: ({ row }) => (
          row.original.trialEndDate !== 'N/A' ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-sm">{row.original.trialEndDate}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">N/A</span>
          )
        ),
      },
      {
        accessorKey: 'status',
        header: createSortableHeader('Status'),
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'requestedDate',
        header: createSortableHeader('Requested'),
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.requestedDate}</span>,
      },
    ],
    []
  );

  // Export handlers
  const handleExportAll = (format: 'json' | 'csv' | 'pdf'): void => {
    if (filteredTableData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exportData = filteredTableData.map(({ _id, ...rest }) => rest);
      if (format === 'json') {
        exportToJSON(exportData, 'school_subscriptions');
      } else if (format === 'csv') {
        exportToCSV(exportData, 'school_subscriptions');
      } else {
        exportToPDF(exportData, 'school_subscriptions', 'School Subscriptions Report');
      }
      toast.success(`Subscriptions exported as ${format.toUpperCase()}`);
    }
  };

  const handleExportSelected = (selected: SubscriptionTableRow[], format: 'json' | 'csv' | 'pdf'): void => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const exportData = selected.map(({ _id, ...rest }) => rest);
    if (format === 'json') {
      exportToJSON(exportData, 'school_subscriptions_selected');
    } else if (format === 'csv') {
      exportToCSV(exportData, 'school_subscriptions_selected');
    } else {
      exportToPDF(exportData, 'school_subscriptions_selected', 'Selected School Subscriptions Report');
    }
    toast.success(`${selected.length} subscription(s) exported as ${format.toUpperCase()}`);
  };

  if (!subscriptionPlans || !subscriptionRequests) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">Manage subscription plans and track school subscriptions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>Add a new subscription plan for schools</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Basic Plan"
                    value={planForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlanForm({ ...planForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₵)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={planForm.price || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    placeholder="100"
                    value={planForm.maxStudents || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlanForm({ ...planForm, maxStudents: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select
                    value={planForm.billingCycle}
                    onValueChange={(value: 'monthly' | 'termly') =>
                      setPlanForm({ ...planForm, billingCycle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="termly">Termly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  placeholder="e.g., Student Management, Attendance Tracking, Reports"
                  value={planForm.features}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPlanForm({ ...planForm, features: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Plan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription Plans
            <Badge variant="secondary">{subscriptionPlans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <Users className="h-4 w-4" />
            School Subscriptions
            <Badge variant="secondary">{subscriptionRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {subscriptionPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No Subscription Plans</h3>
                <p className="mt-2 text-center text-gray-600">
                  Get started by creating your first subscription plan
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <Card key={plan._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="mt-2">
                          <span className="text-3xl font-bold text-gray-900">₵{plan.price}</span>
                          <span className="text-gray-600">/{plan.billingCycle}</span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Dialog open={isEditDialogOpen && selectedPlanId === plan._id} onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (open) setSelectedPlanId(plan._id);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Subscription Plan</DialogTitle>
                              <DialogDescription>Update the subscription plan details</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Plan Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={planForm.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setPlanForm({ ...planForm, name: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-price">Price (₵)</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={planForm.price || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-maxStudents">Max Students</Label>
                                  <Input
                                    id="edit-maxStudents"
                                    type="number"
                                    value={planForm.maxStudents || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setPlanForm({ ...planForm, maxStudents: parseInt(e.target.value) || 0 })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
                                  <Select
                                    value={planForm.billingCycle}
                                    onValueChange={(value: 'monthly' | 'termly') =>
                                      setPlanForm({ ...planForm, billingCycle: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="termly">Termly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-features">Features (comma-separated)</Label>
                                <Input
                                  id="edit-features"
                                  value={planForm.features}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPlanForm({ ...planForm, features: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedPlanId(null);
                              }}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdatePlan} disabled={isSubmitting}>
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update Plan'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={isDeleteDialogOpen && selectedPlanId === plan._id} onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (open) setSelectedPlanId(plan._id);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Subscription Plan</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this plan? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setSelectedPlanId(null);
                              }}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDeletePlan} disabled={isSubmitting}>
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Up to {plan.maxStudents} students</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-900">Features:</p>
                        <ul className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>School Subscriptions</CardTitle>
                  <CardDescription>Track all school subscription requests and trial periods</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-45">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2" disabled={filteredTableData.length === 0}>
                        <FileDown className="h-4 w-4" />
                        Export All
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleExportAll('json')}>Export as JSON</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportAll('csv')}>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportAll('pdf')}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No Subscriptions Yet</h3>
                  <p className="mt-2 text-center text-gray-600">
                    School subscription requests will appear here
                  </p>
                </div>
              ) : (
                <>
                  {selectedRows.length > 0 && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {selectedRows.length} subscription(s) selected
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                  <DataTable
                    columns={columns}
                    data={filteredTableData}
                    searchKey="schoolAdminEmail"
                    searchPlaceholder="Search by email..."
                    exportFormats={['json', 'csv', 'pdf']}
                    onExport={handleExportSelected}
                    onSelectionChange={setSelectedRows}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriptions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} subscription(s)? This will:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Remove the subscription records permanently</li>
                <li>Deactivate associated school admin accounts</li>
                <li>Send notifications to affected users</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedRows.length} Subscription(s)
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
