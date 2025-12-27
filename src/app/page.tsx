"use client";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Stats } from "@/components/landing/stats";
import { Footer } from "@/components/landing/footer";

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <Hero />
        <Stats />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
