
'use client';

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'teacher' | 'student' | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [tokenClaims, setTokenClaims] = useState<any>(null);
  const [_loading, _setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      _setLoading(true);
      if (user) {
        setUser(user);
        try {
          const idTokenResult = await user.getIdTokenResult();
          setTokenClaims(idTokenResult.claims);
        } catch (error) {
          console.error("Error getting user role:", error);
          setTokenClaims(null);
        }
      } else {
        setUser(null);
        setTokenClaims(null);
      }
       _setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role = useMemo(() => (tokenClaims?.role as 'admin' | 'teacher' | 'student') || null, [tokenClaims]);
  
  // The hook is loading if the initial auth state hasn't been determined,
  // or if a user is logged in but we haven't fetched their role yet.
  const loading = _loading || (user != null && tokenClaims === null);


  return { user, loading, role };
}
