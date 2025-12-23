'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  FileText,
  DollarSign,
  Shield,
  Zap,
  BarChart,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { ThemeToggle } from "@/components/theme-toggle";


// Import all landing page sections
import { TestimonialsSection } from "../components/landing/testimonials-section";
import { PricingSection } from "../components/landing/pricing-section";
import { FAQSection } from "../components/landing/faq-section";
import { HowItWorksSection } from "../components/landing/how-it-works-section";
import { IntegrationsSection } from "../components/landing/integrations-section";
import { UseCasesSection } from "../components/landing/use-cases-section";
import { ComparisonSection } from "../components/landing/comparison-section";
import { TrustIndicatorsSection } from "@/components/landing/trust-indicators-section";
import { DemoSection } from "../components/landing/demo-section";
import { AnimatedStatsSection } from "../components/landing/animated-stats-section";
import { StickyCtaBar } from "../components/landing/sticky-cta-bar";
import { ExitIntentPopup } from "@/components/landing/exit-intent-popup";
import { ScreenshotsSection } from "../components/landing/screenshots-section";

const heroSlides = [
  {
    title: "Streamline Your School Operations",
    description: "All-in-one platform to manage students, teachers, attendance, grades, and more with ease.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=1080&fit=crop&q=80",
    gradient: "from-blue-600/90 via-cyan-600/80 to-blue-800/90"
  },
  {
    title: "Real-Time Attendance Tracking",
    description: "Mark attendance in seconds and get instant insights with powerful analytics dashboards.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=1080&fit=crop&q=80",
    gradient: "from-purple-600/90 via-pink-600/80 to-purple-800/90"
  },
  {
    title: "Comprehensive Grade Management",
    description: "Enter grades, generate report cards, and track student progress effortlessly.",
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1920&h=1080&fit=crop&q=80",
    gradient: "from-green-600/90 via-emerald-600/80 to-green-800/90"
  },
  {
    title: "Seamless Communication Hub",
    description: "Connect teachers, parents, and students with built-in messaging and announcements.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&h=1080&fit=crop&q=80",
    gradient: "from-orange-600/90 via-red-600/80 to-orange-800/90"
  }
];

const features = [
  {
    icon: Users,
    title: "User Management",
    description: "Multi-role system for admins, teachers, students, and parents with granular permissions."
  },
  {
    icon: Calendar,
    title: "Attendance System",
    description: "Quick daily attendance with automated parent notifications and detailed reports."
  },
  {
    icon: BarChart,
    title: "Grade & Assessment",
    description: "Comprehensive grading system with report cards, progress tracking, and analytics."
  },
  {
    icon: DollarSign,
    title: "Fee Management",
    description: "Track payments, generate invoices, send reminders, and manage school finances."
  },
  {
    icon: BookOpen,
    title: "Homework & Assignments",
    description: "Teachers assign work, students submit online, and parents track progress."
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "Announcements, direct messaging, event calendar, and real-time notifications."
  },
  {
    icon: FileText,
    title: "Academic Structure",
    description: "Manage classes, sections, subjects, terms, and teacher assignments effortlessly."
  },
  {
    icon: Shield,
    title: "Multi-Tenant Ready",
    description: "Serve multiple schools from one platform with complete data isolation."
  }
];

export default function LandingPage() {
  
  // Add smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = (): void => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = (): void => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const slide = heroSlides[currentSlide];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section - Full Screen */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20">
          <div className="container mx-auto flex h-20 items-center justify-between px-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-2 transition-transform group-hover:scale-110">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                SchoolFlow
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-blue-600 hover:bg-white/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 drop-shadow-2xl">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 drop-shadow-lg text-white/95">
                    {slide.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/register">
                      <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6">
                        Start Your 30-Day Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="#features">
                      <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm text-white/80 mt-4">
                    No credit card required • Setup in minutes • Cancel anytime
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-4">
          <button
            onClick={prevSlide}
            className="rounded-full bg-white/20 backdrop-blur-sm p-3 text-white hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? "w-8 bg-white" 
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="rounded-full bg-white/20 backdrop-blur-sm p-3 text-white hover:bg-white/30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center text-white/80">
            <span className="text-sm mb-2">Scroll to explore</span>
            <ChevronRight className="h-6 w-6 rotate-90" />
          </div>
        </motion.div>
      </section>

      {/* Trust Indicators */}
      <TrustIndicatorsSection />

      {/* Animated Stats Section */}
      <AnimatedStatsSection />

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Everything You Need to Run Your School
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to simplify school management and enhance communication
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-2 hover:border-blue-600 transition-all duration-300 h-full group">
                <CardContent className="p-6">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Screenshots Section */}
      <ScreenshotsSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Demo Section */}
      <DemoSection />

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Why Choose Section */}
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
              Why Choose SchoolFlow?
            </h2>
            <p className="text-lg text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
              Built with modern technology for today's educational needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Built on cutting-edge technology for blazing-fast performance and real-time updates"
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Enterprise-grade security with complete data isolation for each school"
              },
              {
                icon: CheckCircle2,
                title: "Easy to Use",
                description: "Intuitive interface designed for users of all technical levels"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="text-center space-y-4"
              >
                <div className="rounded-full bg-blue-600 p-4 w-fit mx-auto">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-300 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join 500+ schools already using SchoolFlow to streamline their operations and improve student outcomes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-lg px-8">
                Start Your Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required • 30-day money-back guarantee • Setup in under 24 hours
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sticky CTA Bar */}
      <StickyCtaBar />

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}
