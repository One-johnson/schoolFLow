"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home } from "lucide-react";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        className="text-center space-y-8 max-w-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-5 shadow-xl">
            <GraduationCap className="h-14 w-14 text-white" />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1
            className="text-8xl font-extrabold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            404
          </motion.h1>

          <motion.h2
            className="text-4xl font-semibold text-foreground"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            Page Not Found
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Oops! The page you are trying to access does not exist or may have
            been moved.
          </motion.p>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/">
            <Button className="gap-2 px-6 py-6 text-lg rounded-xl hover:scale-105 transition-transform">
              <Home className="h-5 w-5" />
              Go Back Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
