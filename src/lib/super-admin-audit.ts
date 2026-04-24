/** Audit rows whose actor is a super admin (excludes school admin / teacher noise). */
export function isSuperAdminAuditActor(
  userId: string,
  userName: string,
  superAdminIds: Set<string>
): boolean {
  if (userId === 'super_admin' || userName === 'Super Admin') return true;
  return superAdminIds.has(userId);
}

export function filterAuditLogsToSuperAdminActivity<
  T extends { userId: string; userName: string; timestamp: string },
>(logs: T[], superAdminConvexIds: string[]): T[] {
  const idSet = new Set(superAdminConvexIds);
  return logs.filter((log) => isSuperAdminAuditActor(log.userId, log.userName, idSet));
}
