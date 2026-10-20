import type { Metadata, Viewport } from "next";
import { Fraunces, Libre_Franklin } from "next/font/google";
import { Suspense } from "react";
import { BadgeStyles } from "@/components/badges";
import { Celebrations } from "@/components/celebrations";
import { DeviceMenu } from "@/components/device-menu";
import { AppNav, NavBar } from "@/components/ui";
import "./globals.css";

// Two typefaces only (Assignment 2 feedback): Fraunces for headings and big numbers,
// Libre Franklin for everything else.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});

const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-franklin",
});

export const metadata: Metadata = {
  title: { default: "Bucket List", template: "%s · Bucket List" },
  description: "Log your golf round hole by hole, see what cost you strokes, and take a practice plan to the range.",
};

export const viewport: Viewport = {
  themeColor: "#f8f2e4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${franklin.variable} antialiased`}>
      <body className="min-h-dvh bg-page text-ink">
        <a href="#main" className="sr-only z-50 rounded-md bg-green px-4 py-3 font-semibold text-on-green focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Suspense fallback={<NavBar path={null} />}>
          <AppNav />
        </Suspense>
        <main id="main" className="mx-auto w-full max-w-[90rem] px-4 pb-36 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:px-12">
          <BadgeStyles />
          <Celebrations />
          {children}
        </main>
        <DeviceMenu />
      </body>
    </html>
  );
}
