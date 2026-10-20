"use client";

import { challenges, levelLabel, levelOrder } from "@/data/drills";
import { shortDate } from "@/lib/format";
import { achievements, challengeBest, crossedOff } from "@/lib/progress";
import { useStore } from "@/lib/storage";
import { Card, cx, LoadingCard, Page, PageHeader } from "@/components/ui";

const groups = ["Rounds", "Practice", "Habits"] as const;

export function BucketListScreen() {
  const store = useStore();
  if (!store) return <LoadingCard label="Loading your bucket list…" />;
  const done = new Set(crossedOff(store).map((a) => a.id));

  return (
    <Page className="gap-8">
      <PageHeader
        title="Your bucket list"
        back={{ href: "/", label: "Home" }}
        description={`${done.size} of ${achievements.length} crossed off. Everything here ticks itself off from the rounds and practice you log.`}
      />

      <div aria-hidden className="h-3 overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full rounded-full bg-green" style={{ width: `${(done.size / achievements.length) * 100}%` }} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {groups.map((group) => {
          const list = achievements.filter((a) => a.group === group);
          return (
            <section key={group} aria-labelledby={`group-${group}`} className="flex flex-col gap-3">
              <h2 id={`group-${group}`} className="text-heading">
                {group}{" "}
                <span className="text-label text-muted">
                  · {list.filter((a) => done.has(a.id)).length} of {list.length}
                </span>
              </h2>
              <ul className="flex flex-col gap-2">
                {list.map((a) => {
                  const isDone = done.has(a.id);
                  const at = store.unlocked[a.id]?.at;
                  return (
                    <li key={a.id} className={cx("flex items-start gap-3 rounded-lg border p-3", isDone ? "border-success/30 bg-success-tint" : "border-rule bg-surface")}>
                      <span aria-hidden className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", isDone ? "border-green bg-green text-on-green" : "border-edge")}>
                        {isDone && (
                          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                          </svg>
                        )}
                      </span>
                      <span className="flex flex-col">
                        <span className={cx("text-body font-semibold", isDone && "line-through decoration-green/60 decoration-2")}>{a.title}</span>
                        <span className="text-label font-normal text-muted">
                          {a.how}
                          {isDone && at ? ` Crossed off ${shortDate(at)}.` : ""}
                        </span>
                        <span className="sr-only">{isDone ? "Crossed off." : "Not yet."}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section aria-labelledby="levels" className="flex flex-col gap-3">
        <h2 id="levels" className="text-heading">
          Challenge levels
        </h2>
        <p className="text-body text-muted">Every practice plan ends with a scored challenge. Beat a level&rsquo;s score to reach it.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(challenges).map((c) => {
            const { best, level } = challengeBest(store, c.id);
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-2 p-4">
                  <p className="text-body font-semibold">{c.name}</p>
                  <p className="text-label font-normal text-muted">{best === undefined ? "Not played yet." : `Best: ${best} of ${c.outOf}${level ? ` · ${levelLabel[level]}` : ""}`}</p>
                  <ol className="flex gap-2">
                    {levelOrder.map((l) => {
                      const reached = level !== null && levelOrder.indexOf(level) >= levelOrder.indexOf(l);
                      return (
                        <li key={l} className={cx("flex-1 rounded-md border px-2 py-1 text-center text-label", reached ? "border-green bg-green text-on-green" : "border-rule text-ink")}>
                          {levelLabel[l]} {c.levels[l]}
                          <span className="sr-only">{reached ? ", reached" : ", not yet"}</span>
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
