'use client'

import { useCallback, useEffect, useState } from 'react';
import { LandingHeader } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { ContactFAB } from '@/components/landing/contact-fab';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield, 
  Bell,
  CheckCircle2,
  Zap,
  Globe,
  Lock,
  Activity,
  UserCog,
  Clock,
  GraduationCap,
  ClipboardCheck,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { JSX } from 'react';

const features = [
  {
    icon: Building2,
    title: 'Multi-School Management',
    description: 'Manage multiple schools from a single dashboard with complete tenant isolation.',
    benefits: [
      'Independent school operations',
      'Centralized platform oversight',
      'Custom branding per school',
      'Isolated data storage',
      'School-specific configurations'
    ],
    color: 'text-blue-500'
  },
  {
    icon: UserCog,
    title: 'Advanced Admin Management',
    description: 'Comprehensive admin management with role hierarchy and granular permissions.',
    benefits: [
      'Multiple Super Admin support',
      'Role hierarchy (Owner, Admin, Moderator)',
      'Add, edit, suspend, and delete admins',
      'Temporary credential generation',
      'Permission-based access control'
    ],
    color: 'text-green-500'
  },
  {
    icon: Activity,
    title: 'Activity & Login History',
    description: 'Complete visibility into user activity with login history and session tracking.',
    benefits: [
      'Detailed login history',
      'Active session monitoring',
      'IP address and device tracking',
      'Security alerts and notifications',
      'Session revocation capabilities'
    ],
    color: 'text-blue-600'
  },
  {
    icon: Clock,
    title: 'Trial Management & Auto-Suspension',
    description: 'Automated trial period management with intelligent suspension system.',
    benefits: [
      'Automatic trial expiry tracking',
      'Auto-suspension after trial ends',
      'Grace period configuration',
      'Manual trial extension',
      'Subscription upgrade prompts'
    ],
    color: 'text-amber-500'
  },
  {
    icon: CreditCard,
    title: 'Subscription & Billing',
    description: 'Flexible per-student subscription model with manual payment verification.',
    benefits: [
      'Per-student pricing model',
      'Manual payment verification',
      'Subscription status tracking',
      'Revenue analytics',
      'Payment history logs'
    ],
    color: 'text-purple-500'
  },
  {
    icon: FileText,
    title: 'Comprehensive Audit Logs',
    description: 'Track every action on the platform for security and accountability.',
    benefits: [
      'Real-time action tracking',
      'User activity monitoring',
      'Enhanced IP address logging',
      'Filterable audit trails',
      'Export capabilities'
    ],
    color: 'text-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Gain insights with detailed reports and interactive visualizations.',
    benefits: [
      'Platform-wide metrics',
      'Revenue trend analysis',
      'Student enrollment tracking',
      'School performance reports',
      'Custom date range filtering'
    ],
    color: 'text-pink-500'
  },
  {
    icon: Settings,
    title: 'System Configuration',
    description: 'Customize platform settings, notifications, and security preferences.',
    benefits: [
      'Platform-wide settings',
      'Email notification controls',
      'Two-factor authentication',
      'Advanced session management',
      'Billing plan configuration'
    ],
    color: 'text-cyan-500'
  },
  {
    icon: Shield,
    title: 'Advanced Security',
    description: 'Enterprise-grade security with encryption and access controls.',
    benefits: [
      'Data encryption at rest',
      'Secure authentication with session tracking',
      'Password strength validation',
      'Automatic suspended user blocking',
      'IP-based security monitoring'
    ],
    color: 'text-red-500'
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Stay updated with instant notifications for critical platform events.',
    benefits: [
      'Instant alerts',
      'Customizable preferences',
      'Email notifications',
      'In-app notification center',
      'Priority-based delivery'
    ],
    color: 'text-yellow-500'
  },
  {
    icon: Zap,
    title: 'High Performance',
    description: 'Built for speed and scalability to handle thousands of schools.',
    benefits: [
      'Lightning-fast load times',
      'Optimized database queries',
      'Caching mechanisms',
      'Scalable architecture',
      'Real-time data updates'
    ],
    color: 'text-indigo-500'
  },
  {
    icon: Globe,
    title: 'Multi-tenant Architecture',
    description: 'Isolated environments for each school with shared infrastructure.',
    benefits: [
      'Complete data isolation',
      'Shared infrastructure',
      'Cost efficiency',
      'Easy scalability',
      'Independent backups'
    ],
    color: 'text-teal-500'
  },
  {
    icon: Lock,
    title: 'Data Privacy & Compliance',
    description: 'GDPR-compliant with robust data protection measures.',
    benefits: [
      'GDPR compliance',
      'Data encryption',
      'Regular backups',
      'Access control',
      'Privacy by design'
    ],
    color: 'text-violet-500'
  },
  {
    icon: CheckCircle2,
    title: 'School Approval Workflow',
    description: 'Streamlined process for onboarding and approving new schools.',
    benefits: [
      'Payment verification',
      'Document review',
      'Approval workflow',
      'Status tracking',
      'Email notifications'
    ],
    color: 'text-emerald-500'
  },
  {
    icon: Users,
    title: 'User & Role Management',
    description: 'Complete control over users and their permissions across the platform.',
    benefits: [
      'Comprehensive user directory',
      'Role assignment and management',
      'Bulk user operations',
      'User activity monitoring',
      'Account suspension controls'
    ],
    color: 'text-slate-500'
  },
  {
    icon: Building2,
    title: 'School Admin Portal',
    description: 'Full-featured dashboard for school administrators to run daily operations.',
    benefits: [
      'Teachers, classes, students & subjects',
      'Timetable & attendance management',
      'Exams, reports & fee management',
      'Events, announcements & notifications',
      'Academic years & school configuration'
    ],
    color: 'text-blue-600'
  },
  {
    icon: GraduationCap,
    title: 'Teacher Portal',
    description: 'Mobile-first portal for teachers to manage classrooms and students.',
    benefits: [
      'Student list & class overview',
      'Digital attendance marking',
      'Gradebook & exam marks entry',
      'Timetable, calendar & reports',
      'Messages & export tools'
    ],
    color: 'text-emerald-600'
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance & Timetables',
    description: 'Digital attendance tracking and timetable management across the school.',
    benefits: [
      'Daily attendance by class',
      'Timetable creation & editing',
      'Attendance reports & exports',
      'Session-based tracking',
      'Bulk attendance entry'
    ],
    color: 'text-amber-600'
  },
  {
    icon: BookOpen,
    title: 'Exams & Gradebook',
    description: 'Manage exams, enter marks, and generate grade reports.',
    benefits: [
      'Exam creation & management',
      'Marks entry by class & subject',
      'Grading scales & report cards',
      'Analytics & performance tracking',
      'Export to PDF'
    ],
    color: 'text-violet-600'
  },
  {
    icon: Users,
    title: 'Parents Portal (Coming Soon)',
    description: 'Guardians will access attendance, grades, fees, and reports for their ward.',
    benefits: [
      'View child attendance & grades',
      'Fee status & payment history',
      'Report cards & progress',
      'Secure, role-based access',
      'Stay informed and engaged'
    ],
    color: 'text-sky-500'
  }
];

