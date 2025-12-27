import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "SchoolFlow Admin Dashboard",
  description:
    "Manage school operations with ease. Oversee platform metrics, invite admins, monitor schools, handle subscriptions, view reports, and ensure security—all from one powerful dashboard.",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl:
        "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_98699413-59fb-42ca-9dad-75c3964b30ab-Lfv6lqLgD82TSdo15KV2oi8OVmgBIp",
      button: {
        title: "Open with Ohara",
        action: {
          type: "launch_frame",
          name: "SchoolFlow Admin Dashboard",
          url: "https://come-globe-724.app.ohara.ai",
          splashImageUrl:
            "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg",
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};
