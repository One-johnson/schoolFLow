import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get aggregated dashboard summary for parent portal.
 * Returns fee totals, per-child attendance, latest grade, fee status, and report card info.
 */
export const getParentDashboardSummary = query({
  args: {
    schoolId: v.string(),
    children: v.array(
      v.object({
        id: v.string(),
        studentId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        className: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.children.length === 0) {
      return {
        totalOutstandingFees: 0,
        eventsThisWeek: 0,
        childrenSummary: [],
      };
    }

    const studentIds = args.children.flatMap((c) => [c.id, c.studentId]);
    const uniqueStudentIds = [...new Set(studentIds)];

    // Fee obligations
    const obligations = await ctx.db
      .query("feeObligations")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const relevantObligations = obligations.filter((o) =>
      uniqueStudentIds.includes(o.studentId)
    );
    const totalOutstandingFees =
      relevantObligations.reduce((sum, o) => sum + (o.totalBalance ?? 0), 0) ?? 0;

    // Report cards (published)
    const reportCards = await ctx.db
      .query("reportCards")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Events this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const events = await ctx.db
      .query("events")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) =>
        q.and(
          q.gte(q.field("startDate"), weekStartStr),
          q.lt(q.field("startDate"), weekEndStr),
          q.eq(q.field("status"), "upcoming")
        )
      )
      .collect();
    const eventsThisWeek = events.length;

    // Per-child summary
    const childrenSummary = await Promise.all(
      args.children.map(async (child) => {
        // Attendance (uses Convex _id)
        const attendanceRecords = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_student", (q) =>
            q.eq("schoolId", args.schoolId).eq("studentId", child.id)
          )
          .collect();

        const presentCount = attendanceRecords.filter(
          (r) => r.status === "present" || r.status === "late" || r.status === "excused"
        ).length;
        const totalCount = attendanceRecords.length;
        const attendanceRate =
          totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

        // Marks (try both id and studentId for compatibility)
        let latestMark = await ctx.db
          .query("studentMarks")
          .withIndex("by_student", (q) =>
            q.eq("schoolId", args.schoolId).eq("studentId", child.id)
          )
          .order("desc")
          .first();

        if (!latestMark) {
          latestMark = await ctx.db
            .query("studentMarks")
            .withIndex("by_student", (q) =>
              q.eq("schoolId", args.schoolId).eq("studentId", child.studentId)
            )
            .order("desc")
            .first();
        }

        const latestGrade = latestMark?.grade ?? null;

        // Fee status for this child
        const childObligations = relevantObligations.filter(
          (o) => o.studentId === child.id || o.studentId === child.studentId
        );
        const childBalance = childObligations.reduce(
          (sum, o) => sum + (o.totalBalance ?? 0),
          0
        );
        const feeStatus =
          childBalance > 0 ? `GHS ${childBalance.toFixed(0)} due` : "Paid";

        // Report cards for this child
        const childReportCards = reportCards.filter(
          (r) => r.studentId === child.id || r.studentId === child.studentId
        );
        const hasNewReportCard = childReportCards.length > 0;

        return {
          id: child.id,
          studentId: child.studentId,
          studentName: `${child.firstName} ${child.lastName}`,
          className: child.className,
          attendanceRate,
          latestGrade,
          feeStatus,
          hasNewReportCard,
        };
      })
    );

    return {
      totalOutstandingFees: Math.round(totalOutstandingFees * 100) / 100,
      eventsThisWeek,
      childrenSummary,
    };
  },
});

/**
 * Get chart data for parent dashboard: attendance trend and performance by term.
 */
export const getParentChartsData = query({
  args: {
    schoolId: v.string(),
    children: v.array(
      v.object({
        id: v.string(),
        studentId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.children.length === 0) {
      return { attendanceTrend: [], performanceByTerm: [] };
    }

    const studentIds = args.children.flatMap((c) => [c.id, c.studentId]);
    const uniqueStudentIds = [...new Set(studentIds)];

    // Attendance trend: last 8 weeks, weekly rate per child (aggregate for dashboard)
    const now = new Date();
    const attendanceTrend: { week: string; attendanceRate: number; present: number; total: number }[] = [];

    for (let w = 7; w >= 0; w--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const weekEndStr = weekEnd.toISOString().split("T")[0];
      const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      let totalPresent = 0;
      let totalDays = 0;

      for (const child of args.children) {
        const records = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_student", (q) =>
            q.eq("schoolId", args.schoolId).eq("studentId", child.id)
          )
          .collect();

        const weekRecords = records.filter(
          (r) => r.date >= weekStartStr && r.date <= weekEndStr
        );
        const present = weekRecords.filter(
          (r) =>
            r.status === "present" || r.status === "late" || r.status === "excused"
        ).length;
        totalPresent += present;
        totalDays += weekRecords.length;
      }

      const rate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
      attendanceTrend.push({
        week: weekLabel,
        attendanceRate: rate,
        present: totalPresent,
        total: totalDays,
      });
    }

    // Performance by term: from report cards
    const reportCards = await ctx.db
      .query("reportCards")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const relevantCards = reportCards.filter((r) =>
      uniqueStudentIds.includes(r.studentId)
    );

    const byTerm = new Map<
      string,
      { termLabel: string; percentage: number; count: number; totalPct: number }
    >();

    for (const card of relevantCards) {
      const termLabel =
        [card.academicYearName, card.termName].filter(Boolean).join(" - ") ||
        "Report";
      const existing = byTerm.get(termLabel);
      const pct = card.percentage ?? 0;
      if (existing) {
        existing.totalPct += pct;
        existing.count += 1;
      } else {
        byTerm.set(termLabel, {
          termLabel,
          percentage: pct,
          count: 1,
          totalPct: pct,
        });
      }
    }

    const performanceByTerm = Array.from(byTerm.values())
      .map((v) => ({
        term: v.termLabel,
        percentage: v.count > 0 ? Math.round(v.totalPct / v.count) : 0,
        count: v.count,
      }))
      .sort((a, b) => a.term.localeCompare(b.term));

    return {
      attendanceTrend,
      performanceByTerm,
    };
  },
});

/**
 * Get recent attendance records for parent dashboard (last 14 days).
 */
export const getParentRecentAttendance = query({
  args: {
    schoolId: v.string(),
    children: v.array(
      v.object({
        id: v.string(),
        studentId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        className: v.optional(v.string()),
      })
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.children.length === 0) return [];

    const limit = args.limit ?? 20;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const allRecords: {
      _id: string;
      date: string;
      studentId: string;
      studentName: string;
      status: "present" | "absent" | "late" | "excused";
      session: "morning" | "afternoon" | "full_day";
      className?: string;
    }[] = [];

    for (const child of args.children) {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_student", (q) =>
          q.eq("schoolId", args.schoolId).eq("studentId", child.id)
        )
        .collect();

      const filtered = records
        .filter((r) => r.date >= startStr && r.date <= endStr)
        .map((r) => ({
          _id: r._id,
          date: r.date,
          studentId: r.studentId,
          studentName: `${child.firstName} ${child.lastName}`,
          status: r.status,
          session: r.session,
          className: r.className,
        }));

      allRecords.push(...filtered);
    }

    return allRecords
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, limit);
  },
});
