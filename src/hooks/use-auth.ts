
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface AuthState {
  user: User | null;
  name: string | null;
  loading: boolean;
  role: 'admin' | 'teacher' | 'student' | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const userDbRef = ref(database, `users/${user.uid}`);
        
        const unsubscribeDb = onValue(userDbRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setRole(userData.role);
            setName(userData.name || user.displayName);
          } else {
            setRole(null);
            setName(user.displayName);
          }
          setLoading(false);
        }, (error) => {
          console.error("Database error in auth hook:", error);
          setRole(null);
          setName(null);
          setLoading(false);
        });

        // Return the database listener cleanup function
        return () => unsubscribeDb();

      } else {
        setUser(null);
        setRole(null);
        setName(null);
        setLoading(false);
      }
    });

    // Return the auth listener cleanup function
    return () => unsubscribeAuth();
  }, []); // The dependency array should be empty to run only once on mount

  return { user, name, loading, role };
}
