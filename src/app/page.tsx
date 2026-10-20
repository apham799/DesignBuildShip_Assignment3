import { Suspense } from "react";
import { LoadingCard } from "@/components/ui";
import { HomeScreen } from "./home-screen";

export default function Home() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <HomeScreen />
    </Suspense>
  );
}
