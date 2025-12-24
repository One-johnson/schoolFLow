import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

    // Calculate revenue from active subscriptions
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let monthlyRevenue = 0;
    for (const sub of subscriptions) {
      const plan = await ctx.db.get(sub.planId);
      if (plan) {
        monthlyRevenue += plan.price;
      }
    }

    return {
      totalSchools: schools.length,
      activeSchools,
      totalUsers: users.length,
      totalStudents: students.length,
      activeSessions,
      newSchoolsThisWeek,
      newUsersThisMonth,
      platformRevenue: monthlyRevenue,
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

// Get schools growth data for chart (super admin)
export const getSchoolsGrowthData = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    
    // Get data for the last 6 months
    const now = Date.now();
    const monthsData: Array<{ month: string; schools: number; active: number }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime();
      
      const schoolsInMonth = schools.filter((s) => s.createdAt <= monthEnd).length;
      const activeInMonth = schools.filter(
        (s) => s.createdAt <= monthEnd && s.status === "active"
      ).length;
      
      monthsData.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        schools: schoolsInMonth,
        active: activeInMonth,
      });
    }
    
    return monthsData;
  },
});

// Get user growth data for chart (super admin)
export const getUserGrowthData = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Get data for the last 6 months
    const now = Date.now();
    const monthsData: Array<{ 
      month: string; 
      total: number; 
      teachers: number;
      schoolAdmins: number;
      students: number;
    }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime();
      
      const usersInMonth = users.filter((u) => u.createdAt <= monthEnd);
      const teachersCount = usersInMonth.filter((u) => u.role === "teacher").length;
      const schoolAdminsCount = usersInMonth.filter((u) => u.role === "school_admin").length;
      
      // Get students count from students table
      const students = await ctx.db.query("students").collect();
      const studentsInMonth = students.filter((s) => s.createdAt <= monthEnd).length;
      
      monthsData.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        total: usersInMonth.length + studentsInMonth,
        teachers: teachersCount,
        schoolAdmins: schoolAdminsCount,
        students: studentsInMonth,
      });
    }
    
    return monthsData;
  },
});

// Get student enrollment data for chart (super admin)
export const getStudentEnrollmentData = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    // Get data for the last 6 months
    const now = Date.now();
    const monthsData: Array<{ 
      month: string; 
      enrolled: number;
      graduated: number;
    }> = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime();
      
      // Count students enrolled in this month
      const enrolledInMonth = students.filter(
        (s) => s.createdAt >= monthStart && s.createdAt <= monthEnd
      ).length;
      
      // Count students graduated in this month (assuming updatedAt changes when status changes)
      const graduatedInMonth = students.filter(
        (s) => s.status === "graduated" && s.updatedAt >= monthStart && s.updatedAt <= monthEnd
      ).length;
      
      monthsData.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        enrolled: enrolledInMonth,
        graduated: graduatedInMonth,
      });
    }
    
    return monthsData;
  },
});

// Get school status distribution data for chart (super admin)
export const getSchoolStatusData = query({
  args: {},
  handler: async (ctx) => {
    const schools = await ctx.db.query("schools").collect();
    
    // Group schools by status
    const statusCounts: Record<string, number> = {};
    
    for (const school of schools) {
      const status = school.status || "active";
      // Capitalize first letter
      const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
      statusCounts[displayStatus] = (statusCounts[displayStatus] || 0) + 1;
    }
    
    // Convert to array format for chart
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  },
});

// Get revenue distribution data for chart (super admin)
export const getRevenueDistributionData = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Get all plans
    const plans = await ctx.db.query("subscriptionPlans").collect();
    const planMap = new Map(plans.map((p) => [p._id, p]));

    // Group by plan
    const tierData: Record<
      string,
      { schools: number; revenue: number; price: number }
    > = {};

    for (const sub of subscriptions) {
      const plan = planMap.get(sub.planId);
      if (plan) {
        const tierName = plan.displayName;
        if (!tierData[tierName]) {
          tierData[tierName] = { schools: 0, revenue: 0, price: plan.price };
        }
        tierData[tierName].schools += 1;
        tierData[tierName].revenue += plan.price;
      }
    }

    // Also include schools without active subscriptions (free tier)
    const schools = await ctx.db.query("schools").collect();
    const subscribedSchoolIds = new Set(subscriptions.map((s) => s.schoolId));
    const freeSchools = schools.filter((s) => !subscribedSchoolIds.has(s._id));

    const freePlan = plans.find((p) => p.name === "free");
    if (freePlan && freeSchools.length > 0) {
      tierData[freePlan.displayName] = {
        schools: freeSchools.length,
        revenue: 0,
        price: 0,
      };
    }

    // Convert to array format for chart
    return Object.entries(tierData).map(([tier, data]) => ({
      tier,
      schools: data.schools,
      revenue: data.revenue,
    }));
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
