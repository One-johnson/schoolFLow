'use client'

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Calendar, BookOpen } from "lucide-react";

const screenshots = [
  {
    title: "Dashboard Analytics",
    description: "Get real-time insights into your school's performance with comprehensive analytics and visual reports.",
    icon: BarChart,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=80"
  },
  {
    title: "Student Management",
    description: "Manage student records, track attendance, and monitor academic progress all in one place.",
    icon: Users,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop&q=80"
  },
  {
    title: "Attendance Tracking",
    description: "Mark attendance in seconds with an intuitive interface. Generate reports and notify parents instantly.",
    icon: Calendar,
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&h=800&fit=crop&q=80"
  },
  {
    title: "Grade Management",
    description: "Enter grades, generate report cards, and provide detailed feedback to students and parents.",
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=800&fit=crop&q=80"
  }
];

export function ScreenshotsSection() {
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
          Powerful Features, Beautiful Interface
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore SchoolFlow's intuitive interface designed for ease of use
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto"
      >
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            {screenshots.map((screenshot, index) => (
              <TabsTrigger key={index} value={screenshot.title.toLowerCase().replace(' ', '')} className="text-xs md:text-sm">
                <screenshot.icon className="h-4 w-4 mr-2 hidden sm:inline" />
                {screenshot.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {screenshots.map((screenshot, index) => (
            <TabsContent key={index} value={screenshot.title.toLowerCase().replace(' ', '')}>
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <screenshot.icon className="h-6 w-6 text-blue-600" />
                      {screenshot.title}
                    </h3>
                    <p className="text-muted-foreground">{screenshot.description}</p>
                  </div>
                  <div className="rounded-lg overflow-hidden border-2 shadow-2xl">
                    <div 
                      className="w-full h-[400px] md:h-[500px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${screenshot.image})` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </section>
  );
}
