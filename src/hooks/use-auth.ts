
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, get, onValue } from 'firebase/database';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Use onValue for realtime updates to role and name
        const userDbRef = ref(database, `users/${user.uid}`);
        const unsubscribeDb = onValue(userDbRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setRole(userData.role);
            setName(userData.name);
          } else {
            // If no record found, they have no role
            setRole(null);
            setName(user.displayName); // Fallback to auth display name
            console.warn(`No user record found in database for user ${user.uid}`);
          }
          if(loading) setLoading(false);
        }, (dbError) => {
           console.error("Error fetching user role from DB:", dbError);
           setRole(null);
           setName(null);
           if(loading) setLoading(false);
        });

        // This is a cleanup function for the database listener
        return () => unsubscribeDb();

      } else {
        setUser(null);
        setRole(null);
        setName(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loading]);
  
  return { user, name, loading, role };
}
