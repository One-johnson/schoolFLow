'use client'

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const comparisonData = [
  {
    feature: "Setup Time",
    traditional: "Weeks to months",
    schoolflow: "24-48 hours",
    advantage: true
  },
  {
    feature: "Cost Structure",
    traditional: "High upfront + maintenance",
    schoolflow: "Affordable monthly pricing",
    advantage: true
  },
  {
    feature: "Data Access",
    traditional: "Office computer only",
    schoolflow: "Anywhere, any device",
    advantage: true
  },
  {
    feature: "Updates",
    traditional: "Manual upgrades required",
    schoolflow: "Automatic, always current",
    advantage: true
  },
  {
    feature: "Parent Communication",
    traditional: "Phone calls, emails, letters",
    schoolflow: "Real-time notifications",
    advantage: true
  },
  {
    feature: "Data Security",
    traditional: "Your responsibility",
    schoolflow: "Enterprise-grade encryption",
    advantage: true
  },
  {
    feature: "Support",
    traditional: "Limited, extra cost",
    schoolflow: "Included with every plan",
    advantage: true
  },
  {
    feature: "Scalability",
    traditional: "Costly infrastructure changes",
    schoolflow: "Instant, seamless scaling",
    advantage: true
  }
];

export function ComparisonSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          SchoolFlow vs Traditional Methods
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how we compare to legacy systems and manual processes
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Traditional Methods</th>
                    <th className="text-center p-4 font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                      SchoolFlow
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      viewport={{ once: true }}
                      className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                          <span className="text-sm">{row.traditional}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-semibold">{row.schoolflow}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
