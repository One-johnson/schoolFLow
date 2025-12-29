import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_COOKIE_NAME = 'schoolflow_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionData {
  userId: string;
  email: string;
  role: 'super_admin' | 'school_admin';
  schoolId?: string;
  adminRole?: 'owner' | 'admin' | 'moderator'; // For super admin hierarchy
}

export interface SessionToken {
  data: SessionData;
  exp: number;
  iat: number;
}

export class SessionManager {
  static async createSession(data: SessionData): Promise<string> {
    const token = jwt.sign(
      { data },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return token;
  }

  static async getSession(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

      if (!token) {
        return null;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as SessionToken;
      return decoded.data;
    } catch (error) {
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  static async validateSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  static async requireSession(): Promise<SessionData> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }
    return session;
  }

  static async requireSuperAdmin(): Promise<SessionData> {
    const session = await this.requireSession();
    if (session.role !== 'super_admin') {
      throw new Error('Forbidden: Super Admin access required');
    }
    return session;
  }

  static async requireSchoolAdmin(): Promise<SessionData> {
    const session = await this.requireSession();
    if (session.role !== 'school_admin') {
      throw new Error('Forbidden: School Admin access required');
    }
    return session;
  }
}
