import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import React from "react";

/* Bundled woff2 from @fontsource-variable/inter so `next build` does not need to fetch
 * https://fonts.gstatic.com (fails in offline / restricted CI, and breaks Turbopack when requests fail). */
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
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
