'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface ChartsSectionProps {
  schoolId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ChartsSection({ schoolId }: ChartsSectionProps): React.JSX.Element {
  const feeCollectionTrend = useQuery(api.dashboard.getFeeCollectionTrend, { schoolId });

  if (!feeCollectionTrend) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Analytics & Trends</CardTitle>
          <CardDescription>Visual insights into your school data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sample data for demonstration (you can expand this with real data)
  const rsvpData = [
    { name: 'Attending', value: 45 },
    { name: 'Not Attending', value: 12 },
    { name: 'Tentative', value: 18 },
    { name: 'Pending', value: 25 },
  ];

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Analytics & Trends
        </CardTitle>
        <CardDescription>Visual insights into your school data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Fee Collection Trend */}
        <div>
          <h4 className="text-sm font-semibold mb-4">Fee Collection Trend (Last 6 Months)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={feeCollectionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Amount Collected"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RSVP Analytics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-4">Event RSVP Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={rsvpData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rsvpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Class Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { class: 'Grade 1', students: 45 },
                  { class: 'Grade 2', students: 38 },
                  { class: 'Grade 3', students: 42 },
                  { class: 'Grade 4', students: 35 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#8884d8" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
