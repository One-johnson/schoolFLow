'use client'

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Settings, Users, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Sign Up",
    description: "Create your free account in under 2 minutes. No credit card required to get started."
  },
  {
    icon: Settings,
    number: "02",
    title: "Set Up School",
    description: "Configure your school structure, add classes, subjects, and customize settings to match your needs."
  },
  {
    icon: Users,
    number: "03",
    title: "Invite Users",
    description: "Add teachers, students, and parents. Bulk import from spreadsheets or migrate from existing systems."
  },
  {
    icon: Rocket,
    number: "04",
    title: "Go Live",
    description: "Start managing attendance, grades, and communication. Our support team is here to help every step."
  }
];

export function HowItWorksSection() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Get Started in 4 Simple Steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From signup to full operation in less than a day
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <Card className="h-full border-2 hover:border-blue-600 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="mt-6 mb-4 flex justify-center">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-4">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 z-10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
