import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ITMS Admin Dashboard",
  description:
    "Intelligent Traffic Management System - Administrative Control Panel",
};

import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import AlertBanner from "@/components/admin/AlertBanner";
import AuthGate from "@/components/auth/AuthGate";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${inter.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md min-h-screen">
        <AuthGate>
          <div className="flex min-h-screen">
            {/* Sidebar (fixed left, w-64) */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="ml-64 flex flex-col min-h-screen w-full">
              {/* TopBar (sticky top) */}
              <TopBar />

              {/* AlertBanner (below topbar) */}
              <AlertBanner />

              {/* Page content area (scrollable) */}
              <main className="flex-1 p-margin flex flex-col gap-margin overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
