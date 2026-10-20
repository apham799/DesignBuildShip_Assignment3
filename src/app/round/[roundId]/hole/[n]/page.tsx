import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { HoleScreen } from "./hole-screen";

// Static on purpose: reading the URL here would stop Next.js prefetching hole pages.
// The hole screen sets the specific title ("Hole 2 of 18, …") once it renders.
export const metadata: Metadata = { title: "Hole" };

export default function HolePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your round…" />}>
      <HoleScreen />
    </Suspense>
  );
}
