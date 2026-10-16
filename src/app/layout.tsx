import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIVideoGenerator - AI Video Creator & YouTube Shorts Engine",
  description: "AIVideoGenerator is an automated AI platform for generating split-screen commentary, educational recaps, and publishing shorts directly to YouTube.",
  verification: {
    google: "9o-AZ4mbLABKPwisUXvHYaRhtlTnAoDDvCJOYFayD2o",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-slate-950 text-slate-50 antialiased`}
    >
      <body className="h-full">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
