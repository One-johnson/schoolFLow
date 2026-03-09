import type { Metadata, Viewport } from 'next';
import { ParentLayoutClient } from './ParentLayoutClient';

export const metadata: Metadata = {
  title: 'SchoolFlow Parent',
  description: 'Parent portal for SchoolFlow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SchoolFlow Parent',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
