"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface Student {
  id: string;
  studentId: string;
  email: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
  photoUrl?: string;
  role: "student";
}

interface StudentAuthState {
  student: Student | null;
  loading: boolean;
  authenticated: boolean;
}

interface LoginResult {
  success: boolean;
  message: string;
  student?: Student;
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

export function useStudentAuth() {
  const [state, setState] = useState<StudentAuthState>({
    student: null,
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get<{
        authenticated: boolean;
        student?: Student;
      }>("/api/student-auth/session", axiosDefaults);

      if (data.authenticated && data.student) {
        setState({
          student: data.student,
          loading: false,
          authenticated: true,
        });
      } else {
        setState({
          student: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch {
      setState({
        student: null,
        loading: false,
        authenticated: false,
      });
    }
  }, []);

  // Same mount hydration as useTeacherAuth / useParentAuth (session cookie → client state).
  useEffect(() => {
    const t = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(t);
  }, [checkAuth]);

  const login = async (
    loginId: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const { data } = await axios.post<{
        success: boolean;
        message: string;
        student?: Student;
        redirectTo?: string;
      }>("/api/student-auth/login", { loginId, password }, axiosDefaults);

      if (data.success && data.student) {
        setState({
          student: {
            id: data.student.id,
            studentId: data.student.studentId,
            email: data.student.email ?? "",
            schoolId: data.student.schoolId,
            firstName: data.student.firstName,
            lastName: data.student.lastName,
            classId: data.student.classId,
            className: data.student.className,
            photoUrl: data.student.photoUrl,
            role: "student",
          },
          loading: false,
          authenticated: true,
        });
      }

      return {
        success: data.success,
        message: data.message,
        student: data.student,
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
      await axios.post("/api/student-auth/logout", null, axiosDefaults);

      setState({
        student: null,
        loading: false,
        authenticated: false,
      });
      router.push("/student/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setState({
        student: null,
        loading: false,
        authenticated: false,
      });
      router.push("/student/login");
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> => {
    try {
      const { data, status } = await axios.post<{ message?: string; error?: string }>(
        "/api/student-auth/change-password",
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
