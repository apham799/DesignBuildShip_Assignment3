import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { NewCourseForm } from "./new-course-form";

export const metadata: Metadata = { title: "Add your course" };

export default function NewCoursePage() {
  return (
    <Suspense fallback={<LoadingCard label="Loading form…" />}>
      <NewCourseForm />
    </Suspense>
  );
}
