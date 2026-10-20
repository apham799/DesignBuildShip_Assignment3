"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/badges";
import { challenges, levelLabel, levelOrder } from "@/data/drills";
import { shortDate } from "@/lib/format";
import { achievements, challengeBest, crossedOff } from "@/lib/progress";
import { update, useStore } from "@/lib/storage";
import type { Store } from "@/lib/types";
import { Card, cx, LoadingCard, Page, PageHeader, TextLink } from "@/components/ui";

const groups = ["Rounds", "Practice", "Habits"] as const;

export function BucketListScreen() {
  const store = useStore();
  if (!store) return <LoadingCard label="Loading your bucket list…" />;
  return <BucketList store={store} />;
}

function BucketList({ store }: { store: Store }) {
  const earnedIds = new Set(crossedOff(store).map((a) => a.id));
  const earned = achievements.filter((a) => earnedIds.has(a.id)).sort((a, b) => (store.unlocked[b.id]?.at ?? "").localeCompare(store.unlocked[a.id]?.at ?? ""));
  const toGo = achievements.filter((a) => !earnedIds.has(a.id));

  // Badges earned since the trophy case was last opened unlock here with a "New" tag.
  // Worked out once when the page opens, then the visit is remembered.
  const [fresh] = useState(() => new Set(earned.filter((a) => !store.trophyCaseViewedAt || (store.unlocked[a.id]?.at ?? "") > store.trophyCaseViewedAt).map((a) => a.id)));
  useEffect(() => {
    update((s) => ({ ...s, trophyCaseViewedAt: new Date().toISOString() }));
  }, []);

  return (
    <Page className="gap-8">
      <PageHeader
        title="Your bucket list"
        back={{ href: "/", label: "Home" }}
        description={`${earned.length} of ${achievements.length} badges earned. Each one is a golf goal that ticks itself off from the rounds and practice you log.`}
      />

      <div aria-hidden className="h-3 overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full rounded-full bg-green" style={{ width: `${(earned.length / achievements.length) * 100}%` }} />
      </div>

      <section aria-labelledby="trophies" className="flex flex-col gap-4">
        <h2 id="trophies" className="text-heading">
          Trophy case <span className="text-label text-muted">· {earned.length} earned</span>
        </h2>
        {earned.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {earned.map((a) => {
              const isNew = fresh.has(a.id);
              const order = [...fresh].indexOf(a.id);
              return (
                <li key={a.id}>
                  <Card tone="cream" className="relative flex h-full flex-col items-center gap-2 p-4 text-center">
                    {isNew && <span className="absolute right-2 top-2 rounded-full bg-green px-2 py-0.5 text-label text-on-green">New</span>}
                    <Badge id={a.id} earned size="md" animate={isNew} delay={Math.max(0, order) * 140} />
                    <p className="text-body font-semibold">{a.title}</p>
                    <p className="text-label font-normal text-muted">
                      {a.how}
                      {store.unlocked[a.id] ? ` Earned ${shortDate(store.unlocked[a.id].at)}.` : ""}
                    </p>
                    <span className="sr-only">{isNew ? "New badge." : "Earned."}</span>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <Card className="flex flex-col gap-2">
            <p className="text-body">No badges yet. Your first one is a single round away.</p>
            <TextLink href="/play">Start a round</TextLink>
          </Card>
        )}
      </section>

      <section aria-labelledby="to-go" className="flex flex-col gap-4">
        <h2 id="to-go" className="text-heading">
          Still on your list <span className="text-label text-muted">· {toGo.length} to go</span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {groups.map((group) => {
            const list = toGo.filter((a) => a.group === group);
            if (!list.length) return null;
            return (
              <section key={group} aria-labelledby={`group-${group}`} className="flex flex-col gap-2">
                <h3 id={`group-${group}`} className="text-label text-muted">
                  {group}
                </h3>
                <ul className="flex flex-col gap-2">
                  {list.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 rounded-lg border border-rule bg-surface p-3">
                      <Badge id={a.id} earned={false} size="sm" />
                      <span className="flex flex-col">
                        <span className="text-body font-semibold">{a.title}</span>
                        <span className="text-label font-normal text-muted">{a.how}</span>
                        <span className="sr-only">Not earned yet.</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="levels" className="flex flex-col gap-3">
        <h2 id="levels" className="text-heading">
          Challenge medals
        </h2>
        <p className="text-body text-muted">Every practice plan ends with a scored challenge. Beat a medal&rsquo;s score to win it.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(challenges).map((c) => {
            const { best, level } = challengeBest(store, c.id);
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-3 p-4">
                  <div>
                    <p className="text-body font-semibold">{c.name}</p>
                    <p className="text-label font-normal text-muted">{best === undefined ? "Not played yet." : `Best: ${best} of ${c.outOf}${level ? ` · ${levelLabel[level]}` : ""}`}</p>
                  </div>
                  <ol className="flex justify-between gap-2">
                    {levelOrder.map((l) => {
                      const won = level !== null && levelOrder.indexOf(level) >= levelOrder.indexOf(l);
                      return (
                        <li key={l} className="flex flex-col items-center gap-1">
                          <Badge level={l} earned={won} size="sm" />
                          <span className={cx("text-label", won ? "text-ink" : "font-normal text-muted")}>
                            {levelLabel[l]} {c.levels[l]}
                          </span>
                          <span className="sr-only">{won ? "won" : "not yet"}</span>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
