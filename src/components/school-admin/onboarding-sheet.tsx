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
  School,
  Users,
  UserPlus,
  CreditCard,
  ClipboardCheck,
  BarChart3,
  Bell,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 0,
    title: 'Welcome to SchoolFlow',
    icon: School,
    description:
      'Manage your entire school in one place – students, fees, attendance, report cards and communication.',
    bullets: [
      'Keep student and parent information organised and secure',
      'Track fees, payments and balances with clear reports',
      'Support teachers with attendance, homework and exams tools',
    ],
    primaryCta: { label: 'Next: School profile', href: '/school-admin/school' },
  },
  {
    id: 1,
    title: 'Set up your school profile & logo',
    icon: School,
    description:
      'Start by reviewing your school details so they appear correctly on dashboards, receipts and PDFs.',
    bullets: [
      'Update school name, email, phone and address',
      'Upload your school logo – it appears on receipts and student/report PDFs',
    ],
    primaryCta: { label: 'Open My School', href: '/school-admin/school' },
  },
  {
    id: 2,
    title: 'Create departments and classes',
    icon: Users,
    description:
      'Departments and classes are the backbone of your school structure. They power stats, attendance and reporting.',
    bullets: [
      'Create departments like Creche, Kindergarten, Primary, JHS',
      'Add classes under each department (e.g. Primary 4A, JHS 2B)',
      'Students and teachers are assigned to classes and departments',
    ],
    primaryCta: { label: 'Manage Departments', href: '/school-admin/departments' },
    secondaryCta: { label: 'Manage Classes', href: '/school-admin/classes' },
  },
  {
    id: 3,
    title: 'Add students and teachers',
    icon: UserPlus,
    description:
      'Add your community so you can start taking attendance, recording marks and communicating.',
    bullets: [
      'Add students individually or use Bulk Add (CSV) to import many at once',
      'Capture parent contacts and medical information for each student',
      'Add teachers, assign them to classes and subjects',
    ],
    primaryCta: { label: 'Go to Students', href: '/school-admin/students' },
    secondaryCta: { label: 'Go to Teachers', href: '/school-admin/teachers' },
  },
  {
    id: 4,
    title: 'Configure fees and payments',
    icon: CreditCard,
    description:
      'Define fee structures, record payments and generate receipts so you always know who has paid what.',
    bullets: [
      'Create fee structures by class or department',
      'Record payments and automatically track balances and overpayments',
      'Generate PDF receipts and outstanding fees reports',
    ],
    primaryCta: { label: 'Open Fees', href: '/school-admin/fees' },
  },
  {
    id: 5,
    title: 'Attendance, exams and report cards',
    icon: ClipboardCheck,
    description:
      'Help teachers record attendance and marks, then generate professional report cards for each term.',
    bullets: [
      'Teachers mark daily attendance; admins see attendance history and alerts',
      'Create exams, enter marks and generate report cards',
      'Report cards include school header, logo, grading scale and student performance',
    ],
    primaryCta: { label: 'Go to Attendance', href: '/school-admin/attendance' },
    secondaryCta: { label: 'Go to Exams', href: '/school-admin/exams' },
  },
  {
    id: 6,
    title: 'Communicate and get support',
    icon: Bell,
    description:
      'Use announcements to keep parents and teachers informed, and reach out to support when you need help.',
    bullets: [
      'Send announcements and notifications from the School Admin portal',
      'Parents see key info, fees and report cards in their portal',
      'Open support tickets if you need assistance from the SchoolFlow team',
    ],
    primaryCta: { label: 'Notifications', href: '/school-admin/notifications' },
    secondaryCta: { label: 'Support', href: '/school-admin/support' },
  },
  {
    id: 7,
    title: 'You’re ready to start',
    icon: FileText,
    description:
      'Your school is set up to run smoothly on SchoolFlow. You can revisit these areas anytime from the sidebar.',
    bullets: [
      'Use the dashboard to keep an eye on students, fees and activity',
      'Update your profile and settings as your school grows',
      'Contact support whenever you need help or have ideas',
    ],
    primaryCta: { label: 'Go to Dashboard', href: '/school-admin' },
  },
];

export function SchoolAdminOnboardingSheet({
  open,
  onOpenChange,
  onComplete,
}: OnboardingSheetProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;

  const handleClose = () => {
    onOpenChange(false);
  };

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

  const PrimaryIcon = step.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] max-h-[640px] overflow-y-auto sm:rounded-t-3xl border-t shadow-2xl p-2"
      >
        <SheetHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <PrimaryIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg sm:text-xl">
                {step.title}
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                Step {stepIndex + 1} of {totalSteps} • School Admin Onboarding
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

