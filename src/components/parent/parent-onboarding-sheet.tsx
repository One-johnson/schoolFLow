'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  FileText,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

interface ParentOnboardingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const PARENT_STEPS = [
  {
    id: 0,
    title: 'Welcome to SchoolFlow – Parent portal',
    icon: LayoutDashboard,
    description:
      'This portal gives you a clear view of your children’s attendance, performance and fees.',
    bullets: [
      'See a summary of all your children from the dashboard',
      'Quickly spot outstanding fees, attendance issues and new report cards',
      'Stay up to date with school announcements',
    ],
    primaryCta: { label: 'Go to Dashboard', href: '/parent' },
  },
  {
    id: 1,
    title: 'See your children and their details',
    icon: Users,
    description:
      'Use the Children section to view each child’s class, basic details and profile.',
    bullets: [
      'Select a child to see their class and basic information',
      'Open a child’s profile to view attendance and reports',
    ],
    primaryCta: { label: 'View Children', href: '/parent/children' },
  },
  {
    id: 2,
    title: 'Understand fees and payments',
    icon: CreditCard,
    description:
      'Keep track of school fees, payments you have made and any remaining balances.',
    bullets: [
      'See total fees, how much has been paid and what is left to pay',
      'Download or view fee receipts when available',
      'Use the fees page as a reference when paying at school or via mobile money/bank',
    ],
    primaryCta: { label: 'Go to Fees', href: '/parent/fees' },
  },
  {
    id: 3,
    title: 'Monitor attendance',
    icon: ClipboardCheck,
    description:
      'See how often your child attends school and whether there are concerning patterns.',
    bullets: [
      'View recent attendance records and summaries',
      'Look out for frequent absences or late arrivals',
    ],
    primaryCta: { label: 'View Attendance', href: '/parent/children' },
  },
  {
    id: 4,
    title: 'View report cards and performance',
    icon: FileText,
    description:
      'Access your child’s published report cards and see their performance across terms.',
    bullets: [
      'See termly report cards once they are published by the school',
      'Review subjects, marks, grades and teacher comments',
      'Download or print report cards for your records',
    ],
    primaryCta: { label: 'View Report Cards', href: '/parent/children' },
  },
  {
    id: 5,
    title: 'Stay informed with announcements',
    icon: Bell,
    description:
      'Check notifications regularly so you do not miss important school updates.',
    bullets: [
      'Look for fee deadlines, events and academic updates',
      'Use the portal as your first place for official school communication',
    ],
    primaryCta: { label: 'View Notifications', href: '/parent' },
  },
];

export function ParentOnboardingSheet({
  open,
  onOpenChange,
  onComplete,
}: ParentOnboardingSheetProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = PARENT_STEPS[stepIndex];
  const totalSteps = PARENT_STEPS.length;

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleSkip();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const Icon = step.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[75vh] max-h-[640px] overflow-y-auto sm:rounded-t-3xl border-t shadow-2xl p-2"
      >
        <SheetHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg sm:text-xl">
                {step.title}
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                Step {stepIndex + 1} of {totalSteps} • Parent Onboarding
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">{step.description}</p>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {step.bullets.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {step.primaryCta && (
                <Button asChild size="sm">
                  <Link href={step.primaryCta.href}>{step.primaryCta.label}</Link>
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-xs sm:text-sm text-muted-foreground"
              >
                Skip tour
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={stepIndex === 0}
                >
                  Back
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

