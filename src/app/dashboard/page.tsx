'use client';

import { JSX, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { School, Users, DollarSign, AlertCircle, TrendingUp, GraduationCap } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  AreaChart,
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
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage(): JSX.Element {
  const stats = useQuery(api.schools.getDashboardStats);
  const auditLogs = useQuery(api.auditLogs.list);
  const schools = useQuery(api.schools.list);

  // Revenue trend data (empty - no data in system yet)
  const revenueData: Array<{ month: string; revenue: number; students: number }> = [];

  // School growth data (empty - no data in system yet)
  const schoolGrowthData: Array<{ month: string; active: number; pending: number }> = [];

  // Status distribution data (real data from schools)
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

  // Monthly student enrollment data (empty - no data in system yet)
  const enrollmentData: Array<{ month: string; enrolled: number; target: number }> = [];

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  const recentActivity = auditLogs?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Student Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue ($)"
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                    name="Students"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {schoolGrowthData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            ) : (
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
                  <Bar dataKey="active" fill="#3b82f6" name="Active Schools" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending Schools" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Student Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            ) : (
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
                    dataKey="enrolled"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Enrolled"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Target"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              ) : (
                recentActivity.map((log) => (
                  <div key={log._id} className="flex items-start gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
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

        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingPayments > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      Payment Verification
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {stats.pendingPayments} payment(s) awaiting verification
                    </p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              )}
              {stats.pendingApproval > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">School Approval</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {stats.pendingApproval} school(s) awaiting approval
                    </p>
                  </div>
                  <School className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              {stats.pendingPayments === 0 && stats.pendingApproval === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending actions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
