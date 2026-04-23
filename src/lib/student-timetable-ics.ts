import type { Doc } from "../../convex/_generated/dataModel";

type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

const DAY_TO_ICS_BYDAY: Record<Day, string> = {
  monday: "MO",
  tuesday: "TU",
  wednesday: "WE",
  thursday: "TH",
  friday: "FR",
};

/** Jan 1, 2024 is a Monday — anchor dates for each school weekday (YYYYMMDD). */
const DAY_ANCHOR_DATE: Record<Day, string> = {
  monday: "20240101",
  tuesday: "20240102",
  wednesday: "20240103",
  thursday: "20240104",
  friday: "20240105",
};

function icsEscapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatIcsDateTimeLocal(dateYyyymmdd: string, timeHhmm: string): string {
  const [h, m] = timeHhmm.split(":").map((x) => parseInt(x, 10));
  const hh = pad2(Number.isNaN(h) ? 0 : h);
  const mm = pad2(Number.isNaN(m) ? 0 : m);
  return `${dateYyyymmdd}T${hh}${mm}00`;
}

function formatIcsUtcStamp(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    "T" +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    "Z"
  );
}

export type TimetableIcsAssignment = Doc<"timetableAssignments">;

/**
 * Build an iCalendar document for class assignments only (weekly recurrence).
 */
export function buildStudentTimetableIcs(args: {
  className: string;
  assignments: TimetableIcsAssignment[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SchoolFlow//Student Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const stamp = formatIcsUtcStamp(new Date());

  for (const a of args.assignments) {
    const day = a.day as Day;
    if (!DAY_TO_ICS_BYDAY[day]) continue;

    const anchor = DAY_ANCHOR_DATE[day];
    const dtStart = formatIcsDateTimeLocal(anchor, a.startTime);
    const dtEnd = formatIcsDateTimeLocal(anchor, a.endTime);
    const uid = `${String(a._id)}@schoolflow.timetable`;
    const summary = icsEscapeText(a.subjectName || "Class");
    const descParts = [`Class: ${args.className}`];
    if (a.teacherName) descParts.push(`Teacher: ${a.teacherName}`);
    const description = icsEscapeText(descParts.join("\\n"));

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${DAY_TO_ICS_BYDAY[day]}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

export function downloadStudentTimetableIcs(
  content: string,
  filenameBase: string,
): void {
  const safe = filenameBase.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 80);
  const blob = new Blob([content], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe || "timetable"}.ics`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
