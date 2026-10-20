import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { HoleScreen } from "./hole-screen";

// The hole number is in the URL, so the tab title (read out on navigation) says which hole.
export async function generateMetadata({ params }: PageProps<"/round/[roundId]/hole/[n]">): Promise<Metadata> {
  const { n } = await params;
  return { title: `Hole ${n}` };
}

export default function HolePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your round…" />}>
      <HoleScreen />
    </Suspense>
  );
}
