import type { Metadata } from "next";
import { BucketListScreen } from "./bucket-list-screen";

export const metadata: Metadata = { title: "Your bucket list" };

export default function BucketListPage() {
  return <BucketListScreen />;
}
