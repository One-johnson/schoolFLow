'use client'

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function AnimatedStat({ value, suffix, label, delay }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000 });

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(value);
      }, delay);
    }
  }, [isInView, motionValue, value, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = Math.floor(latest).toString() + suffix;
      }
    });
    return () => unsubscribe();
  }, [springValue, suffix]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div
        ref={ref}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
      >
        0{suffix}
      </div>
      <div className="mt-2 text-sm md:text-base text-muted-foreground">{label}</div>
    </motion.div>
  );
}

const stats = [
  { value: 500, suffix: "+", label: "Schools Using SchoolFlow", delay: 0 },
  { value: 50000, suffix: "+", label: "Students Managed", delay: 200 },
  { value: 99, suffix: ".9%", label: "Uptime Guarantee", delay: 400 },
  { value: 24, suffix: "/7", label: "Support Available", delay: 600 }
];

export function AnimatedStatsSection() {
  return (
    <section className="border-y bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <AnimatedStat
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
