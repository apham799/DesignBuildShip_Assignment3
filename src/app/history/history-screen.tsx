"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteRound } from "@/lib/actions";
import { shortDate, toPar } from "@/lib/format";
import { playedHoles, roundStats } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Round, type Store } from "@/lib/types";
import { Badge, Button, ButtonLink, Card, Columns, LoadingCard, Page, PageHeader } from "@/components/ui";

const feelWord = ["", "Rough", "Meh", "OK", "Good", "Great"];

function exportData(store: Store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bucket-list-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function RoundRow({ round }: { round: Round }) {
  const [confirming, setConfirming] = useState(false);
  const played = playedHoles(round);
  const stats = roundStats(round);
  const href = round.finishedAt ? `/round/${round.id}/summary` : `/round/${round.id}/hole/${round.currentHole}`;
  return (
    <li>
      <Card className="flex flex-col gap-3 p-4">
        <Link href={href} className="flex items-center justify-between gap-4 rounded-md">
          <span className="flex flex-col">
            <span className="text-heading">{round.courseName}</span>
            <span className="text-label font-normal text-muted">
              {shortDate(round.startedAt)} · {played.length} {played.length === 1 ? "hole" : "holes"}
              {round.mode === "totals" && " · totals"}
            </span>
          </span>
          <span className="flex flex-col items-end">
            {played.length > 0 ? (
              <>
                <span className="font-display text-2xl font-semibold">{stats.strokes}</span>
                <span className="text-label font-normal text-muted">{toPar(stats.strokes, stats.par)}</span>
              </>
            ) : (
              <span className="text-label text-muted">No holes</span>
            )}
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {!round.finishedAt && <Badge tone="warning">In progress · resume on hole {round.currentHole}</Badge>}
          {confirming ? (
            <>
              <span className="text-body">Delete this round?</span>
              <Button size="sm" variant="danger" onClick={() => deleteRound(round.id)}>
                Delete
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} aria-label={`Delete round at ${round.courseName} on ${shortDate(round.startedAt)}`}>
              Delete
            </Button>
          )}
        </div>
      </Card>
    </li>
  );
}

export function HistoryScreen() {
  const store = useStore();
  if (!store) return <LoadingCard label="Loading your history…" />;

  return (
    <Page className="gap-8">
      <PageHeader title="History" description="Every round and range session saved on this device." />

      <Columns className="lg:gap-y-8">
        <section aria-labelledby="rounds" className="flex min-w-0 flex-col gap-3 lg:col-span-6">
          <h2 id="rounds" className="text-heading">
            Rounds
          </h2>
          {store.rounds.length ? (
            <ul className="flex flex-col gap-3">
              {store.rounds.map((r) => (
                <RoundRow key={r.id} round={r} />
              ))}
            </ul>
          ) : (
            <Card className="flex flex-col gap-3">
              <p className="text-body">No rounds yet. Your scorecards will collect here.</p>
              <ButtonLink href="/play" className="w-fit">
                Start a round
              </ButtonLink>
            </Card>
          )}
        </section>

        <section aria-labelledby="practice" className="flex min-w-0 flex-col gap-3 lg:col-span-6">
          <h2 id="practice" className="text-heading">
            Practice
          </h2>
          {store.practice.length ? (
            <ul className="flex flex-col gap-3">
              {store.practice.map((p) => (
                <li key={p.id}>
                  <Card className="flex flex-col gap-1.5 p-4">
                    <p className="text-heading">{p.focus === "mixed" ? "Mixed bucket" : categoryLabel[p.focus]}</p>
                    <p className="text-label font-normal text-muted">
                      {shortDate(p.date)} · {p.minutes} min{p.balls ? ` · ${p.balls} balls` : ""} · felt {feelWord[p.feel].toLowerCase()}
                      {p.challengeScore !== undefined && ` · challenge ${p.challengeScore}/${p.challengeOutOf}`}
                    </p>
                    {p.notes && <blockquote className="border-l-4 border-brass pl-3 text-body">{p.notes}</blockquote>}
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="flex flex-col gap-3">
              <p className="text-body">No practice logged yet.</p>
              <ButtonLink href="/practice" className="w-fit">
                Get a practice plan
              </ButtonLink>
            </Card>
          )}
        </section>

        {(store.rounds.length > 0 || store.practice.length > 0) && (
          <section aria-labelledby="backup" className="flex flex-col gap-3 border-t border-rule pt-6 lg:col-span-12">
            <h2 id="backup" className="text-heading">
              Keep a copy
            </h2>
            <p className="text-body text-muted">Everything lives in this browser. Clearing site data erases it, so download a copy now and then.</p>
            <Button variant="secondary" className="w-fit" onClick={() => exportData(store)}>
              Download my data
            </Button>
          </section>
        )}
      </Columns>
    </Page>
  );
}
