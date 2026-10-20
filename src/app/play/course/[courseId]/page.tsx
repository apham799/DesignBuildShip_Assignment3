import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { CourseSetup } from "./course-setup";

export const metadata: Metadata = { title: "Set up your round" };

export default function CoursePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading course…" />}>
      <CourseSetup />
    </Suspense>
  );
}
