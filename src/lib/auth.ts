import type { SuperAdmin } from "../types/index";

const SUPER_ADMIN_KEY = "schoolflow_super_admin";
const SESSION_KEY = "schoolflow_session";

export const authService = {
  register: (
    name: string,
    email: string,
    password: string
  ): { success: boolean; message: string } => {
    try {
      const existingAdmin = localStorage.getItem(SUPER_ADMIN_KEY);
      if (existingAdmin) {
        return { success: false, message: "Super Admin already exists" };
      }

      const superAdmin: SuperAdmin = {
        id: crypto.randomUUID(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(superAdmin));
      return { success: true, message: "Registration successful" };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, message: "Registration failed" };
    }
  },

  login: (
    email: string,
    password: string
  ): { success: boolean; message: string } => {
    try {
      const adminData = localStorage.getItem(SUPER_ADMIN_KEY);
      if (!adminData) {
        return { success: false, message: "Invalid credentials" };
      }

      const admin: SuperAdmin = JSON.parse(adminData);
      if (admin.email === email && admin.password === password) {
        const updatedAdmin = { ...admin, lastLogin: new Date().toISOString() };
        localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(updatedAdmin));
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ userId: admin.id, email: admin.email })
        );
        return { success: true, message: "Login successful" };
      }

      return { success: false, message: "Invalid credentials" };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, message: "Login failed" };
    }
  },

  logout: (): void => {
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(SESSION_KEY);
  },

  getCurrentUser: (): SuperAdmin | null => {
    try {
      const adminData = localStorage.getItem(SUPER_ADMIN_KEY);
      return adminData ? JSON.parse(adminData) : null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  },

  updateProfile: (
    name: string,
    email: string
  ): { success: boolean; message: string } => {
    try {
      const adminData = localStorage.getItem(SUPER_ADMIN_KEY);
      if (!adminData) {
        return { success: false, message: "Admin not found" };
      }

      const admin: SuperAdmin = JSON.parse(adminData);
      const updatedAdmin = { ...admin, name, email };
      localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(updatedAdmin));
      return { success: true, message: "Profile updated successfully" };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, message: "Update failed" };
    }
  },

  changePassword: (
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    try {
      const adminData = localStorage.getItem(SUPER_ADMIN_KEY);
      if (!adminData) {
        return { success: false, message: "Admin not found" };
      }

      const admin: SuperAdmin = JSON.parse(adminData);
      if (admin.password !== currentPassword) {
        return { success: false, message: "Current password is incorrect" };
      }

      const updatedAdmin = { ...admin, password: newPassword };
      localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(updatedAdmin));
      return { success: true, message: "Password changed successfully" };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, message: "Password change failed" };
    }
  },
};

export const validatePassword = (
  password: string
): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one special character (!@#$%^&*)",
    };
  }
  return { valid: true, message: "" };
};
