import { query } from "./_generated/server";

export const getRequests = query({
  args: {},
  handler: async () => {
    // Mock support data - in production this would come from a database table
    return [
      {
        id: "sup1",
        schoolName: "Springfield High School",
        subject: "Payment processing issue",
        status: "in_progress" as const,
        priority: "high" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "sup2",
        schoolName: "Riverside Academy",
        subject: "Account access problem",
        status: "open" as const,
        priority: "medium" as const,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  },
});
