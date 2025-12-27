"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  School,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  HeadphonesIcon,
  Shield,
  Zap,
  Globe,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: LayoutDashboard,
    title: "Comprehensive Dashboard",
    description:
      "Monitor platform metrics, active schools, students, and revenue at a glance.",
    color: "text-blue-500",
  },
  {
    icon: Users,
    title: "School Admin Management",
    description:
      "Invite, manage, and control access for school administrators with ease.",
    color: "text-green-500",
  },
  {
    icon: School,
    title: "School Management",
    description:
      "View, filter, approve, and suspend schools with powerful management tools.",
    color: "text-purple-500",
  },
  {
    icon: CreditCard,
    title: "Subscription & Billing",
    description:
      "Track per-student subscriptions, verify payments, and manage billing seamlessly.",
    color: "text-orange-500",
  },
  {
    icon: FileText,
    title: "Audit Logs",
    description:
      "Complete activity tracking with detailed logs for security and accountability.",
    color: "text-red-500",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description:
      "Visualize platform-wide metrics, trends, and insights with interactive charts.",
    color: "text-cyan-500",
  },
  {
    icon: Settings,
    title: "System Settings",
    description:
      "Configure platform settings, notifications, security, and access controls.",
    color: "text-pink-500",
  },
  {
    icon: HeadphonesIcon,
    title: "Support Center",
    description:
      "Manage support tickets, access FAQs, and provide help resources.",
    color: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Security First",
    description:
      "Enterprise-grade security with encrypted data and role-based access control.",
    color: "text-indigo-500",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description:
      "Get instant notifications and live activity feeds for all platform actions.",
    color: "text-teal-500",
  },
  {
    icon: Globe,
    title: "Multi-tenant Architecture",
    description:
      "Each school operates independently with isolated data and configurations.",
    color: "text-emerald-500",
  },
  {
    icon: Lock,
    title: "Data Export",
    description:
      "Export platform data in multiple formats for reporting and compliance.",
    color: "text-violet-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features(): React.JSX.Element {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to give you complete control over your
              school management platform.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg bg-muted group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
