"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Lock,
  GraduationCap,
  Sun,
  Moon,
  ArrowLeft,
  Hash,
  Mail,
  Sparkles,
} from "lucide-react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { StudentIllustration } from "@/components/student/student-illustration";

export default function StudentLoginPage(): React.JSX.Element {
  const { login } = useStudentAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const looksLikeEmail = formData.loginId.includes("@");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!formData.loginId.trim() || !formData.password) {
      toast.error("Student ID (or email) and password are required");
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.loginId.trim(), formData.password);

      if (result.success) {
        toast.success("Welcome back!");
        router.push(result.redirectTo || "/student");
      } else {
        toast.error(result.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.35),transparent),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(217,70,239,0.12),transparent),radial-gradient(ellipse_60%_40%_at_0%_80%,rgba(124,58,237,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(9,9,11,0.4)_50%,rgba(9,9,11,0.95)_100%)]"
        aria-hidden
      />

      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 h-16 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:inline font-bold text-lg tracking-tight">SchoolFlow</span>
          </Link>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-white/10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-center px-10 xl:px-16 py-12 border-r border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              Student space
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1]">
              Your classes,{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                one sign-in
              </span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Homework, timetable, and profile—keep track of school in one place.
            </p>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                Use the Student ID from your school (or your school email if you have one)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                First-time password is usually your Student ID—change it anytime in Profile
              </li>
            </ul>
            <div className="flex justify-center pt-4">
              <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <StudentIllustration
                  variant="welcome"
                  className="max-w-[220px] opacity-95 xl:max-w-[260px]"
                  alt=""
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div
              className={cn(
                "relative rounded-2xl p-[1px] bg-gradient-to-br from-violet-400/60 via-fuchsia-500/40 to-violet-600/50",
                "shadow-2xl shadow-violet-950/50",
              )}
            >
              <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/5 px-6 py-8 sm:px-8 sm:py-10">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-40 blur-xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-600/40">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2 mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Student login
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Sign in with your student ID or school email
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="loginId" className="text-zinc-300">
                      Student ID or email
                    </Label>
                    <div className="relative group">
                      {looksLikeEmail ? (
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400/80 transition-colors group-focus-within:text-fuchsia-400" />
                      ) : (
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400/80 transition-colors group-focus-within:text-fuchsia-400" />
                      )}
                      <Input
                        id="loginId"
                        name="loginId"
                        type="text"
                        autoComplete="username"
                        placeholder="e.g. AB123456 or you@school.edu"
                        value={formData.loginId}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-zinc-950/80 border-zinc-700/80 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/25"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400/80 transition-colors group-focus-within:text-fuchsia-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-11 bg-zinc-950/80 border-zinc-700/80 text-white placeholder:text-zinc-600 focus-visible:border-violet-500/60 focus-visible:ring-violet-500/25"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-600/25 border-0 transition-all hover:shadow-violet-500/35 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                  <p className="text-center text-xs text-zinc-500 leading-relaxed pt-1">
                    Forgot your password? Contact your school office—they can reset it for you.
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
