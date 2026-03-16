'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#0ea5e9',
  '#84cc16', '#f43f5e', '#78716c',
];

interface AddHouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  createdBy: string;
}

export function AddHouseDialog({
  open,
  onOpenChange,
  schoolId,
  createdBy,
}: AddHouseDialogProps): React.JSX.Element {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addHouse = useMutation(api.houses.addHouse);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter the house name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter the house code');
      return;
    }

    setIsLoading(true);

    try {
      await addHouse({
        schoolId,
        name: name.trim(),
        code: code.trim(),
        color: color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined,
        createdBy,
      });

      toast.success('House added successfully');
      onOpenChange(false);
      setName('');
      setCode('');
      setColor('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add house');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add House</DialogTitle>
          <DialogDescription>
            Create a new house for your school. Students and teachers can be assigned to houses (e.g., for competitions or pastoral groups).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Jubilee, Ambassadors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              placeholder="e.g., JUB, AMB"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Color (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Color ${hex}`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${color === hex ? 'border-foreground ring-2 ring-offset-2 ring-offset-background' : 'border-transparent'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                id="house-color-custom"
                value={color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#3b82f6'}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-input bg-transparent p-0"
              />
              <Input
                placeholder="#3b82f6"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-24 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add House
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
