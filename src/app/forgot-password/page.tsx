"use client";

import { LandingHeader } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { motion } from "framer-motion";
import { KeyRound, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = [
  { value: "super-admin", label: "Super Admin" },
  { value: "school-admin", label: "School Admin" },
  { value: "teacher", label: "Teacher" },
] as const;

export default function ForgotPasswordPage(): React.JSX.Element {
  const [formData, setFormData] = useState({
    email: "",
    role: "" as string,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      toast.error("Password reset form is not configured. Please try again later.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.role) {
      toast.error("Please select your account type.");
      setIsSubmitting(false);
      return;
    }

    try {
      const roleLabel = ROLES.find((r) => r.value === formData.role)?.label ?? formData.role;
      const messageBody = `Account type: ${roleLabel}${formData.message ? `\n\nAdditional info: ${formData.message}` : ""}`;

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          name: "Password Reset Request",
          email: formData.email,
          phone: "",
          subject: "Password Reset Request",
          message: messageBody,
          botcheck: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Request sent! We'll process your password reset within 24 hours.");
        setFormData({
          email: "",
          role: "",
          message: "",
        });
      } else {
        toast.error(result.message || "Failed to send request. Please try again.");
      }
    } catch {
      toast.error("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <KeyRound className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Reset Your
              <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Password
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Submit your request below and we&apos;ll reset your password within 24
              hours. Include your email and account type so we can help you quickly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 px-4 pb-24">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Password Reset Request</CardTitle>
                <CardDescription>
                  We&apos;ll verify your identity and process your request manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot - Web3Forms requires checkbox, hidden off-screen to avoid hydration mismatch */}
                  <div className="absolute -left-[9999px] top-0" aria-hidden="true">
                    <input
                      type="checkbox"
                      name="botcheck"
                      tabIndex={-1}
                      defaultChecked={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Info (optional)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Any additional details to help us verify your identity..."
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
