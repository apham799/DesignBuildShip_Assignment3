import type { Metadata } from "next";
import { CoursePicker } from "./course-picker";

export const metadata: Metadata = { title: "Play a round" };

export default function PlayPage() {
  return <CoursePicker />;
}
