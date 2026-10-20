"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { setWeeklyGoal } from "@/lib/actions";
import { achievements, crossedOff, streak, upNext } from "@/lib/progress";
import type { Store } from "@/lib/types";
import { Button, Card, ChoiceGroup, cx } from "@/components/ui";
import { Badge } from "./badges";
import { PuttingGreen } from "./putting-green";

const dotStyle = {
  met: "bg-green border-green",
  mulligan: "bg-brass/30 border-brass",
  missed: "bg-surface border-edge",
  "in-progress": "bg-surface border-green border-dashed",
  before: "bg-cream border-cream-deep",
} as const;

function weekWords(d: { state: string; sessions: number }) {
  const n = `${d.sessions} ${d.sessions === 1 ? "session" : "sessions"}`;
  switch (d.state) {
    case "met":
      return `goal met, ${n}`;
    case "mulligan":
      return `missed, saved by a mulligan, ${n}`;
    case "missed":
      return `missed, ${n}`;
    case "in-progress":
      return `this week, ${n} so far`;
    default:
      return "before you started";
  }
}

// Weeks in a row at the practice goal. Forgiving: one missed week a month is a mulligan.
export function StreakCard({ store }: { store: Store }) {
  const s = streak(store);
  const [editingGoal, setEditingGoal] = useState(false);
  const goalBox = useRef<HTMLDivElement>(null);
  const changeGoal = useRef<HTMLButtonElement>(null);
  const toGo = Math.max(0, s.goal - s.thisWeek);
  // This week's Monday, as the key for where the putt was last shown.
  const week = s.dots[s.dots.length - 1].start.toISOString();
  return (
    <Card as="section" labelledBy="streak" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="streak" className="text-heading">
          Practice streak
        </h2>
        <p className="text-body">
          <span className="font-display text-2xl font-semibold">{s.weeks}</span> {s.weeks === 1 ? "week" : "weeks"}
        </p>
      </div>
      <PuttingGreen sessions={s.thisWeek} goal={s.goal} week={week} seen={store.streakSeen?.week === week ? store.streakSeen.sessions : 0} streakWeeks={s.weeks} />
      <p className="text-body">
        This week: <span className="font-semibold">{s.thisWeek}</span> of {s.goal} {s.goal === 1 ? "session" : "sessions"}.{" "}
        {s.metThisWeek ? <span className="font-semibold text-success">Holed it! The streak is safe.</span> : `${toGo} more practice ${toGo === 1 ? "session" : "sessions"} to hole it this week.`}
      </p>
      {editingGoal ? (
        <div ref={goalBox} className="flex flex-col gap-3 rounded-md bg-cream p-3">
          <ChoiceGroup
            legend="Practice sessions a week"
            name="weekly-goal"
            columns={4}
            value={String(s.goal)}
            onChange={(v) => setWeeklyGoal(Number(v))}
            hint="Pick what fits your week. The streak counts the weeks you reach it."
            options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
          />
          <Button
            size="sm"
            variant="secondary"
            className="w-fit"
            onClick={() => {
              setEditingGoal(false);
              requestAnimationFrame(() => changeGoal.current?.focus());
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-3 text-body">
          <span>
            Goal: <span className="font-semibold">{s.goal}</span> {s.goal === 1 ? "session" : "sessions"} a week.
          </span>
          <button
            ref={changeGoal}
            type="button"
            onClick={() => {
              setEditingGoal(true);
              requestAnimationFrame(() => goalBox.current?.querySelector<HTMLInputElement>("input:checked")?.focus());
            }}
            className="rounded-sm text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
          >
            Change goal
          </button>
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <p id="streak-weeks" className="text-label text-ink">
          Last 8 weeks
        </p>
        {/* One dot per week, oldest first; each says what happened that week. */}
        <ol aria-labelledby="streak-weeks" className="grid grid-cols-8 gap-1.5">
          {s.dots.map((d) => (
            <li key={d.start.toISOString()} className={cx("flex h-7 items-center justify-center rounded-full border-2 text-[0.7rem] font-semibold", dotStyle[d.state])}>
              <span aria-hidden>{d.state === "mulligan" ? "M" : d.state === "met" ? <span className="text-on-green">✓</span> : ""}</span>
              <span className="sr-only">
                Week of {d.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: {weekWords(d)}
              </span>
            </li>
          ))}
        </ol>
        <p aria-hidden className="flex flex-wrap gap-x-3 gap-y-1 text-label font-normal text-muted">
          <span className="flex items-center gap-1">
            <span className="grid size-3.5 place-items-center rounded-full bg-green text-[0.55rem] text-on-green">✓</span> goal met
          </span>
          <span className="flex items-center gap-1">
            <span className="grid size-3.5 place-items-center rounded-full border border-brass bg-brass/30 text-[0.55rem] text-ink">M</span> mulligan
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3.5 rounded-full border border-dashed border-green" /> this week
          </span>
        </p>
      </div>
      <p className="text-label font-normal text-muted">
        {s.mulliganUsedThisMonth ? "Mulligan used this month. Next month you get a new one." : "Miss a week? One mulligan a month keeps your streak alive."}
      </p>
    </Card>
  );
}

// Progress on the golf bucket list: the latest badges earned, and the next few to go for.
export function BucketListCard({ store }: { store: Store }) {
  const earned = crossedOff(store).sort((a, b) => (store.unlocked[b.id]?.at ?? "").localeCompare(store.unlocked[a.id]?.at ?? ""));
  const done = earned.length;
  const recent = earned.slice(0, 4); // one row on a phone
  const next = upNext(store, 3);
  return (
    <Card as="section" labelledBy="bucket" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="bucket" className="text-heading">
          Your bucket list
        </h2>
        <p className="text-label text-muted">
          {done} of {achievements.length} badges
        </p>
      </div>
      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-cream-deep">
        <div className="h-full rounded-full bg-green" style={{ width: `${(done / achievements.length) * 100}%` }} />
      </div>
      {recent.length > 0 && (
        <>
          <p className="text-label text-muted">Latest badges</p>
          <ul className="flex flex-wrap items-end gap-3">
            {recent.map((a) => (
              <li key={a.id} className="flex w-16 flex-col items-center gap-1 text-center">
                <Badge id={a.id} earned size="sm" />
                <span className="text-[0.75rem] font-semibold leading-tight text-ink">{a.title}</span>
              </li>
            ))}
            {done > recent.length && <li className="flex h-10 items-center text-label text-muted">+{done - recent.length} more</li>}
          </ul>
        </>
      )}
      {next.length > 0 && (
        <>
          <p className="text-label text-muted">Up next</p>
          <ul className="flex flex-col gap-2">
            {next.map((a) => (
              <li key={a.id} className="flex gap-2 text-body">
                <Badge id={a.id} earned={false} size="xs" />
                <span>
                  <span className="font-semibold">{a.title}</span> · {a.how}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link href="/bucket-list" className="w-fit text-body font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green">
        Open your trophy case
      </Link>
    </Card>
  );
}
