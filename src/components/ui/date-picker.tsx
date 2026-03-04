'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  error?: boolean;
  /** Disable future dates (e.g. for date of birth). Default true. */
  disableFuture?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  id,
  className,
  error = false,
  disableFuture = true,
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value + 'T12:00:00') : undefined;
  const today = new Date();
  const startMonth = new Date(today.getFullYear() - 100, 0, 1);
  const endMonth = disableFuture ? today : new Date(today.getFullYear() + 10, 11, 31);

  const handleSelect = (d: Date | undefined): void => {
    if (d) {
      onChange(format(d, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            error && 'border-red-500',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          defaultMonth={date ?? today}
          hideNavigation
          disabled={disableFuture ? (d) => d > new Date() : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
