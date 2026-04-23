'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';

/**
 * True when all subscription-related navigation and CTAs should be hidden:
 * the school is public, or there is a pending school creation request for a public school.
 */
export function useSchoolAdminHidesSubscriptionUi(userId: string | undefined): boolean {
  const currentAdmin = useQuery(
    api.schoolAdmins.getById,
    userId ? { id: userId as Id<'schoolAdmins'> } : 'skip',
  );

  const school = useQuery(
    api.schools.getByAdminId,
    currentAdmin ? { adminId: currentAdmin._id } : 'skip',
  );

  const schoolCreationRequests = useQuery(
    api.schoolCreationRequests.getByAdmin,
    currentAdmin ? { schoolAdminId: currentAdmin._id } : 'skip',
  );

  if (currentAdmin === undefined || currentAdmin === null) {
    return false;
  }

  if (school?.schoolType === 'public') {
    return true;
  }

  return (
    schoolCreationRequests?.some(
      (r) => r.status === 'pending' && r.schoolType === 'public',
    ) ?? false
  );
}
