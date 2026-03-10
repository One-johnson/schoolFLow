"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface ParentStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  className: string;
  classId: string;
  photoStorageId?: string;
}

export interface Parent {
  id: string;
  parentId: string;
  email: string;
  schoolId: string;
  name: string;
  phone?: string;
  studentIds: string[];
  students: ParentStudent[];
  photoUrl?: string;
  role: "parent";
}

interface ParentAuthState {
  parent: Parent | null;
  loading: boolean;
  authenticated: boolean;
}

interface LoginResult {
  success: boolean;
  message: string;
  parent?: Parent;
  redirectTo?: string;
}

interface ChangePasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface UpdateProfileResult {
  success: boolean;
  message?: string;
  error?: string;
}

const axiosDefaults = {
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

export function useParentAuth() {
  const [state, setState] = useState<ParentAuthState>({
    parent: null,
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get<{
        authenticated: boolean;
        parent?: Parent;
      }>("/api/parent-auth/session", axiosDefaults);

      if (data.authenticated && data.parent) {
        setState({
          parent: data.parent,
          loading: false,
          authenticated: true,
        });
      } else {
        setState({
          parent: null,
          loading: false,
          authenticated: false,
        });
      }
    } catch {
      setState({
        parent: null,
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
        parent?: Parent;
        redirectTo?: string;
      }>("/api/parent-auth/login", { email, password }, axiosDefaults);

      if (data.success && data.parent) {
        setState({
          parent: data.parent,
          loading: false,
          authenticated: true,
        });
      }

      return {
        success: data.success,
        message: data.message,
        parent: data.parent,
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
      await axios.post("/api/parent-auth/logout", null, axiosDefaults);

      setState({
        parent: null,
        loading: false,
        authenticated: false,
      });
      router.push("/parent/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setState({
        parent: null,
        loading: false,
        authenticated: false,
      });
      router.push("/parent/login");
    }
  };

  const updateProfile = async (
    updates: { name?: string; email?: string; phone?: string }
  ): Promise<UpdateProfileResult> => {
    try {
      const { data, status } = await axios.post<{
        success?: boolean;
        message?: string;
        error?: string;
      }>("/api/parent-auth/update-profile", updates, axiosDefaults);

      if (status >= 200 && status < 300 && data.success) {
        await checkAuth();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return { success: false, error: String(error.response.data.error) };
      }
      return {
        success: false,
        error: "Failed to update profile. Please try again.",
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> => {
    try {
      const { data, status } = await axios.post<{ message?: string; error?: string }>(
        "/api/parent-auth/change-password",
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
    updateProfile,
    checkAuth,
  };
}
