import type { Metadata, Viewport } from "next";
import { StudentLayoutClient } from "./StudentLayoutClient";

export const metadata: Metadata = {
  title: "SchoolFlow Student",
  description: "Student portal for SchoolFlow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SchoolFlow Student",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
