
"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, remove, set, serverTimestamp, update } from 'firebase/database';

export function useDatabase<T extends { id?: string }>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      const loadedData: T[] = [];
      if (val) {
        // if it's a list of records
        if (typeof val === 'object' && !Array.isArray(val)) {
            for (const key in val) {
              // Check if the value is an object and has properties, otherwise it could be a simple value.
              if(typeof val[key] === 'object' && val[key] !== null) {
                 loadedData.push({ id: key, ...val[key] });
              } else {
                 // Handle cases where the path leads to a list of simple values if necessary
                 // For now, we assume children are objects with IDs
              }
            }
        } else if (Array.isArray(val)) {
             // Handle array data if your DB uses it (less common in Firebase RTDB)
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
  }, [path]);

  const addData = async (newData: Omit<T, 'id'>) => {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    return set(newRef, { ...newData, createdAt: serverTimestamp() });
  };
  
  const addDataWithId = async (id: string, newData: Omit<T, 'id'>) => {
    const dbRef = ref(database, `${path}/${id}`);
    return set(dbRef, { ...newData, createdAt: serverTimestamp() });
  }

  const updateData = async (id: string, updates: Partial<T> | any) => {
    const dbRef = ref(database, `${path}/${id}`);
    return update(dbRef, updates);
  };
  
  // A more flexible update function that takes a full path
  const updatePath = async (fullPath: string, updates: object) => {
      const dbRef = ref(database, fullPath);
      return update(dbRef, updates);
  }

  const deleteData = async (id: string) => {
    const dbRef = ref(database, `${path}/${id}`);
    return remove(dbRef);
  };

  return { data, loading, addData, addDataWithId, updateData, updatePath, deleteData };
}

    