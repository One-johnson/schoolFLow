"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface User {
  userId: string;
  email: string;
  role: "super_admin" | "school_admin";
  schoolId?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      const { data } = await axios.get<{
        authenticated: boolean;
        session: User | null;
      }>("/api/auth/session", { withCredentials: true });

      if (data.authenticated && data.session) {
        setAuthState({
          user: data.session,
          loading: false,
          authenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      const code = axios.isAxiosError<{ code?: string }>(error)
        ? error.response?.data?.code
        : undefined;
      if (axios.isAxiosError(error) && error.response?.status === 403 && code === "SCHOOL_SUSPENDED") {
        router.replace("/school-admin/suspended");
      }
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    }
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(t);
  }, [checkAuth]);

  const logout = async (): Promise<void> => {
    try {
      await axios.post("/api/auth/logout", null, { withCredentials: true });
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    ...authState,
    logout,
    checkAuth,
  };
}
