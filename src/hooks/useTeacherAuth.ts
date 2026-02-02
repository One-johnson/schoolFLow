'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Teacher {
  id: string;
  email: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  classIds: string[];
  role: 'teacher';
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

export function useTeacherAuth() {
  const [state, setState] = useState<TeacherAuthState>({
    teacher: null,
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/teacher-auth/session');
      const data = await response.json();

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
    } catch (error) {
      console.error('Auth check failed:', error);
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/teacher-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.teacher) {
        setState({
          teacher: {
            id: data.teacher.id,
            email: data.teacher.email,
            schoolId: data.teacher.schoolId,
            firstName: data.teacher.firstName,
            lastName: data.teacher.lastName,
            classIds: data.teacher.classIds,
            role: 'teacher',
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
      console.error('Login failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/teacher-auth/logout', { method: 'POST' });
      setState({
        teacher: null,
        loading: false,
        authenticated: false,
      });
      router.push('/teacher/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResult> => {
    try {
      const response = await fetch('/api/teacher-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Password change failed:', error);
      return { success: false, error: 'Failed to change password. Please try again.' };
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
