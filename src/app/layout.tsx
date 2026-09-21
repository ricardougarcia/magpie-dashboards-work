import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { PortfolioAnalytics } from "@/components/portfolio/portfolio-analytics";
import { analyticsEnvironmentEnabled } from "@/lib/portfolio-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Magpie Dashboards | Rico Garcia",
  description:
    "An interactive portfolio timeline of Rico Garcia’s product leadership across Magpie Dashboards, January through September 2026.",
  applicationName: "Magpie Dashboards Work",
  openGraph: {
    title: "Magpie Dashboards | Rico Garcia",
    description: "Rebuild the system. Restore the trust. A nine-month product leadership case record.",
    type: "website",
  },
  // Indexing is opt-in per intended route, approved environment, and actual host.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f1efe9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Suspense fallback={null}>
          <PortfolioAnalytics enabled={analyticsEnvironmentEnabled({
            VERCEL_ENV: process.env.VERCEL_ENV,
            VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV,
          })} />
        </Suspense>
      </body>
    </html>
  );
}
