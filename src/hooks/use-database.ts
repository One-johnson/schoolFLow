"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, remove, set, serverTimestamp } from 'firebase/database';

export function useDatabase<T extends { id?: string }>(path: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      const loadedData: T[] = [];
      if (val) {
        for (const key in val) {
          loadedData.push({ id: key, ...val[key] });
        }
      }
      setData(loadedData);
    });

    return () => unsubscribe();
  }, [path]);

  const addData = async (newData: Omit<T, 'id'>) => {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    return set(newRef, { ...newData, createdAt: serverTimestamp() });
  };

  const deleteData = async (id: string) => {
    const dbRef = ref(database, `${path}/${id}`);
    return remove(dbRef);
  };

  return { data, addData, deleteData };
}
