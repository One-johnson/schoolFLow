"use client";

import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { motion } from "framer-motion";
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const features = [
  {
    icon: Building2,
    title: "Multi-School Management",
    description:
      "Manage multiple schools from a single dashboard with complete tenant isolation.",
    benefits: [
      "Independent school operations",
      "Centralized platform oversight",
      "Custom branding per school",
      "Isolated data storage",
      "School-specific configurations",
    ],
    color: "text-blue-500",
  },
  {
    icon: Users,
    title: "School Admin Management",
    description:
      "Invite and manage school administrators with role-based access control.",
    benefits: [
      "Easy admin invitation system",
      "Temporary credential generation",
      "Activity monitoring",
      "Permission management",
      "Bulk operations support",
    ],
    color: "text-green-500",
  },
  {
    icon: CreditCard,
    title: "Subscription & Billing",
    description:
      "Flexible per-student subscription model with manual payment verification.",
    benefits: [
      "Per-student pricing model",
      "Manual payment verification",
      "Subscription status tracking",
      "Revenue analytics",
      "Payment history logs",
    ],
    color: "text-purple-500",
  },
  {
    icon: FileText,
    title: "Comprehensive Audit Logs",
    description:
      "Track every action on the platform for security and accountability.",
    benefits: [
      "Real-time action tracking",
      "User activity monitoring",
      "IP address logging",
      "Filterable audit trails",
      "Export capabilities",
    ],
    color: "text-orange-500",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Gain insights with detailed reports and interactive visualizations.",
    benefits: [
      "Platform-wide metrics",
      "Revenue trend analysis",
      "Student enrollment tracking",
      "School performance reports",
      "Custom date range filtering",
    ],
    color: "text-pink-500",
  },
  {
    icon: Settings,
    title: "System Configuration",
    description:
      "Customize platform settings, notifications, and security preferences.",
    benefits: [
      "Platform-wide settings",
      "Email notification controls",
      "Two-factor authentication",
      "Session management",
      "Billing plan configuration",
    ],
    color: "text-cyan-500",
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description:
      "Enterprise-grade security with encryption and access controls.",
    benefits: [
      "Data encryption at rest",
      "Secure authentication",
      "Password strength validation",
      "Session timeout controls",
      "IP-based restrictions",
    ],
    color: "text-red-500",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Stay updated with instant notifications for critical platform events.",
    benefits: [
      "Instant alerts",
      "Customizable preferences",
      "Email notifications",
      "In-app notification center",
      "Priority-based delivery",
    ],
    color: "text-yellow-500",
  },
  {
    icon: Zap,
    title: "High Performance",
    description:
      "Built for speed and scalability to handle thousands of schools.",
    benefits: [
      "Lightning-fast load times",
      "Optimized database queries",
      "Caching mechanisms",
      "Scalable architecture",
      "Real-time data updates",
    ],
    color: "text-indigo-500",
  },
  {
    icon: Globe,
    title: "Multi-tenant Architecture",
    description:
      "Isolated environments for each school with shared infrastructure.",
    benefits: [
      "Complete data isolation",
      "Shared infrastructure",
      "Cost efficiency",
      "Easy scalability",
      "Independent backups",
    ],
    color: "text-teal-500",
  },
  {
    icon: Lock,
    title: "Data Privacy & Compliance",
    description: "GDPR-compliant with robust data protection measures.",
    benefits: [
      "GDPR compliance",
      "Data encryption",
      "Regular backups",
      "Access control",
      "Privacy by design",
    ],
    color: "text-violet-500",
  },
  {
    icon: CheckCircle2,
    title: "School Approval Workflow",
    description:
      "Streamlined process for onboarding and approving new schools.",
    benefits: [
      "Payment verification",
      "Document review",
      "Approval workflow",
      "Status tracking",
      "Email notifications",
    ],
    color: "text-emerald-500",
  },
];

export default function FeaturesPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4" variant="outline">
              Comprehensive Features
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need to Manage
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Multiple Schools
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              SchoolFlow provides a complete suite of tools designed
              specifically for multi-tenant school management. From billing to
              analytics, we&apos;ve got you covered.
            </p>
          </motion.div>
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
                    <div
                      className={`w-12 h-12 rounded-lg bg-linear-to-br from-background to-muted flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">
                            {benefit}
                          </span>
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
              Join hundreds of schools already using SchoolFlow to streamline
              their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
