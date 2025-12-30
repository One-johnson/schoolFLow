'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  School, 
  CreditCard, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Bell,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function SchoolAdminDashboard(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  
  // Use getByEmail for more efficient querying
  const currentAdmin = useQuery(
    api.schoolAdmins.getByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  const subscriptionRequests = useQuery(
    api.subscriptionRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip'
  );

  const notifications = useQuery(
    api.notifications.list,
    currentAdmin ? {} : 'skip'
  );

  const activeSubscription = subscriptionRequests?.find(
    (req) => req.status === 'approved' && !req.isTrial
  );
  
  const activeTrial = subscriptionRequests?.find(
    (req) => req.status === 'approved' && req.isTrial
  );

  const approvedSchool = schoolCreationRequests?.find((req) => req.status === 'approved');
  const pendingSchoolRequest = schoolCreationRequests?.find((req) => req.status === 'pending');

  const unreadNotifications = notifications?.filter((n) => !n.read).length || 0;

  // Redirect to subscription if no active subscription
  useEffect(() => {
    if (currentAdmin && !currentAdmin.hasActiveSubscription) {
      router.push('/school-admin/subscription');
    }
  }, [currentAdmin, router]);

  useEffect(() => {
    if (currentAdmin && currentAdmin.hasActiveSubscription && !currentAdmin.hasCreatedSchool) {
      if (!pendingSchoolRequest) {
        router.push('/school-admin/create-school');
      }
    }
  }, [currentAdmin, schoolCreationRequests, router, pendingSchoolRequest]);

  // Handle case where admin record doesn't exist
  if (currentAdmin === undefined) {
    // Still loading
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Loading Dashboard</h2>
            <p className="text-muted-foreground">Please wait while we load your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentAdmin === null) {
    // Admin record doesn't exist - redirect to subscription page
    router.push('/school-admin/subscription');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Setting Up Your Account</h2>
            <p className="text-muted-foreground">Redirecting you to get started...</p>
          </div>
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

  const calculateTrialProgress = (): number => {
    if (!activeTrial || !activeTrial.trialStartDate || !activeTrial.trialEndDate) return 0;
    
    const start = new Date(activeTrial.trialStartDate).getTime();
    const end = new Date(activeTrial.trialEndDate).getTime();
    const now = Date.now();
    
    const totalDuration = end - start;
    const elapsed = now - start;
    
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const getDaysRemaining = (): number => {
    if (!activeTrial || !activeTrial.trialEndDate) return 0;
    
    const end = new Date(activeTrial.trialEndDate).getTime();
    const now = Date.now();
    const diff = end - now;
    
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {currentAdmin.name}</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your school today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/school-admin/notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Trial Warning */}
      {activeTrial && getDaysRemaining() <= 7 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">
                Trial ending soon: {getDaysRemaining()} days remaining
              </p>
              <p className="text-sm text-yellow-700">
                Upgrade to a paid plan to continue using SchoolFlow without interruption
              </p>
            </div>
            <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              <Link href="/school-admin/subscription">Upgrade Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{getStatusBadge(currentAdmin.status)}</div>
            <p className="text-xs text-muted-foreground">
              School ID: {currentAdmin.schoolId}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {activeSubscription ? activeSubscription.planName : activeTrial ? 'Trial' : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTrial && activeTrial.trialEndDate
                ? `${getDaysRemaining()} days remaining`
                : activeSubscription
                ? 'Active subscription'
                : 'No active subscription'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Status</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {approvedSchool ? 'Active' : pendingSchoolRequest ? 'Pending' : 'Not Created'}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedSchool 
                ? approvedSchool.schoolName 
                : pendingSchoolRequest 
                ? 'Awaiting approval' 
                : 'Create your school'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {approvedSchool?.studentCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Progress */}
      {activeTrial && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trial Period Progress
            </CardTitle>
            <CardDescription>
              {getDaysRemaining()} days remaining out of 30-day trial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={calculateTrialProgress()} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Started: {activeTrial.trialStartDate ? new Date(activeTrial.trialStartDate).toLocaleDateString() : 'N/A'}</span>
              <span>Ends: {activeTrial.trialEndDate ? new Date(activeTrial.trialEndDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {!currentAdmin.hasActiveSubscription && (
                <Button asChild className="w-full justify-start">
                  <Link href="/school-admin/subscription">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Select Subscription Plan
                    <ArrowUpRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              )}
              
              {currentAdmin.hasActiveSubscription && !currentAdmin.hasCreatedSchool && !pendingSchoolRequest && (
                <Button asChild className="w-full justify-start">
                  <Link href="/school-admin/create-school">
                    <School className="mr-2 h-4 w-4" />
                    Create Your School
                    <ArrowUpRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              )}

              {currentAdmin.hasCreatedSchool && (
                <>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/school-admin/school">
                      <School className="mr-2 h-4 w-4" />
                      Manage School
                      <ArrowUpRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/school-admin/subscription">
                      <CreditCard className="mr-2 h-4 w-4" />
                      View Subscription
                      <ArrowUpRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/school-admin/profile">
                      <Users className="mr-2 h-4 w-4" />
                      Update Profile
                      <ArrowUpRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Subscription Details
            </CardTitle>
            <CardDescription>Your current plan information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(activeSubscription || activeTrial) ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan Type</span>
                  <span className="font-medium">
                    {activeSubscription ? activeSubscription.planName : 'Free Trial'}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Students</span>
                  <span className="font-medium">
                    {(activeSubscription || activeTrial)?.studentsCount || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    ${(activeSubscription || activeTrial)?.totalAmount || 0}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge((activeSubscription || activeTrial)?.status || 'pending')}
                </div>
                <Button asChild className="w-full mt-4">
                  <Link href="/school-admin/subscription">
                    View Full Details
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  No active subscription found
                </p>
                <Button asChild>
                  <Link href="/school-admin/subscription">
                    Choose a Plan
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/school-admin/notifications">
                View All
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptionRequests && subscriptionRequests.length > 0 ? (
              subscriptionRequests.slice(0, 5).map((request) => (
                <div key={request._id} className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0">
                  <div className="flex-shrink-0 mt-1">
                    {request.status === 'approved' ? (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ) : request.status === 'pending_approval' || request.status === 'pending_payment' ? (
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      Subscription Request: {request.planName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.isTrial ? 'Free Trial' : `$${request.totalAmount}`} • {new Date(request.createdAt).toLocaleDateString()}
                    </p>
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
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your activity will appear here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
