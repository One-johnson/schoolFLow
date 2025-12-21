// Role definitions
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  PRINCIPAL: "principal",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  STAFF: "staff",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const AUTH_COOKIE = "sms_auth_token";

// Client-side auth helpers
export function setAuthTokenClient(token: string): void {
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function getAuthTokenClient(): string | undefined {
  if (typeof document === "undefined") return undefined;
  
  const cookies = document.cookie.split("; ");
  const authCookie = cookies.find((cookie) => cookie.startsWith(`${AUTH_COOKIE}=`));
  return authCookie?.split("=")[1];
}

export function removeAuthTokenClient(): void {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

// Role hierarchy for permission checking
const roleHierarchy: Record<UserRole, number> = {
  super_admin: 7,
  school_admin: 6,
  principal: 5,
  teacher: 4,
  staff: 3,
  parent: 2,
  student: 1,
};

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  staff: "Staff",
};
