'use client'

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long does it take to set up SchoolFlow?",
    answer: "Most schools are up and running within 24-48 hours. Our onboarding team guides you through the setup process, including data migration, user account creation, and staff training. For larger institutions, we provide dedicated implementation support."
  },
  {
    question: "Can we migrate data from our existing system?",
    answer: "Yes! We provide comprehensive data migration services. Our team will help you import student records, teacher information, grades, and historical data from spreadsheets, legacy systems, or other school management platforms. The process is secure and maintains data integrity."
  },
  {
    question: "Is training provided for staff and teachers?",
    answer: "Absolutely. We offer multiple training options including live webinars, video tutorials, detailed documentation, and one-on-one sessions. Professional and Enterprise plans include custom training tailored to your school's needs. Our intuitive interface means most users are comfortable within hours."
  },
  {
    question: "How secure is our school's data?",
    answer: "Security is our top priority. We use enterprise-grade encryption, regular security audits, and comply with international data protection standards including FERPA and GDPR. Each school's data is completely isolated in our multi-tenant architecture. We perform daily backups and have 99.9% uptime SLA."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide multiple support channels: email support for all plans, priority email for Professional plans, and 24/7 phone support for Enterprise customers. Our average response time is under 2 hours. We also have an extensive knowledge base, video tutorials, and community forum."
  },
  {
    question: "Can parents access the system?",
    answer: "Yes! Parents get their own portal where they can view their child's attendance, grades, homework assignments, and receive school announcements. They can also communicate with teachers and update emergency contact information. Access is secure and role-based."
  },
  {
    question: "Does SchoolFlow work on mobile devices?",
    answer: "SchoolFlow is fully responsive and works seamlessly on all devices - smartphones, tablets, and computers. Teachers can mark attendance on the go, parents can check updates anywhere, and administrators have full access from any device with an internet connection."
  },
  {
    question: "Can we customize SchoolFlow for our school's specific needs?",
    answer: "Yes! The Professional plan includes customization options like custom fields, report templates, and branding. Enterprise customers get full white-labeling, custom integrations, and dedicated development for unique requirements. We work with you to match your existing workflows."
  },
  {
    question: "What happens if we need to cancel?",
    answer: "You can cancel anytime with no long-term contracts or cancellation fees. We provide a 30-day money-back guarantee for all paid plans. If you cancel, you'll have access until the end of your billing period, and we'll help you export all your data in standard formats."
  },
  {
    question: "Do you integrate with other educational tools?",
    answer: "Yes! SchoolFlow integrates with popular tools like Google Classroom, Microsoft Teams, Zoom, payment gateways, SMS providers, and more. Enterprise plans include custom API access for building integrations with any third-party system your school uses."
  }
];

export function FAQSection() {
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
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about SchoolFlow
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
