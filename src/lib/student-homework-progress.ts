/** Submission state for student homework summaries (Convex-aligned). */
export type StudentHomeworkSubmissionStatus = "none" | "submitted" | "marked";

export function homeworkProgressValue(status: StudentHomeworkSubmissionStatus): number {
  if (status === "marked") return 100;
  if (status === "submitted") return 78;
  return 14;
}

export function homeworkProgressLabel(status: StudentHomeworkSubmissionStatus): string {
  switch (status) {
    case "marked":
      return "Marked";
    case "submitted":
      return "Turned in";
    default:
      return "To do";
  }
}

/** Tailwind classes for `Progress` indicator (child slot). */
export function homeworkProgressIndicatorCn(status: StudentHomeworkSubmissionStatus): string {
  if (status === "marked") {
    return "[&>[data-slot=progress-indicator]]:bg-emerald-600 dark:[&>[data-slot=progress-indicator]]:bg-emerald-500";
  }
  if (status === "submitted") {
    return "[&>[data-slot=progress-indicator]]:bg-blue-600 dark:[&>[data-slot=progress-indicator]]:bg-blue-400";
  }
  return "[&>[data-slot=progress-indicator]]:bg-slate-400/90 dark:[&>[data-slot=progress-indicator]]:bg-slate-500";
}
