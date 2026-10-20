import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { SummaryScreen } from "./summary-screen";

export const metadata: Metadata = { title: "Round summary" };

export default function SummaryPage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your round…" />}>
      <SummaryScreen />
    </Suspense>
  );
}
