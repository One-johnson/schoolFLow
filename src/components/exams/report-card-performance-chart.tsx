'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Subject {
  subjectName: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  position: number;
  grade: string;
  remarks: string;
}

interface ReportCardPerformanceChartProps {
  subjects: Subject[];
}

export function ReportCardPerformanceChart({ subjects }: ReportCardPerformanceChartProps) {
  // Transform subjects data for the chart
  const chartData = subjects.map((subject: Subject) => ({
    name: subject.subjectName.length > 15 
      ? subject.subjectName.substring(0, 12) + '...' 
      : subject.subjectName,
    fullName: subject.subjectName,
    'Class Score': subject.classScore,
    'Exam Score': subject.examScore,
    'Total': subject.totalScore,
  }));

  // Color for bars based on performance
  const getBarColor = (value: number): string => {
    if (value >= 80) return '#10b981'; // green
    if (value >= 70) return '#3b82f6'; // blue
    if (value >= 60) return '#f59e0b'; // amber
    if (value >= 50) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-semibold">Subject Performance Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            style={{ fontSize: '10px' }}
          />
          <YAxis 
            domain={[0, 100]}
            style={{ fontSize: '10px' }}
          />
          <Tooltip 
            contentStyle={{ fontSize: '12px' }}
            labelFormatter={(label, payload) => {
              const item = payload && payload[0];
              return item ? item.payload.fullName : label;
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Class Score" fill="#8b5cf6" />
          <Bar dataKey="Exam Score" fill="#06b6d4" />
          <Bar dataKey="Total">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.Total)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
