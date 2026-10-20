import type { Metadata } from "next";
import { PracticePlanScreen } from "./practice-plan";

export const metadata: Metadata = { title: "Practice plan" };

export default function PracticePage() {
  return <PracticePlanScreen />;
}
