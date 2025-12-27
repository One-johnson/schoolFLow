'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { School, CreditCard, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function SchoolAdminDashboard(): JSX.Element {
  const router = useRouter();

  // Get school admin data - In a real app, this would come from authentication
  const schoolAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('schoolAdminEmail') : null;
  
  const schoolAdmins = useQuery(api.schoolAdmins.list);
  const currentAdmin = schoolAdmins?.find((admin) => admin.email === schoolAdminEmail);

  const subscriptionRequests = useQuery(
    api.subscriptionRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const activeSubscription = subscriptionRequests?.find(
    (req) => req.status === 'approved' && !req.isTrial
  );
  
  const activeTrial = subscriptionRequests?.find(
    (req) => req.status === 'approved' && req.isTrial
  );

  const approvedSchool = schoolCreationRequests?.find((req) => req.status === 'approved');

  useEffect(() => {
    if (!schoolAdminEmail) {
      router.push('/login');
    }
  }, [schoolAdminEmail, router]);

  // Check if admin needs to select subscription
  useEffect(() => {
    if (currentAdmin && !currentAdmin.hasActiveSubscription) {
      router.push('/school-admin/subscription');
    }
  }, [currentAdmin, router]);

  // Check if admin needs to create school
  useEffect(() => {
    if (currentAdmin && currentAdmin.hasActiveSubscription && !currentAdmin.hasCreatedSchool) {
      const pendingSchool = schoolCreationRequests?.find((req) => req.status === 'pending');
      if (!pendingSchool) {
        router.push('/school-admin/create-school');
      }
    }
  }, [currentAdmin, schoolCreationRequests, router]);

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string): JSX.Element => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      suspended: { label: 'Suspended', variant: 'destructive' },
      inactive: { label: 'Inactive', variant: 'outline' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentAdmin.name}</h1>
        <p className="text-muted-foreground">
          Manage your school and monitor your subscription
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(currentAdmin.status)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              School ID: {currentAdmin.schoolId}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSubscription ? activeSubscription.planName : activeTrial ? 'Trial' : 'None'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTrial && activeTrial.trialEndDate
                ? `Expires: ${new Date(activeTrial.trialEndDate).toLocaleDateString()}`
                : activeSubscription
                ? 'Active subscription'
                : 'No active subscription'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Status</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedSchool ? 'Created' : 'Not Created'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedSchool ? approvedSchool.schoolName : 'Create your school'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              0
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {!currentAdmin.hasActiveSubscription && (
              <Button asChild className="w-full">
                <Link href="/school-admin/subscription">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Select Subscription Plan
                </Link>
              </Button>
            )}
            
            {currentAdmin.hasActiveSubscription && !currentAdmin.hasCreatedSchool && (
              <Button asChild className="w-full">
                <Link href="/school-admin/create-school">
                  <School className="mr-2 h-4 w-4" />
                  Create Your School
                </Link>
              </Button>
            )}

            {currentAdmin.hasCreatedSchool && (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/school-admin/school">
                    <School className="mr-2 h-4 w-4" />
                    Manage School
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/school-admin/subscription">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View Subscription
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions and requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptionRequests && subscriptionRequests.length > 0 ? (
              subscriptionRequests.slice(0, 3).map((request) => (
                <div key={request._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    {request.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : request.status === 'pending_approval' || request.status === 'pending_payment' ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">Subscription: {request.planName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    request.status === 'approved' ? 'default' : 
                    request.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
