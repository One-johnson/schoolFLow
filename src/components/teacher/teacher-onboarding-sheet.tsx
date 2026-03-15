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
  ClipboardCheck,
  BookOpen,
  FileText,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

interface TeacherOnboardingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TEACHER_STEPS = [
  {
    id: 0,
    title: 'Welcome to SchoolFlow – Teacher portal',
    icon: LayoutDashboard,
    description:
      'This portal helps you manage attendance, homework, exams and report cards for your classes.',
    bullets: [
      'See your assigned classes and quick stats from the dashboard',
      'Take attendance and record marks from any device',
      'Generate professional report cards without complex spreadsheets',
    ],
    primaryCta: { label: 'Go to Dashboard', href: '/teacher' },
  },
  {
    id: 1,
    title: 'View your students and classes',
    icon: Users,
    description:
      'Use the Students page to quickly see who is in your class and access detailed student profiles.',
    bullets: [
      'Browse students in your assigned classes',
      'Open a student to see contact information and medical details',
      'Print or export student information when needed',
    ],
    primaryCta: { label: 'Open Students', href: '/teacher/students' },
  },
  {
    id: 2,
    title: 'Mark attendance efficiently',
    icon: ClipboardCheck,
    description:
      'Record daily attendance in a few taps and let SchoolFlow handle summaries and analytics.',
    bullets: [
      'Mark students as present, absent, late or excused',
      'Review attendance history and summary for your class',
      'Help school admins identify attendance issues early',
    ],
    primaryCta: { label: 'Go to Attendance', href: '/teacher/attendance' },
  },
  {
    id: 3,
    title: 'Manage homework and assignments',
    icon: BookOpen,
    description:
      'Create, edit and track homework so students and parents stay informed about classwork.',
    bullets: [
      'Create homework with clear instructions and due dates',
      'Update or close homework when it is completed',
      'Let parents and students see homework details from their portals',
    ],
    primaryCta: { label: 'Manage Homework', href: '/teacher/homework' },
  },
  {
    id: 4,
    title: 'Record exams and generate report cards',
    icon: FileText,
    description:
      'Enter exam marks once and let SchoolFlow compute totals, grades and professional report cards.',
    bullets: [
      'Enter marks for each exam and subject',
      'Review report card previews before publishing',
      'Generate and print PDF report cards for students',
    ],
    primaryCta: { label: 'Go to Exams', href: '/teacher/exams' },
    secondaryCta: { label: 'View Reports', href: '/teacher/reports' },
  },
  {
    id: 5,
    title: 'Stay updated with notifications',
    icon: Bell,
    description:
      'Receive important announcements from your school admin and see what needs your attention.',
    bullets: [
      'Check notifications for new announcements and updates',
      'Use the dashboard to see quick insights about your classes',
    ],
    primaryCta: { label: 'View Notifications', href: '/teacher/notifications' },
  },
];

export function TeacherOnboardingSheet({
  open,
  onOpenChange,
  onComplete,
}: TeacherOnboardingSheetProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TEACHER_STEPS[stepIndex];
  const totalSteps = TEACHER_STEPS.length;

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
                Step {stepIndex + 1} of {totalSteps} • Teacher Onboarding
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
              {step.secondaryCta && (
                <Button asChild size="sm" variant="outline">
                  <Link href={step.secondaryCta.href}>{step.secondaryCta.label}</Link>
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

