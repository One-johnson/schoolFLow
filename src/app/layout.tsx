import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
            <html lang="en" suppressHydrationWarning>
              <head>
                <meta name="theme-color" content="#2563eb" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="SchoolFlow" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
              </head>
              <body
                className={`${inter.variable}  antialiased`}
                suppressHydrationWarning
              >
                <Providers>
                  
     
        {children}
      
      
                </Providers>
              </body>
            </html>
          );
}

export const metadata: Metadata = {
        title: "Schoolfy",
        description: "A multi-tenant school management system with user roles, academic management, attendance tracking, grade entry, and real-time communication features for efficient school operations.",
        other: { "fc:frame": JSON.stringify({"version":"next","imageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_ff04f419-5daf-4bc6-8e06-639d7be902db-Ytt7zqmshpeQx5zKdWCQvrG7ztumUG","button":{"title":"Open with Ohara","action":{"type":"launch_frame","name":"Schoolfy","url":"https://still-final-004.app.ohara.ai","splashImageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg","splashBackgroundColor":"#ffffff"}}}
        ) }
    };
