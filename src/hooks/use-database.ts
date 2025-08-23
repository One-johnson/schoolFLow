
"use client";

import { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, remove, set, serverTimestamp, update } from 'firebase/database';

export function useDatabase<T extends { id?: string }>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const stablePath = path; // To satisfy dependency array

  useEffect(() => {
    const dbRef = ref(database, stablePath);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      const loadedData: T[] = [];
      if (val) {
        if (typeof val === 'object' && !Array.isArray(val)) {
            for (const key in val) {
              if(typeof val[key] === 'object' && val[key] !== null) {
                 loadedData.push({ id: key, ...val[key] });
              } else {
                 // This handles cases where the root of the path is an object of simple key-value pairs.
                 // We can treat the main object as a single item with its ID being the last part of the path.
                 const pathSegments = stablePath.split('/');
                 const id = pathSegments[pathSegments.length - 1];
                 setData([{ id, ...val } as T]);
                 setLoading(false);
                 return; // Exit early as we've processed the single object
              }
            }
        } else if (Array.isArray(val)) {
            setData(val);
        }
      }
      setData(loadedData);
      setLoading(false);
    }, (error) => {
        console.error("Firebase onValue error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [stablePath]);

  const addData = useCallback(async (newData: Omit<T, 'id'>) => {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    return set(newRef, { ...newData, createdAt: serverTimestamp() });
  }, [path]);
  
  const addDataWithId = useCallback(async (id: string, newData: Omit<T, 'id'>) => {
    const dbRef = ref(database, `${path}/${id}`);
    return set(dbRef, { ...newData, createdAt: serverTimestamp() });
  }, [path]);

  const updateData = useCallback(async (id: string, updates: Partial<T> | any) => {
    const dbRef = ref(database, `${path}/${id}`);
    return update(dbRef, updates);
  }, [path]);
  
  const updatePath = useCallback(async (fullPath: string, updates: object) => {
      const dbRef = ref(database, fullPath);
      return update(dbRef, updates);
  }, []);

  const deleteData = useCallback(async (id: string) => {
    const dbRef = ref(database, `${path}/${id}`);
    return remove(dbRef);
  }, [path]);

  return { data, loading, addData, addDataWithId, updateData, updatePath, deleteData };
}
