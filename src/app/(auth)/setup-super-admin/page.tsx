"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { setAuthTokenClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Shield, AlertCircle, User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Crown, Server, Settings, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function SetupSuperAdminPage() {
  const router = useRouter();
  const createSuperAdmin = useMutation(api.auth.createSuperAdmin);
  const superAdminExists = useQuery(api.auth.superAdminExists);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Redirect if super admin already exists
  useEffect(() => {
    if (superAdminExists) {
      router.push("/login");
    }
  }, [superAdminExists, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createSuperAdmin({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      // Store token in cookie
      setAuthTokenClient(result.token);

      toast.success("Super admin account created successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create super admin");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking if super admin exists
  if (superAdminExists === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Don't render form if super admin already exists (will redirect)
  if (superAdminExists) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Branding & Info */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.3, 1],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        />

        <div className="relative z-10">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-3 mb-12"
          >
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">SchoolFlow</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Platform Super Administrator Setup
            </h1>
            <p className="text-blue-100 text-lg">
              Initialize the platform with the highest level of access and control.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="rounded-lg bg-white/10 p-2 mt-1">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Full Platform Access</h3>
                <p className="text-blue-100 text-sm">
                  Manage all schools, users, and system-wide settings from a single dashboard
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="rounded-lg bg-white/10 p-2 mt-1">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">System Configuration</h3>
                <p className="text-blue-100 text-sm">
                  Configure platform-wide policies, security settings, and feature flags
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="rounded-lg bg-white/10 p-2 mt-1">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Global Analytics</h3>
                <p className="text-blue-100 text-sm">
                  Monitor platform health, usage metrics, and performance across all schools
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 text-blue-100 text-sm"
        >
          <p className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Secure • Powerful • Comprehensive</span>
          </p>
        </motion.div>
      </motion.div>

      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center pt-8 pb-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-white">SchoolFlow</span>
        </motion.div>
      </div>

      {/* Right Section - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-gray-950 relative">
        {/* Back Button */}
        <Link 
          href="/"
          className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md mt-12 lg:mt-0"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 mb-4"
            >
              <Crown className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Setup Super Administrator
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create the platform super admin account
            </p>
          </div>

          {/* Important Alert */}
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-400 text-sm">
              <strong>Important:</strong> This account has full platform access and can manage all schools. 
              Only one super admin can exist. This is a one-time setup.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-800">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Super Admin Information</span>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@schoolflow.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Super Admin...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Create Super Admin Account
                </>
              )}
            </Button>

            {/* Footer Links */}
            <div className="space-y-3 pt-4">
             
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
