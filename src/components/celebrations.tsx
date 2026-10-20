"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/badges";
import { challengeById, levelLabel, levelOrder, type Level } from "@/data/drills";
import { achievementById, achievements, bestLevels } from "@/lib/progress";
import { update, useStore } from "@/lib/storage";
import type { Store } from "@/lib/types";
import { Button } from "@/components/ui";

type Pending = { key: string; at: string; title: string; detail: string; kind: "achievement" | "level"; id: string; level?: Level };

function pending(store: Store): Pending[] {
  const out: Pending[] = [];
  for (const [id, u] of Object.entries(store.unlocked)) {
    const a = achievementById(id);
    if (a && !u.seen) out.push({ key: `a:${id}`, at: u.at, title: a.title, detail: a.how, kind: "achievement", id });
  }
  for (const [id, l] of Object.entries(store.levels)) {
    const c = challengeById(id);
    if (c && !l.seen)
      out.push({ key: `l:${id}`, at: l.at, title: `${c.name}: ${levelLabel[l.level]}`, detail: `You scored ${c.levels[l.level]} or more of ${c.outOf}.`, kind: "level", id, level: l.level });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

function markSeen(key: string) {
  const [kind, id] = key.split(":");
  update((s) => (kind === "a" ? { ...s, unlocked: { ...s.unlocked, [id]: { ...s.unlocked[id], seen: true } } } : { ...s, levels: { ...s.levels, [id]: { ...s.levels[id], seen: true } } }));
}

// Watches saved data for newly earned achievements and challenge levels, records
// them, and shows them one at a time at the top of the page (never over inputs).
export function Celebrations() {
  const store = useStore();

  useEffect(() => {
    if (!store) return;
    const now = new Date().toISOString();
    const newAchievements = achievements.filter((a) => !store.unlocked[a.id] && a.done(store));
    const levels = bestLevels(store);
    const newLevels = Object.entries(levels).filter(([id, level]) => {
      const had = store.levels[id]?.level;
      return !had || levelOrder.indexOf(level) > levelOrder.indexOf(had);
    });
    if (!newAchievements.length && !newLevels.length) return;
    update((s) => ({
      ...s,
      unlocked: { ...s.unlocked, ...Object.fromEntries(newAchievements.map((a) => [a.id, { at: now, seen: false }])) },
      levels: { ...s.levels, ...Object.fromEntries(newLevels.map(([id, level]) => [id, { level, at: now, seen: false }])) },
    }));
  }, [store]);

  const queue = store ? pending(store) : [];

  // Dismissing swaps in the next banner, which would drop keyboard focus to the page.
  // After a dismissal, focus goes to the next celebration's button, or once they're all
  // done, to the first control in the page content.
  const wrapper = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const next = wrapper.current?.querySelector<HTMLElement>("button");
    if (next) return next.focus();
    const main = document.getElementById("main");
    const first = [...(main?.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, summary") ?? [])].find((el) => !wrapper.current?.contains(el) && el.offsetParent !== null);
    first?.focus();
  });
  const dismiss = (key: string) => {
    refocus.current = true;
    markSeen(key);
  };
  const current = queue[0];

  return (
    <div ref={wrapper} role="status" aria-live="polite" className="empty:hidden">
      {current && (
        <section
          key={current.key}
          aria-label="Celebration"
          className="mb-6 flex items-center gap-4 rounded-lg border-2 border-brass bg-cream p-4 shadow-lift motion-safe:animate-[celebrate_400ms_ease-out]"
        >
          <Badge id={current.id} level={current.level} earned size="lg" animate />
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-label text-muted">{current.kind === "level" ? "New medal" : "Badge earned · crossed off your bucket list"}</p>
            <p className="text-heading">{current.title}</p>
            <p className="text-body">{current.detail}</p>
            {queue.length > 1 && <p className="text-label font-normal text-muted">And {queue.length - 1} more to celebrate.</p>}
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Button size="sm" onClick={() => dismiss(current.key)}>
                {queue.length > 1 ? "Nice, next" : "Nice!"}
              </Button>
              <Link
                href="/bucket-list"
                onClick={() => queue.forEach((q) => markSeen(q.key))}
                className="text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
              >
                See your bucket list
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
