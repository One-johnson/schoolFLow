'use client'

import { motion } from "framer-motion";
import { Shield, Lock, Award, TrendingUp } from "lucide-react";

const indicators = [
  {
    icon: Shield,
    title: "SOC 2 Certified",
    description: "Enterprise security standards"
  },
  {
    icon: Lock,
    title: "FERPA Compliant",
    description: "Student data protection"
  },
  {
    icon: Award,
    title: "99.9% Uptime",
    description: "Reliable and available"
  },
  {
    icon: TrendingUp,
    title: "500+ Schools",
    description: "Trusted worldwide"
  }
];

export function TrustIndicatorsSection() {
  return (
    <section className="border-y bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {indicators.map((indicator, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
                  <indicator.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="font-bold text-sm">{indicator.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{indicator.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
