import { query } from "./_generated/server";

export const getData = query({
  args: {},
  handler: async () => {
    // Mock report data - in production this would aggregate from actual data
    return [
      { date: "Jan", schools: 15, revenue: 45000, students: 4200 },
      { date: "Feb", schools: 18, revenue: 52000, students: 4850 },
      { date: "Mar", schools: 22, revenue: 64000, students: 5600 },
      { date: "Apr", schools: 25, revenue: 71000, students: 6300 },
      { date: "May", schools: 28, revenue: 78000, students: 6950 },
      { date: "Jun", schools: 32, revenue: 89000, students: 7800 },
    ];
  },
});
