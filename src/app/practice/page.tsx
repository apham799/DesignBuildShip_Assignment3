import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { PracticePlanScreen } from "./practice-plan";

export const metadata: Metadata = { title: "Practice plan" };

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading your plan…" />}>
      <PracticePlanScreen />
    </Suspense>
  );
}
