import { v } from "convex/values";
import { query } from "./_generated/server";


// Get school-level dashboard statistics
export const getSchoolStats = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    // Get all students in the school
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get active students (exclude graduated students)
    const activeStudents = students.filter((s) => s.status !== "graduated");

    // Get all users in the school
    const users = await ctx.db
      .query("users")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Count teachers
    const teachers = users.filter((u) => u.role === "teacher");
    const activeTeachers = teachers.filter((t) => t.status !== "resigned");
    const teachersOnLeave = teachers.filter((t) => t.status === "on_leave").length;
    const teachersActive = teachers.filter((t) => t.status === "active").length;
    const teachersResigned = teachers.filter((t) => t.status === "resigned").length;

    // Count other staff
    const staff = users.filter((u) => 
      ["principal", "staff", "school_admin"].includes(u.role)
    );

    // Get classes
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get sections
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Get subjects
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const activeSubjects = subjects.filter((s) => s.status === "active");

    // Calculate recent growth (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newStudents = students.filter((s) => s.createdAt > thirtyDaysAgo).length;
    const newTeachers = teachers.filter((t) => t.createdAt > thirtyDaysAgo).length;

    return {
      totalStudents: activeStudents.length,
      totalTeachers: activeTeachers.length,
      teachersActive,
      teachersOnLeave,
      teachersResigned,
      totalStaff: staff.length,
      totalClasses: classes.length,
      totalSections: sections.length,
      totalSubjects: subjects.length,
      activeSubjects: activeSubjects.length,
      newStudentsThisMonth: newStudents,
      newTeachersThisMonth: newTeachers,
    };
  },
});

// Get platform-level dashboard statistics (for super admin)
export const getPlatformDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    const users = await ctx.db.query("users").collect();
    const students = await ctx.db.query("students").collect();
    const sessions = await ctx.db.query("sessions").collect();

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeSchools = schools.filter((s) => s.status === "active").length;
    const newSchoolsThisWeek = schools.filter((s) => s.createdAt > weekAgo).length;
    const newUsersThisMonth = users.filter((u) => u.createdAt > monthAgo).length;
    const activeSessions = sessions.filter((s) => s.expiresAt > now).length;

    // Calculate revenue (mock for now - would need payment/subscription table)
    const premiumSchools = schools.filter(
      (s) => s.subscriptionPlan === "premium"
    ).length;
    const mockMonthlyRevenue = premiumSchools * 99; // $99 per premium school

    return {
      totalSchools: schools.length,
      activeSchools,
      totalUsers: users.length,
      totalStudents: students.length,
      activeSessions,
      newSchoolsThisWeek,
      newUsersThisMonth,
      platformRevenue: mockMonthlyRevenue,
    };
  },
});

// Get recent activities for school dashboard
export const getSchoolRecentActivities = query({
  args: {
    schoolId: v.id("schools"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const activities: Array<{
      _id: string;
      action: string;
      time: string;
      type: string;
    }> = [];

    // Get recent students
    const recentStudents = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .take(5);

    for (const student of recentStudents) {
      const user = await ctx.db.get(student.userId);
      if (user) {
        const timeAgo = getTimeAgo(student.createdAt);
        activities.push({
          _id: student._id,
          action: `New student enrolled: ${user.firstName} ${user.lastName}`,
          time: timeAgo,
          type: "student",
        });
      }
    }

    // Get recent user logins
    const recentSessions = await ctx.db
      .query("sessions")
      .withIndex("by_expires", (q) => q.gt("expiresAt", Date.now()))
      .order("desc")
      .take(5);

    for (const session of recentSessions) {
      if (session.schoolId === args.schoolId) {
        const user = await ctx.db.get(session.userId);
        if (user) {
          const timeAgo = getTimeAgo(session.createdAt);
          activities.push({
            _id: session._id,
            action: `${user.firstName} ${user.lastName} logged in`,
            time: timeAgo,
            type: "login",
          });
        }
      }
    }

    // Get recent classes
    const recentClasses = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .take(3);

    for (const cls of recentClasses) {
      const timeAgo = getTimeAgo(cls.createdAt);
      activities.push({
        _id: cls._id,
        action: `New class created: ${cls.name}`,
        time: timeAgo,
        type: "class",
      });
    }

    // Sort by most recent and limit
    return activities
      .sort((a, b) => {
        // This is a simplified sort - in production you'd want actual timestamps
        return 0;
      })
      .slice(0, args.limit);
  },
});

// Get recent activities for platform dashboard (super admin)
export const getPlatformRecentActivities = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const activities: Array<{
      _id: string;
      action: string;
      time: string;
      type: string;
    }> = [];

    // Get recent schools
    const recentSchools = await ctx.db
      .query("schools")
      .order("desc")
      .take(5);

    for (const school of recentSchools) {
      const timeAgo = getTimeAgo(school.createdAt);
      activities.push({
        _id: school._id,
        action: `New school registered: ${school.name}`,
        time: timeAgo,
        type: "school",
      });
    }

    // Get recent super admin logins
    const recentSessions = await ctx.db
      .query("sessions")
      .order("desc")
      .take(10);

    for (const session of recentSessions) {
      const user = await ctx.db.get(session.userId);
      if (user && user.role === "super_admin") {
        const timeAgo = getTimeAgo(session.createdAt);
        activities.push({
          _id: session._id,
          action: `Super admin login: ${user.firstName} ${user.lastName}`,
          time: timeAgo,
          type: "login",
        });
      }
    }

    // Get recent plan upgrades (check for recent updates with premium plans)
    const schools = await ctx.db.query("schools").collect();
    const recentPremiumSchools = schools
      .filter((s) => s.subscriptionPlan === "premium")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);

    for (const school of recentPremiumSchools) {
      const timeAgo = getTimeAgo(school.updatedAt);
      activities.push({
        _id: school._id,
        action: `${school.name} upgraded to Premium`,
        time: timeAgo,
        type: "upgrade",
      });
    }

    // Sort by most recent and limit
    return activities.slice(0, args.limit);
  },
});

// Helper function to calculate time ago
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
