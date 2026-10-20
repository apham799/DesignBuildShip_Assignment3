import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { HoleScreen } from "./hole-screen";

export const metadata: Metadata = { title: "Hole" };

export default function HolePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your round…" />}>
      <HoleScreen />
    </Suspense>
  );
}
