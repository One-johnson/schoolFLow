"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "schoolflow_teacher_token";

export interface Teacher {
  id: string;
  email: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  classIds: string[];
  classNames: string[];
  photoUrl?: string;
  role: "teacher";
}

interface TeacherAuthState {
  teacher: Teacher | null;
  loading: boolean;
  authenticated: boolean;
}

interface LoginResult {
  success: boolean;
  message: string;
  teacher?: Teacher;
  redirectTo?: string;
}

interface ChangePasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Helper to get token from localStorage (client-side only)
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Helper to store token in localStorage
function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Helper to remove token from localStorage
function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function useTeacherAuth() {
  const [state, setState] = useState<TeacherAuthState>({
    teacher: null,
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const token = getStoredToken();

      if (!token) {
        setState({
          teacher: null,
          loading: false,
          authenticated: false,
        });
        return;
      }

      const response = await fetch("/api/teacher-auth/session", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid or expired
        removeToken();
        setState({
          teacher: null,
          loading: false,
          authenticated: false,
        });
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.teacher) {
        setState({
          teacher: data.teacher,
          loading: false,
          authenticated: true,
        });
      } else {
        // Token is invalid, remove it
        removeToken();
        setState({
          teacher: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      removeToken();
      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, [checkAuth]);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/teacher-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.teacher && data.token) {
        // Store token in localStorage
        storeToken(data.token);

        setState({
          teacher: {
            id: data.teacher.id,
            email: data.teacher.email,
            schoolId: data.teacher.schoolId,
            firstName: data.teacher.firstName,
            lastName: data.teacher.lastName,
            classIds: data.teacher.classIds,
            classNames: data.teacher.classNames || [],
            photoUrl: data.teacher.photoUrl,
            role: "teacher",
          },
          loading: false,
          authenticated: true,
        });
      }

      return {
        success: data.success,
        message: data.message,
        teacher: data.teacher,
        redirectTo: data.redirectTo,
      };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      // Remove token from localStorage
      removeToken();

      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
      router.push("/teacher/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> => {
    try {
      const token = getStoredToken();

      if (!token) {
        return { success: false, error: "Not authenticated" };
      }

      const response = await fetch("/api/teacher-auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Password change failed:", error);
      return {
        success: false,
        error: "Failed to change password. Please try again.",
      };
    }
  };

  // Export getToken for components that need to make authenticated requests
  const getToken = useCallback(() => getStoredToken(), []);

  return {
    ...state,
    login,
    logout,
    changePassword,
    checkAuth,
    getToken,
  };
}
