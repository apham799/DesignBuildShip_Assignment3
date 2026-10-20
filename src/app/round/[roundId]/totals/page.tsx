import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { TotalsScreen } from "./totals-form";

export const metadata: Metadata = { title: "Enter totals" };

export default function TotalsPage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your round…" />}>
      <TotalsScreen />
    </Suspense>
  );
}
