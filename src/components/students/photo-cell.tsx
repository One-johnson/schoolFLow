'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap } from 'lucide-react';

interface PhotoCellProps {
  photoStorageId: Id<'_storage'> | undefined;
  firstName: string;
  lastName: string;
}

export function PhotoCell({ photoStorageId, firstName, lastName }: PhotoCellProps) {
  const photoUrl = useQuery(
    api.photos.getFileUrl,
    photoStorageId ? { storageId: photoStorageId } : 'skip'
  );

  return (
    <div className="flex items-center justify-center">
      <Avatar className="h-10 w-10">
        <AvatarImage src={photoUrl || undefined} alt={`${firstName} ${lastName}`} />
        <AvatarFallback>
          <GraduationCap className="h-5 w-5 text-gray-500" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