const heroSlides = [
  {
    badge: 'Super Admin',
    headline: 'Oversee Multiple Schools',
    description: 'Centralized dashboard, subscriptions, approvals, and platform-wide analytics.',
  },
  {
    badge: 'School Admin',
    headline: 'Run Your School',
    description: 'Teachers, classes, timetable, attendance, exams, fees, and events—all in one place.',
  },
  {
    badge: 'Teacher Portal',
    headline: 'Manage Your Classroom',
    description: 'Attendance, gradebook, marks, reports, and messages—built for daily teaching.',
  },
  {
    badge: 'Coming Soon',
    headline: 'Parents Portal',
    description: 'Guardians will access attendance, grades, and fees for their ward.',
  },
];

export default function FeaturesPage(): React.JSX.Element {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    const autoplay = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => {
      clearInterval(autoplay);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      {/* Hero Section with Carousel */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="overflow-hidden rounded-2xl bg-muted/50 border" ref={emblaRef}>
            <div className="flex">
              {heroSlides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0">
                  <div className="px-8 py-16 md:py-24 text-center">
                    <Badge className="mb-4" variant="outline">
                      {slide.badge}
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {slide.headline}
                      </span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                      {slide.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-background to-muted flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your School Management?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              SchoolFlow is ready to help you streamline operations and focus on what matters—student success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <ContactFAB />
    </div>
  );
}
