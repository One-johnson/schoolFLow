"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getAuthTokenClient, removeAuthTokenClient, setAuthTokenClient } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import type { Id } from "../../convex/_generated/dataModel";

interface User {
  id: Id<"users">;
  schoolId?: Id<"schools">;
  schoolName: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, schoolId?: Id<"schools">) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  schoolName: string;
  subdomain?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | undefined>();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize token from cookie
  useEffect(() => {
    const authToken = getAuthTokenClient();
    setToken(authToken);
    setIsInitialized(true);
  }, []);

  // Get current user
  const user = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);
  const registerMutation = useMutation(api.auth.registerSchool);

  const login = async (email: string, password: string, schoolId?: Id<"schools">) => {
    try {
      const result = await loginMutation({ email, password, schoolId });
      setAuthTokenClient(result.token);
      setToken(result.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    removeAuthTokenClient();
    setToken(undefined);
  };

  const register = async (data: RegisterData) => {
    try {
      const result = await registerMutation(data);
      setAuthTokenClient(result.token);
      setToken(result.token);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user: user && user.role ? { ...user, role: user.role as UserRole } : null,
    isLoading: !isInitialized || (token !== undefined && user === undefined),
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
