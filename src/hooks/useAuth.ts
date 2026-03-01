"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
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
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      });
    }
  };

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
