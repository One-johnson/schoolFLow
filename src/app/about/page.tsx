"use client";

import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { motion } from "framer-motion";
import { Target, Eye, Heart, Users, Award, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description:
      "We empower educational institutions with technology that simplifies complex operations.",
  },
  {
    icon: Heart,
    title: "Student-Centric",
    description:
      "Every feature we build ultimately serves to improve student outcomes and experiences.",
  },
  {
    icon: Users,
    title: "Community Focus",
    description:
      "We believe in building strong relationships with schools and listening to their needs.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "We maintain the highest standards in security, reliability, and user experience.",
  },
];

const team = [
  {
    name: "Prince Johnson",
    role: "CEO & Founder",
    image: "",
    bio: "Strong foundation in EdTech and a seasoned developer",
  },
  {
    name: "Dr. Simon Annan",
    role: "Mentor & Chief Technical Officer",
    image: "",
    bio: "Guiding our technical vision and platform architecture",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Product",
    image: "",
    bio: "Product leader with deep understanding of school administration needs",
  },
  {
    name: "David Okafor",
    role: "Head of Customer Success",
    image: "",
    bio: "Dedicated to ensuring every school succeeds with SchoolFlow",
  },
];

const faqs = [
  {
    question:
      "What makes SchoolFlow different from other school management systems?",
    answer:
      "SchoolFlow is built specifically for multi-tenant environments, allowing super admins to manage multiple schools from a single platform while maintaining complete data isolation. Our per-student pricing model is flexible and fair, and our comprehensive audit logging ensures complete transparency and accountability.",
  },
  {
    question: "How secure is SchoolFlow?",
    answer:
      "Security is our top priority. We use encryption for data at rest and in transit, implement strict access controls, maintain comprehensive audit logs, and host on secure cloud infrastructure with regular backups. We are committed to data protection best practices.",
  },
  {
    question: "Can I customize SchoolFlow for my specific needs?",
    answer:
      "Absolutely! SchoolFlow offers extensive customization options including custom branding per school, configurable workflows, flexible permission systems, and customizable reports. Our team also works with clients on custom integrations and feature development.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We provide responsive support via phone and WhatsApp during office hours (Mon–Fri 9am–6pm GMT, Sat 10am–4pm GMT). As an early partner, you will receive hands-on onboarding and direct access to our team. Documentation and training materials are available to help you get started.",
  },
  {
    question: "How does the pricing work?",
    answer:
      "We use a transparent per-student pricing model. Schools pay based on their student count, making it affordable for institutions of all sizes. There are no hidden fees, and you can scale up or down as needed. Contact us for a custom quote based on your requirements.",
  },
  {
    question: "How long does implementation take?",
    answer:
      "We aim to have schools up and running within 2–4 weeks, including setup, staff training, and configuration. As an early partner, you will receive dedicated onboarding support to ensure a smooth transition.",
  },
  {
    question: "Can SchoolFlow integrate with our existing systems?",
    answer:
      "SchoolFlow is built with extensibility in mind. We support integrations with payment gateways and educational tools. Our technical team can discuss custom integration options based on your requirements.",
  },
  {
    question: "What happens to our data if we decide to leave?",
    answer:
      "You own your data. We provide full data export capabilities in standard formats (CSV, JSON, PDF) at any time. If you decide to leave, we will help you export all your data with no retention or export fees.",
  },
  {
    question: "Is training provided for school staff?",
    answer:
      "Yes. We provide live onboarding sessions, documentation, and ongoing support to help your staff get the most out of SchoolFlow. Training is tailored to your school's needs.",
  },
  {
    question: "How often do you release updates?",
    answer:
      "We release updates regularly, with bug fixes and improvements as needed and major features on a planned schedule. Updates are automatic and require no downtime. We welcome feedback and feature suggestions from our partners.",
  },
  {
    question: "Will parents have access to their child's information?",
    answer:
      "Yes. We plan to add a parents portal where guardians can securely access information about their ward—attendance, grades, reports, fees, and more. This keeps families informed and engaged in their child's education.",
  },
];

const milestones = [
  {
    year: "2022",
    title: "The Idea Was Born",
    description:
      "SchoolFlow began with a simple observation: schools spend too much time on administration and too little on what matters—teaching and student success. We set out to build a platform that changes that.",
  },
  {
    year: "2023",
    title: "Research & Validation",
    description:
      "We spent time with school administrators, understanding their workflows, pain points, and aspirations. This research shaped our product roadmap and confirmed the need for a modern, multi-tenant school management platform.",
  },
  {
    year: "2024",
    title: "Platform Development",
    description:
      "We built the core platform—subscription management, multi-school oversight, audit logging, and the tools super admins need to run their operations efficiently and transparently.",
  },
  {
    year: "2025",
    title: "School Admin & Teacher Experience",
    description:
      "We expanded the platform with core features for school administrators and teachers—attendance, gradebooks, timetables, reports, and the tools that power daily operations and classroom workflows.",
  },
  {
    year: "2026",
    title: "Launch & Partner Onboarding",
    description:
      "We plan to launch SchoolFlow and welcome our first partner schools. Our focus is on exceptional onboarding, support, and growing together with the institutions that place their trust in us.",
  },
  {
    year: "Coming Soon",
    title: "Parents Portal",
    description:
      "We plan to introduce a parents portal where guardians can access information about their ward—attendance, grades, reports, fees, and more—keeping families informed and engaged in their child's education.",
  },
];

export default function AboutPage(): React.JSX.Element {
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
              About SchoolFlow
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Empowering Education Through
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Technology
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We&apos;re on a mission to transform school management with
              innovative, intuitive, and powerful software that helps
              educational institutions focus on what matters most: student
              success.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To empower educational institutions worldwide with a
                    comprehensive, user-friendly platform that simplifies school
                    management, reduces administrative burden, and enables
                    educators to focus on what they do best: teaching and
                    nurturing students.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the world&apos;s most trusted school management
                    platform, enabling thousands of educational institutions to
                    operate efficiently, make data-driven decisions, and provide
                    exceptional experiences for students, parents, and staff.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From concept to a platform ready to serve schools
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-linear-to-b from-blue-500 to-purple-600 hidden md:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row gap-8 items-center ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="flex-1" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </div>
                  <Card className="flex-1">
                    <CardHeader>
                      <Badge className="w-fit mb-2">{milestone.year}</Badge>
                      <CardTitle>{milestone.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Our Leadership
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experienced leaders dedicated to transforming education
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center">
                  <CardHeader>
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className="text-2xl bg-linear-to-br from-blue-500 to-purple-600 text-white">
                        {member.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about SchoolFlow
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
