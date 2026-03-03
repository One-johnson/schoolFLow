import type { Metadata, Viewport } from 'next';
import { TeacherLayoutClient } from './TeacherLayoutClient';

export const metadata: Metadata = {
  title: 'SchoolFlow Teacher',
  description: 'Teacher portal for SchoolFlow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SchoolFlow Teacher',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherLayoutClient>{children}</TeacherLayoutClient>;
}
