"use client";

import { createContext, useContext, useMemo, useState } from "react";

type StudentMobileChromeValue = {
  notificationSheetOpen: boolean;
  setNotificationSheetOpen: (open: boolean) => void;
};

const StudentMobileChromeContext = createContext<StudentMobileChromeValue | null>(null);

export function StudentMobileChromeProvider({ children }: { children: React.ReactNode }) {
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const value = useMemo(
    () => ({ notificationSheetOpen, setNotificationSheetOpen }),
    [notificationSheetOpen],
  );
  return (
    <StudentMobileChromeContext.Provider value={value}>{children}</StudentMobileChromeContext.Provider>
  );
}

export function useStudentMobileChrome(): StudentMobileChromeValue {
  const ctx = useContext(StudentMobileChromeContext);
  if (!ctx) {
    throw new Error("useStudentMobileChrome must be used within StudentMobileChromeProvider");
  }
  return ctx;
}
