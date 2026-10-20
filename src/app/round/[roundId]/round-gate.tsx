"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useStore } from "@/lib/storage";
import type { Round, Store } from "@/lib/types";
import { Alert, ButtonLink, LoadingCard, PageHeader } from "@/components/ui";

// Loads the round named in the URL, or explains why it can't.
export function RoundGate({ children }: { children: (round: Round, store: Store) => ReactNode }) {
  const { roundId } = useParams<{ roundId: string }>();
  const store = useStore();
  if (!store) return <LoadingCard label="Loading your round…" />;
  const round = store.rounds.find((r) => r.id === roundId);
  if (!round) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Round not found" back={{ href: "/", label: "Home" }} />
        <Alert title="This round isn't saved on this device">Rounds are saved in the browser you played them in. It may also have been deleted.</Alert>
        <ButtonLink href="/play" className="w-fit">
          Start a round
        </ButtonLink>
      </div>
    );
  }
  return <>{children(round, store)}</>;
}
