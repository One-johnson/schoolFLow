import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { StudentSessionManager } from "@/lib/session";
import type { Id } from "../../convex/_generated/dataModel";

function getConvexHttpClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

/** Student resolved from the httpOnly student session cookie (for Route Handlers). */
export type ServerStudentSession = {
  convexStudentId: Id<"students">;
  schoolId: string;
  displayStudentId: string;
  firstName: string;
  lastName: string;
  className: string;
};

export async function getStudentFromSessionCookie(): Promise<ServerStudentSession | null> {
  const token = await StudentSessionManager.getSessionToken();
  if (!token) return null;

  const convex = getConvexHttpClient();
  const data = await convex.query(api.sessions.getSessionWithUser, {
    sessionToken: token,
  });

  if (!data || data.role !== "student") return null;

  const row = await convex.query(api.students.getStudentById, {
    studentId: data.userId as Id<"students">,
  });

  if (!row) return null;

  return {
    convexStudentId: row._id,
    schoolId: row.schoolId,
    displayStudentId: row.studentId,
    firstName: row.firstName,
    lastName: row.lastName,
    className: row.className,
  };
}
