/** localStorage key for in-portal homework text drafts (per student + assignment). */
export function homeworkPortalDraftStorageKey(studentId: string, homeworkId: string): string {
  return `schoolflow:hw-portal-draft:${studentId}:${homeworkId}`;
}
