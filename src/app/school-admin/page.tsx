'use client';

import { JSX, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  School, 
  CreditCard, 
  Users, 
  CheckCircle,
  GraduationCap,
  Calendar,
  Bell,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatsCard } from '@/components/school-admin/stats-card';
import { FinancialOverviewCard } from '@/components/school-admin/financial-overview-card';
import { UpcomingEventsCard } from '@/components/school-admin/upcoming-events-card';
import { AlertsCard } from '@/components/school-admin/alerts-card';
import { ActivityFeedCard } from '@/components/school-admin/activity-feed-card';
import { ChartsSection } from '@/components/school-admin/charts-section';
import { PerformanceMetricsCard } from '@/components/school-admin/performance-metrics-card';
import { QuickActionsGrid } from '@/components/school-admin/quick-actions-grid';

export default function SchoolAdminDashboard(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  
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

  const dashboardStats = useQuery(
    api.dashboard.getDashboardStats,
    currentAdmin?.schoolId ? { schoolId: currentAdmin.schoolId } : 'skip'
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

  if (currentAdmin === undefined) {
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

      {/* Enhanced Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Teachers"
          value={dashboardStats?.teachersCount || 0}
          icon={GraduationCap}
          description="Total teaching staff"
          loading={!dashboardStats}
          colorClass="text-purple-600"
        />
        <StatsCard
          title="Students"
          value={dashboardStats?.studentsCount || approvedSchool?.studentCount || 0}
          icon={Users}
          description="Total enrolled students"
          loading={!dashboardStats}
          colorClass="text-blue-600"
        />
        <StatsCard
          title="Classes"
          value={dashboardStats?.classesCount || 0}
          icon={School}
          description="Active classes"
          loading={!dashboardStats}
          colorClass="text-green-600"
        />
        <StatsCard
          title="Upcoming Events"
          value={dashboardStats?.upcomingEvents || 0}
          icon={Calendar}
          description="Events this week"
          loading={!dashboardStats}
          colorClass="text-orange-600"
        />
        <StatsCard
          title="Fee Collection Rate"
          value={dashboardStats ? `${dashboardStats.feeCollectionRate}%` : '0%'}
          icon={TrendingUp}
          description="Payment completion"
          loading={!dashboardStats}
          colorClass="text-green-600"
        />
        <StatsCard
          title="Outstanding Payments"
          value={dashboardStats ? `$${dashboardStats.outstandingPayments.toLocaleString()}` : '$0'}
          icon={DollarSign}
          description="Pending fee payments"
          loading={!dashboardStats}
          colorClass="text-orange-600"
        />
        <StatsCard
          title="Active Timetables"
          value={dashboardStats?.activeTimetables || 0}
          icon={CalendarDays}
          description="Published schedules"
          loading={!dashboardStats}
          colorClass="text-pink-600"
        />
        <StatsCard
          title="Account Status"
          value={currentAdmin.status}
          icon={CheckCircle}
          description={`School ID: ${currentAdmin.schoolId}`}
          colorClass="text-green-600"
        />
      </div>

      {/* Trial Progress */}
      {activeTrial && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Trial Period Progress
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDaysRemaining()} days remaining out of 30-day trial
                  </p>
                </div>
              </div>
              <Progress value={calculateTrialProgress()} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Started: {activeTrial.trialStartDate ? new Date(activeTrial.trialStartDate).toLocaleDateString() : 'N/A'}</span>
                <span>Ends: {activeTrial.trialEndDate ? new Date(activeTrial.trialEndDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          {currentAdmin.schoolId && (
            <>
              <FinancialOverviewCard schoolId={currentAdmin.schoolId} />
              <PerformanceMetricsCard schoolId={currentAdmin.schoolId} />
            </>
          )}
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {currentAdmin.schoolId && (
            <>
              <ChartsSection schoolId={currentAdmin.schoolId} />
              <ActivityFeedCard schoolId={currentAdmin.schoolId} />
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {currentAdmin.schoolId && (
            <>
              <UpcomingEventsCard schoolId={currentAdmin.schoolId} />
              <AlertsCard schoolId={currentAdmin.schoolId} />
            </>
          )}
          <QuickActionsGrid hasCreatedSchool={!!currentAdmin.hasCreatedSchool} />
        </div>
      </div>

      {/* Subscription Details - Keep for reference */}
      {(activeSubscription || activeTrial) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Subscription Details
              </h3>
              <Button asChild variant="outline" size="sm">
                <Link href="/school-admin/subscription">
                  Manage
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Plan Type</span>
                <p className="font-medium mt-1">
                  {activeSubscription ? activeSubscription.planName : 'Free Trial'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Students</span>
                <p className="font-medium mt-1">
                  {(activeSubscription || activeTrial)?.studentsCount || 0}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Amount</span>
                <p className="font-medium mt-1">
                  ${(activeSubscription || activeTrial)?.totalAmount || 0}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="mt-1">
                  {getStatusBadge((activeSubscription || activeTrial)?.status || 'pending')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
