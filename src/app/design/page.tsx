import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Design system" };

// Reference page for the shared components. Not in the main nav.
export default function DesignPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Design system" back={{ href: "/", label: "Home" }} description="Clubhouse, revised: white surfaces, two typefaces, four text roles, and red only for errors." />
      <Showcase />
    </div>
  );
}
