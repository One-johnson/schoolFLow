'use client'

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DemoSection() {
  const [showVideoDialog, setShowVideoDialog] = useState<boolean>(false);

  return (
    <>
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-black text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              See SchoolFlow in Action
            </h2>
            <p className="text-lg text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
              Watch a quick demo or schedule a personalized walkthrough with our team
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gray-800 border-gray-700 hover:border-blue-600 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="rounded-full bg-blue-600 p-6 w-fit mx-auto mb-6">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Watch Demo Video</h3>
                  <p className="text-gray-300 mb-6">
                    See how SchoolFlow works in just 3 minutes. No signup required.
                  </p>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    onClick={() => setShowVideoDialog(true)}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gray-800 border-gray-700 hover:border-cyan-600 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="rounded-full bg-cyan-600 p-6 w-fit mx-auto mb-6">
                    <Calendar className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Schedule Live Demo</h3>
                  <p className="text-gray-300 mb-6">
                    Get a personalized walkthrough tailored to your school's needs.
                  </p>
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-cyan-600 hover:bg-cyan-700 w-full"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Schedule Demo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>SchoolFlow Demo Video</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">Demo video placeholder</p>
              <p className="text-sm text-gray-500 mt-2">
                Your promotional video would be embedded here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
