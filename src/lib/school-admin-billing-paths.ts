/** Routes a suspended school admin may access for subscription renewal (billing-only mode). */
const BILLING_PREFIXES = ['/school-admin/subscription', '/school-admin/payment'] as const;

const ADDITIONAL_ALLOWED = [
  '/school-admin/access-blocked',
  '/school-admin/school-suspended',
  '/school-admin/school-deleted',
] as const;

export function isSchoolAdminBillingRenewalPath(pathname: string): boolean {
  for (const p of BILLING_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  for (const p of ADDITIONAL_ALLOWED) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}
