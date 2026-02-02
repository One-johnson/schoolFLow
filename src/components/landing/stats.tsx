"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface StatProps {
  value: number;
  label: string;
  suffix?: string;
  delay: number;
}

function AnimatedStat({
  value,
  label,
  suffix = "",
  delay,
}: StatProps): React.JSX.Element {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export function Stats(): React.JSX.Element {
  return (
    <section className="py-16 md:py-24 border-y border-border bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <AnimatedStat
            value={500}
            label="Active Schools"
            suffix="+"
            delay={0}
          />
          <AnimatedStat
            value={10000}
            label="Students Managed"
            suffix="+"
            delay={0.1}
          />
          <AnimatedStat
            value={99}
            label="Uptime Guarantee"
            suffix="%"
            delay={0.2}
          />
          <AnimatedStat
            value={24}
            label="Support Available"
            suffix="/7"
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
}
