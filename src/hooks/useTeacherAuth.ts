"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface Teacher {
  id: string;
  teacherId: string;
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

const axiosDefaults = {
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

export function useTeacherAuth() {
  const [state, setState] = useState<TeacherAuthState>({
    teacher: null,
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get<{
        authenticated: boolean;
        teacher?: Teacher;
      }>("/api/teacher-auth/session", axiosDefaults);

      if (data.authenticated && data.teacher) {
        setState({
          teacher: data.teacher,
          loading: false,
          authenticated: true,
        });
      } else {
        setState({
          teacher: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch {
      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const { data } = await axios.post<{
        success: boolean;
        message: string;
        teacher?: Teacher;
        redirectTo?: string;
      }>("/api/teacher-auth/login", { email, password }, axiosDefaults);

      if (data.success && data.teacher) {
        setState({
          teacher: {
            id: data.teacher.id,
            teacherId: data.teacher.teacherId,
            email: data.teacher.email,
            schoolId: data.teacher.schoolId,
            firstName: data.teacher.firstName,
            lastName: data.teacher.lastName,
            classIds: data.teacher.classIds ?? [],
            classNames: data.teacher.classNames ?? [],
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
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Login failed. Please try again.";
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/teacher-auth/logout", null, axiosDefaults);

      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
      router.push("/teacher/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
      router.push("/teacher/login");
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> => {
    try {
      const { data, status } = await axios.post<{ message?: string; error?: string }>(
        "/api/teacher-auth/change-password",
        { currentPassword, newPassword },
        axiosDefaults,
      );

      if (status >= 200 && status < 300) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: String(error.response.data.error) };
      }
      return {
        success: false,
        error: "Failed to change password. Please try again.",
      };
    }
  };

  return {
    ...state,
    login,
    logout,
    changePassword,
    checkAuth,
  };
}
