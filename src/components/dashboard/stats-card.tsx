import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { JSX } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps): JSX.Element {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-500 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
            {trend && (
              <p className={`text-sm mt-2 ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 transition-all duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
