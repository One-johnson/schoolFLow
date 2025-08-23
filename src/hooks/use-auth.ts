
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'teacher' | 'student' | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        try {
          // Attempt to get role from custom claims first for efficiency
          const idTokenResult = await user.getIdTokenResult(true);
          const claimRole = idTokenResult.claims.role as any;

          if (claimRole) {
            setRole(claimRole);
          } else {
            // Fallback to checking Realtime Database if no claim is present
            const userDbRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userDbRef);
            if (snapshot.exists()) {
              setRole(snapshot.val().role); 
            } else {
              setRole(null); // No role found in DB
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  return { user, loading, role };
}
