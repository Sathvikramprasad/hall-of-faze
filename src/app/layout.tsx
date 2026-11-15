import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { SiteNav } from "@/components/layout/SiteNav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hall of FaZe",
  description: "FaZe history, community challenges, and fan-created clips.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={
          <header className="border-b border-white/10 bg-background">
            <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
              <Link href="/" className="text-lg font-black tracking-tight">Hall of <span className="text-accent">FaZe</span></Link>
            </div>
          </header>
        }>
          <SiteNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
