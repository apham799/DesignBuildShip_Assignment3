import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { PracticeLogScreen } from "./practice-log";

export const metadata: Metadata = { title: "Log practice" };

export default function PracticeLogPage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading form…" />}>
      <PracticeLogScreen />
    </Suspense>
  );
}
