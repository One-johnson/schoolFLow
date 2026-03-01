/**
 * ONE-TIME SCRIPT: Wipes all data from every Convex table.
 *
 * Run from project root:
 *   npx convex run clearDatabase:clearAll
 *
 * This uses an internal mutation (not callable from the client).
 * Use only in dev/staging. Do not run in production unless you intend to reset.
 */

import { internalMutation } from "./_generated/server";
import type { TableNames } from "./_generated/dataModel";

const ALL_TABLES: TableNames[] = [
  "attendanceRecords",
  "attendance",
  "attendanceSettings",
  "assessmentMarks",
  "continuousAssessments",
  "reportCards",
  "studentMarks",
  "gradingScales",
  "exams",
  "announcements",
  "eventNotifications",
  "eventRSVPs",
  "events",
  "feeReminders",
  "installments",
  "paymentPlans",
  "feeDiscounts",
  "feePayments",
  "feeStructures",
  "feeCategories",
  "timetableAssignments",
  "timetableTemplates",
  "periods",
  "timetables",
  "terms",
  "academicYears",
  "photos",
  "students",
  "subjects",
  "classes",
  "teachers",
  "supportTicketAttachments",
  "supportTicketMessages",
  "supportTickets",
  "securityAlerts",
  "sessions",
  "loginHistory",
  "userSettings",
  "platformSettings",
  "subscriptionPlans",
  "notifications",
  "auditLogs",
  "schoolCreationRequests",
  "paymentProofs",
  "subscriptionRequests",
  "subscriptions",
  "schoolAdmins",
  "schools",
  "superAdmins",
  "messages",
  "conversations",
];

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deleted: Record<string, number> = {};

    for (const tableName of ALL_TABLES) {
      const docs = await ctx.db.query(tableName).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted[tableName] = docs.length;
    }

    return { ok: true, deleted };
  },
});
