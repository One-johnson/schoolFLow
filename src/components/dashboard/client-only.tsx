"use client";

import { JSX, useEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
}

export function ClientOnly({
  children,
}: ClientOnlyProps): React.JSX.Element | null {
  const [hasMounted] = useState<boolean>(() => typeof window !== "undefined");

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
