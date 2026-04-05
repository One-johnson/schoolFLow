import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import {
  SessionManager,
  StudentSessionManager,
  TeacherSessionManager,
  ParentSessionManager,
} from "@/lib/session";
import { getStudentFromSessionCookie } from "@/lib/student-session-server";
function getConvex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export type PushPortalIdentity =
  | { recipientRole: "student"; recipientId: string; schoolId: string }
  | { recipientRole: "teacher"; recipientId: string; schoolId: string }
  | { recipientRole: "parent"; recipientId: string; schoolId: string }
  | { recipientRole: "school_admin"; recipientId: string; schoolId: string };

/** Resolves the signed-in portal user for push subscribe/unsubscribe (cookie sessions). */
export async function getPushPortalIdentity(): Promise<PushPortalIdentity | null> {
  const student = await getStudentFromSessionCookie();
  if (student) {
    return {
      recipientRole: "student",
      recipientId: student.convexStudentId as string,
      schoolId: student.schoolId,
    };
  }

  const convex = getConvex();

  const teacherTok = await TeacherSessionManager.getSessionToken();
  if (teacherTok) {
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: teacherTok,
    });
    if (data?.role === "teacher" && data.schoolId) {
      return {
        recipientRole: "teacher",
        recipientId: data.userId,
        schoolId: data.schoolId,
      };
    }
  }

  const parentTok = await ParentSessionManager.getSessionToken();
  if (parentTok) {
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: parentTok,
    });
    if (data?.role === "parent" && data.schoolId) {
      return {
        recipientRole: "parent",
        recipientId: data.userId,
        schoolId: data.schoolId,
      };
    }
  }

  const adminTok = await SessionManager.getSessionToken();
  if (adminTok) {
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: adminTok,
    });
    if (data?.role === "school_admin" && "schoolId" in data && data.schoolId) {
      return {
        recipientRole: "school_admin",
        recipientId: data.userId as string,
        schoolId: data.schoolId as string,
      };
    }
  }

  return null;
}

export function getPushApiSecret(): string | null {
  return process.env.SCHOOLFLOW_PUSH_API_SECRET?.trim() || null;
}
