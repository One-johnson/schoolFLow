'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface GradingScaleCardProps {
  scale: {
    _id: Id<'gradingScales'>;
    scaleCode: string;
    scaleName: string;
    department?: string;
    grades: string;
    isDefault: boolean;
    status: 'active' | 'inactive';
  };
  onEdit?: (scaleId: Id<'gradingScales'>) => void;
  onDelete?: (scaleId: Id<'gradingScales'>) => void;
}

export function GradingScaleCard({ scale, onEdit, onDelete }: GradingScaleCardProps) {
  const grades = JSON.parse(scale.grades);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{scale.scaleName}</CardTitle>
              {scale.isDefault && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            <CardDescription>{scale.scaleCode}</CardDescription>
          </div>
          <Badge variant={scale.status === 'active' ? 'default' : 'secondary'}>
            {scale.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {scale.department && (
          <div className="text-sm">
            <span className="text-muted-foreground">Department:</span>{' '}
            <span className="font-medium capitalize">{scale.department}</span>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 font-medium">Grade</th>
                <th className="text-left p-2 font-medium">Range</th>
                <th className="text-left p-2 font-medium">Remark</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade: { grade: string; minPercent: number; maxPercent: number; remark: string }, index: number) => (
                <tr key={index} className="border-t">
                  <td className="p-2 font-medium">{grade.grade}</td>
                  <td className="p-2">{grade.minPercent}% - {grade.maxPercent}%</td>
                  <td className="p-2">{grade.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(scale._id)} className="flex-1">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && !scale.isDefault && (
              <Button variant="outline" size="sm" onClick={() => onDelete(scale._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
