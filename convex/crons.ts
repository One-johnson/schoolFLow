import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run trial expiry check daily at 2:00 AM UTC
crons.daily(
  "check trial expiry",
  { hourUTC: 2, minuteUTC: 0 },
  internal.trialManagement.checkAllTrials
);

// Send attendance reminder notifications daily at 8:30 AM UTC
// Teachers in Ghana (GMT) will receive this around 8:30 AM local time
crons.daily(
  "attendance reminder",
  { hourUTC: 8, minuteUTC: 30 },
  internal.attendance.sendAttendanceReminders
);

export default crons;
