'use client'

import { motion } from "framer-motion";
import Image from "next/image";

const integrations = [
  { name: "Google Classroom", logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/Google_Classroom_Logo.svg" },
  { name: "Microsoft Teams", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg" },
  { name: "Zoom", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg" },
  { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
  { name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { name: "Twilio", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg" }
];

export function IntegrationsSection() {
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
          Seamlessly Integrates With Your Favorite Tools
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect SchoolFlow with the platforms you already use
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center max-w-5xl mx-auto"
      >
        {integrations.map((integration, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.1 }}
            className="flex items-center justify-center p-4 rounded-lg border-2 bg-card hover:border-blue-600 transition-all duration-300"
          >
            <div className="relative w-24 h-12">
              <Image
                src={integration.logo}
                alt={integration.name}
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <p className="text-muted-foreground">
          Plus hundreds more through our API • Custom integrations available for Enterprise plans
        </p>
      </motion.div>
    </section>
  );
}
