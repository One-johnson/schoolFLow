'use client';

import { useMemo } from 'react';
import { filterAuditLogsToSuperAdminActivity } from '@/lib/super-admin-audit';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  School,
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  BarChart as BarChartIcon,
  Building2,
  LifeBuoy,
  Bell,
  ShieldAlert,
  Link2,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const TYPE_PIE_COLORS = ['#4f46e5', '#059669'];

export default function SuperAdminDashboardPage(): React.JSX.Element {
  const stats = useQuery(api.schools.getDashboardStats);
  const overview = useQuery(api.superAdminDashboard.getOverview);
  const chartData = useQuery(api.schools.getDashboardChartData);
  const allAuditLogs = useQuery(api.auditLogs.list);
  const superAdmins = useQuery(api.superAdmins.list);
  const schools = useQuery(api.schools.list);

  const revenueData = useMemo(() => {
    if (!chartData?.revenueByMonth || !chartData.enrollmentByMonth) return [];
    return chartData.revenueByMonth.map((r, i) => {
      const e = chartData.enrollmentByMonth[i];
      return {
        month: r.month,
        revenue: r.revenue,
        revenuePrivate: r.revenuePrivate ?? 0,
        revenuePublic: r.revenuePublic ?? 0,
        students: e?.enrolled ?? 0,
        studentsPrivate: e?.enrolledPrivate ?? 0,
        studentsPublic: e?.enrolledPublic ?? 0,
      };
    });
  }, [chartData]);

  const schoolGrowthData = useMemo(() => {
    if (!chartData?.schoolGrowthByMonth) return [];
    return chartData.schoolGrowthByMonth.map((g) => ({
      month: g.month,
      active: g.active,
      pending: g.pending,
      activePrivate: g.activePrivate ?? 0,
      activePublic: g.activePublic ?? 0,
      pendingPrivate: g.pendingPrivate ?? 0,
      pendingPublic: g.pendingPublic ?? 0,
    }));
  }, [chartData]);

  const statusData = useMemo(() => {
    if (!schools) return [];
    const statusCounts = schools.reduce((acc: Record<string, number>, school) => {
      acc[school.status] = (acc[school.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));
  }, [schools]);

  const enrollmentData = useMemo(() => {
    if (!chartData?.enrollmentByMonth) return [];
    return chartData.enrollmentByMonth.map((e) => ({
      month: e.month,
      enrolled: e.enrolled,
      enrolledPrivate: e.enrolledPrivate ?? 0,
      enrolledPublic: e.enrolledPublic ?? 0,
      target: e.target,
    }));
  }, [chartData]);

  const schoolTypePieData = useMemo(() => {
    if (!stats?.bySchoolType) return [];
    return [
      { name: 'Private schools', value: stats.bySchoolType.private.totalSchools },
      { name: 'Public schools', value: stats.bySchoolType.public.totalSchools },
    ].filter((x) => x.value > 0);
  }, [stats]);

  const recentSuperAdminActivity = useMemo(() => {
    if (!allAuditLogs || !superAdmins) return [];
    const ids = superAdmins.map((a) => a._id as string);
    return filterAuditLogsToSuperAdminActivity(allAuditLogs, ids).slice(0, 15);
  }, [allAuditLogs, superAdmins]);

  const hasRevenueData = revenueData.some(
    (d) =>
      d.revenue > 0 ||
      d.revenuePrivate > 0 ||
      d.revenuePublic > 0 ||
      d.studentsPrivate > 0 ||
      d.studentsPublic > 0
  );
  const hasSchoolGrowthData = schoolGrowthData.some(
    (d) =>
      d.active > 0 ||
      d.pending > 0 ||
      (d.activePrivate ?? 0) > 0 ||
      (d.activePublic ?? 0) > 0 ||
      (d.pendingPrivate ?? 0) > 0 ||
      (d.pendingPublic ?? 0) > 0
  );
  const hasEnrollmentData = enrollmentData.some(
    (d) => d.enrolled > 0 || (d.enrolledPrivate ?? 0) > 0 || (d.enrolledPublic ?? 0) > 0
  );
  const showEnrollmentTarget = enrollmentData.some((d) => d.target > 0);

  if (!stats) {
    return (
      <div className="min-w-0 max-w-full space-y-6">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentActivity = recentSuperAdminActivity;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Schools"
          value={stats.totalSchools.toString()}
          icon={School}
          trend={`${stats.activeSchools} active`}
        />
        <StatsCard
          title="Active Schools"
          value={stats.activeSchools.toString()}
          icon={TrendingUp}
          trend={`${stats.pendingApproval} pending`}
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          icon={GraduationCap}
          trend="Across all schools"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="Current month"
        />
        <StatsCard
          title="Active Admins"
          value={stats.activeAdmins.toString()}
          icon={Users}
          trend="School administrators"
        />
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments.toString()}
          icon={AlertCircle}
          trend="Awaiting verification"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingApproval.toString()}
          icon={School}
          trend="Schools awaiting approval"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="All time"
        />
      </div>

      {stats && !overview && (
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="min-w-0 overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {overview && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Operations</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Support queue, subscription pipeline, and platform alerts in one place.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">Support tickets</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Open pipeline (not resolved or closed)
                  </p>
                </div>
                <LifeBuoy className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-semibold tabular-nums">{overview.support.activeTotal}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Unassigned</p>
                    <p className="text-lg font-semibold tabular-nums">{overview.support.unassignedActive}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Urgent</p>
                    <p className="text-lg font-semibold tabular-nums text-destructive">
                      {overview.support.urgentActive}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="text-lg font-semibold tabular-nums">{overview.support.highPriorityActive}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Open {overview.support.open} · In progress {overview.support.inProgress} · Waiting on customer{' '}
                  {overview.support.waitingCustomer}
                </p>
                <Link
                  href="/super-admin/support"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open support
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">Billing &amp; onboarding</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Subscriptions, proofs, and new school requests
                  </p>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-2">
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Sub · pending payment</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.subscriptionPendingPayment}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Sub · pending approval</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.subscriptionPendingApproval}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Trial requests (pipeline)</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.trialRequests}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Payment proofs</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.paymentProofsPending}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-muted-foreground">New school requests</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.schoolCreationPending}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-t border-border pt-2">
                    <span className="text-muted-foreground">Expired subscriptions (records)</span>
                    <span className="font-medium tabular-nums">{overview.pipeline.subscriptionExpired}</span>
                  </li>
                </ul>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href="/super-admin/subscriptions"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Subscriptions
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/super-admin/approvals?tab=payments"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Approvals
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/super-admin/trial-management"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Trials
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-semibold">Notifications &amp; security</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Super admin inbox and failed sign-ins (24h)
                  </p>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <ShieldAlert
                    className={`h-8 w-8 shrink-0 ${overview.security.failedLogins24h > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Failed logins (24h)</p>
                    <p className="text-2xl font-semibold tabular-nums">{overview.security.failedLogins24h}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unread for super admins</span>
                  <span className="font-semibold tabular-nums">{overview.notifications.unread}</span>
                </div>
                {overview.notifications.recent.length > 0 && (
                  <ul className="space-y-2 border-t border-border pt-3">
                    {overview.notifications.recent.slice(0, 4).map((n) => (
                      <li key={n._id} className="min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(n.timestamp).toLocaleString()}
                          {!n.read ? ' · Unread' : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href="/super-admin/notifications"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    All notifications
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/super-admin/activity"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Login activity
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Quick links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/super-admin/approvals"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  Approvals center
                </Link>
                <Link
                  href="/super-admin/schools"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  All schools
                </Link>
                <Link
                  href="/super-admin/audit-logs"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  Audit logs
                </Link>
                <Link
                  href="/super-admin/reports"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/super-admin/settings"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/super-admin/school-admins"
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60 transition-colors"
                >
                  School admins
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats.bySchoolType && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Private vs public schools</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Each value is <span className="font-medium text-gray-700 dark:text-gray-300">private · public</span>.
              Revenue uses verified subscriptions tied to each school&apos;s ID.
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              title="Schools"
              value={`${stats.bySchoolType.private.totalSchools} · ${stats.bySchoolType.public.totalSchools}`}
              trend="Private · public"
              icon={School}
            />
            <StatsCard
              title="Active"
              value={`${stats.bySchoolType.private.activeSchools} · ${stats.bySchoolType.public.activeSchools}`}
              trend="Active schools"
              icon={TrendingUp}
            />
            <StatsCard
              title="Students"
              value={`${stats.bySchoolType.private.totalStudents.toLocaleString()} · ${stats.bySchoolType.public.totalStudents.toLocaleString()}`}
              trend="In active schools"
              icon={GraduationCap}
            />
            <StatsCard
              title="Monthly revenue"
              value={`$${stats.bySchoolType.private.monthlyRevenue.toLocaleString()} · $${stats.bySchoolType.public.monthlyRevenue.toLocaleString()}`}
              trend="This month"
              icon={DollarSign}
            />
            <StatsCard
              title="Pending approval"
              value={`${stats.bySchoolType.private.pendingApproval} · ${stats.bySchoolType.public.pendingApproval}`}
              trend="Awaiting approval"
              icon={Building2}
            />
            <StatsCard
              title="Active admins"
              value={`${stats.bySchoolType.private.activeAdmins} · ${stats.bySchoolType.public.activeAdmins}`}
              trend="By school type"
              icon={Users}
            />
          </div>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue & students by type</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Stacked revenue (private + public); lines show active student counts by type.
            </p>
          </CardHeader>
          <CardContent className="min-w-0">
            {!hasRevenueData ? (
              <div className="flex flex-col items-center justify-center h-75 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-linear-to-br from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-6 rounded-full shadow-lg">
                    <DollarSign className="h-12 w-12 text-green-600 dark:text-green-400 animate-bounce" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No revenue or enrollment data yet</p>
              </div>
            ) : (
              <div className="min-w-0 w-full">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenuePrivate"
                    stackId="rev"
                    stroke="#1e40af"
                    fill="#3b82f6"
                    fillOpacity={0.85}
                    name="Revenue private ($)"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenuePublic"
                    stackId="rev"
                    stroke="#047857"
                    fill="#34d399"
                    fillOpacity={0.85}
                    name="Revenue public ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="studentsPrivate"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    name="Students (private)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="studentsPublic"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={false}
                    name="Students (public)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>New schools by month</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Stacked counts for schools first registered in each month, by type.
            </p>
          </CardHeader>
          <CardContent className="min-w-0">
            {!hasSchoolGrowthData ? (
              <div className="flex flex-col items-center justify-center h-75 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-full shadow-lg">
                    <BarChartIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-bounce" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No growth data yet</p>
              </div>
            ) : (
              <div className="min-w-0 w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schoolGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activePrivate" stackId="active" fill="#1d4ed8" name="Active (private)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activePublic" stackId="active" fill="#93c5fd" name="Active (public)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendingPrivate" stackId="pending" fill="#b45309" name="Pending (private)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendingPublic" stackId="pending" fill="#fcd34d" name="Pending (public)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>School status (all)</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="min-w-0 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Schools by type</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">All registered schools (private vs public).</p>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="min-w-0 w-full">
            {schoolTypePieData.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center text-sm text-muted-foreground">
                No schools to chart yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={schoolTypePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {schoolTypePieData.map((entry, index) => (
                      <Cell key={`type-${entry.name}`} fill={TYPE_PIE_COLORS[index % TYPE_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle>Student enrollment by type</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Active student totals over time (cumulative by month-end), split private vs public.
            </p>
          </CardHeader>
          <CardContent className="min-w-0">
            {!hasEnrollmentData ? (
              <div className="flex flex-col items-center justify-center h-75 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-full shadow-lg">
                    <GraduationCap className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-bounce" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No enrollment data yet</p>
              </div>
            ) : (
              <div className="min-w-0 w-full">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="enrolledPrivate"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    name="Students (private)"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolledPublic"
                    stroke="#059669"
                    strokeWidth={2}
                    name="Students (public)"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolled"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    name="Total"
                    dot={false}
                  />
                  {showEnrollmentTarget && (
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Recent super admin activity</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log._id} className="flex min-w-0 items-start gap-4">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-blue-600 mt-2" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{log.details}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="space-y-4">
              {overview && overview.support.activeTotal > 0 && (
                <Link
                  href="/super-admin/support"
                  className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-violet-900 dark:text-violet-200">Support queue</p>
                    <p className="text-xs text-violet-700 dark:text-violet-300">
                      {overview.support.activeTotal} active ticket(s)
                      {overview.support.unassignedActive > 0
                        ? ` · ${overview.support.unassignedActive} unassigned`
                        : ''}
                    </p>
                  </div>
                  <LifeBuoy className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                </Link>
              )}
              {stats.pendingPayments > 0 && (
                <Link
                  href="/super-admin/approvals?tab=payments"
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      Payment Verification
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {stats.pendingPayments} payment(s) awaiting verification
                    </p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                </Link>
              )}
              {overview && overview.pipeline.paymentProofsPending > 0 && (
                <Link
                  href="/super-admin/approvals?tab=payments"
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Payment proofs</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {overview.pipeline.paymentProofsPending} proof(s) to review
                    </p>
                  </div>
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                </Link>
              )}
              {stats.pendingApproval > 0 && (
                <Link
                  href="/super-admin/approvals?tab=schools"
                  className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">School Approval</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {stats.pendingApproval} school(s) awaiting approval
                    </p>
                  </div>
                  <School className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                </Link>
              )}
              {overview && overview.pipeline.schoolCreationPending > 0 && (
                <Link
                  href="/super-admin/approvals?tab=schools"
                  className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-sky-900 dark:text-sky-200">New school requests</p>
                    <p className="text-xs text-sky-800 dark:text-sky-300">
                      {overview.pipeline.schoolCreationPending} creation request(s)
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
                </Link>
              )}
              {overview &&
                overview.pipeline.subscriptionPendingPayment + overview.pipeline.subscriptionPendingApproval >
                  0 && (
                  <Link
                    href="/super-admin/subscriptions"
                    className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                        Subscription requests
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        {overview.pipeline.subscriptionPendingPayment} pending payment ·{' '}
                        {overview.pipeline.subscriptionPendingApproval} pending approval
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </Link>
                )}
              {overview &&
                overview.support.activeTotal === 0 &&
                stats.pendingPayments === 0 &&
                stats.pendingApproval === 0 &&
                overview.pipeline.paymentProofsPending === 0 &&
                overview.pipeline.schoolCreationPending === 0 &&
                overview.pipeline.subscriptionPendingPayment + overview.pipeline.subscriptionPendingApproval ===
                  0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No pending actions</p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
