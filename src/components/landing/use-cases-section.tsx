'use client'

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, GraduationCap, Users, CheckCircle2 } from "lucide-react";

const useCases = [
  {
    role: "School Administrators",
    icon: Shield,
    benefits: [
      "Complete oversight of all school operations from a single dashboard",
      "Real-time analytics and reports for data-driven decision making",
      "Streamline student admissions and enrollment processes",
      "Manage multiple schools or campuses with ease",
      "Track staff performance and student outcomes",
      "Automated workflows reduce manual administrative tasks"
    ]
  },
  {
    role: "Teachers",
    icon: GraduationCap,
    benefits: [
      "Mark attendance in seconds from any device",
      "Enter grades and generate report cards effortlessly",
      "Create and assign homework with automatic reminders",
      "Communicate directly with students and parents",
      "Access student history and performance data instantly",
      "Spend less time on paperwork, more time teaching"
    ]
  },
  {
    role: "Parents",
    icon: Users,
    benefits: [
      "Monitor your child's attendance and academic progress in real-time",
      "Receive instant notifications about grades and assignments",
      "View and pay school fees online securely",
      "Communicate with teachers and school administration",
      "Access school calendar, events, and announcements",
      "Stay involved in your child's education journey"
    ]
  }
];

export function UseCasesSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Built for Every Member of Your School Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how SchoolFlow benefits administrators, teachers, and parents
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Tabs defaultValue="administrators" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="administrators" className="text-sm md:text-base">
                Administrators
              </TabsTrigger>
              <TabsTrigger value="teachers" className="text-sm md:text-base">
                Teachers
              </TabsTrigger>
              <TabsTrigger value="parents" className="text-sm md:text-base">
                Parents
              </TabsTrigger>
            </TabsList>
            {useCases.map((useCase, index) => (
              <TabsContent key={index} value={useCase.role.toLowerCase().replace(' ', '')}>
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
                        <useCase.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">For {useCase.role}</h3>
                    </div>
                    <ul className="space-y-4">
                      {useCase.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
