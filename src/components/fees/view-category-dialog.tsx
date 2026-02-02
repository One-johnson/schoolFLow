'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { JSX } from 'react';

interface ViewCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    categoryCode: string;
    categoryName: string;
    description?: string;
    isOptional: boolean;
    status: 'active' | 'inactive';
    createdAt: string;
  } | null;
}

export function ViewCategoryDialog({
  open,
  onOpenChange,
  category,
}: ViewCategoryDialogProps): React.JSX.Element {
  if (!category) return <></>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fee Category Details</DialogTitle>
          <DialogDescription>
            View complete information about this fee category
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Category Code:</Label>
            <div className="col-span-2">
              <span className="font-mono text-sm">{category.categoryCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Category Name:</Label>
            <div className="col-span-2">
              <span>{category.categoryName}</span>
            </div>
          </div>

          {category.description && (
            <div className="grid grid-cols-3 items-start gap-4">
              <Label className="font-semibold">Description:</Label>
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">{category.description}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Type:</Label>
            <div className="col-span-2">
              {category.isOptional ? (
                <Badge variant="outline">Optional</Badge>
              ) : (
                <Badge className="bg-blue-500">Mandatory</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Status:</Label>
            <div className="col-span-2">
              {category.status === 'active' ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 items-center gap-4">
            <Label className="font-semibold">Created:</Label>
            <div className="col-span-2">
              <span className="text-sm">
                {new Date(category.createdAt).toLocaleDateString()} at{' '}
                {new Date(category.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
