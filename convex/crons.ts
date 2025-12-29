import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run trial expiry check daily at 2:00 AM UTC
crons.daily(
  "check trial expiry",
  { hourUTC: 2, minuteUTC: 0 },
  internal.trialManagement.checkAllTrials
);

export default crons;
