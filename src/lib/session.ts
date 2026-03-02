import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "schoolflow_session";
const TEACHER_SESSION_COOKIE_NAME = "schoolflow_teacher_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
  userId: string;
  email: string;
  role: "super_admin" | "school_admin";
  schoolId?: string;
  adminRole?: "owner" | "admin" | "moderator";
}

export interface TeacherSessionData {
  userId: string;
  email: string;
  role: "teacher";
  schoolId: string;
}

/** Opaque session token (stored in Convex); cookie holds only the token. */
export class SessionManager {
  static async setSessionCookie(sessionToken: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }

  static async getSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  }

  static async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

/** Teacher session cookie (opaque token only). */
export class TeacherSessionManager {
  static async setSessionCookie(sessionToken: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(TEACHER_SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }

  static async getSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(TEACHER_SESSION_COOKIE_NAME)?.value ?? null;
  }

  static async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(TEACHER_SESSION_COOKIE_NAME);
  }
}
