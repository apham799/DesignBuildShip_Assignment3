"use client";

import Link from "next/link";
import { useState } from "react";
import { buildPlan, type PlanBlock } from "@/data/drills";
import { clearFocus, lockFocus } from "@/lib/actions";
import { daysAgo } from "@/lib/format";
import { lastFinishedRound } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Category, type Store } from "@/lib/types";
import { Badge, ButtonLink, Card, ChoiceGroup, LoadingCard, PageHeader } from "@/components/ui";

type Minutes = 15 | 30 | 60;

const kindLabel: Record<PlanBlock["kind"], string> = { warmup: "Warm-up", drill: "Drill", challenge: "Challenge" };

function challengeHistory(store: Store, challengeId: string) {
  const scores = store.practice.filter((p) => p.challengeScore !== undefined && p.challengeId === challengeId).map((p) => p.challengeScore!);
  return { best: scores.length ? Math.max(...scores) : undefined, last: scores[0], count: scores.length };
}

export function PracticePlanScreen() {
  const store = useStore();
  const [minutes, setMinutes] = useState<Minutes>(30);
  const [changing, setChanging] = useState(false);
  if (!store) return <LoadingCard label="Loading your plan…" />;

  const focus: Category | "mixed" = store.focus?.category ?? "mixed";
  const plan = buildPlan(focus, minutes);
  const challenge = plan.blocks.find((b) => b.kind === "challenge")?.challenge;
  const history = challenge ? challengeHistory(store, challenge.id) : undefined;
  const lastRound = lastFinishedRound(store);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={focus === "mixed" ? "Starter bucket" : `${categoryLabel[focus]} practice`}
        description={focus === "mixed" ? "A bit of everything, no round needed. Play a round and the plan will focus on what cost you strokes." : "Built from your locked focus. Warm up, work the drills, then finish with a scored challenge."}
      />

      <Card tone="cream" as="section" labelledBy="why" className="flex flex-col gap-3">
        <Badge tone="brass">{store.focus ? "Your focus" : "No focus yet"}</Badge>
        <h2 id="why" className="text-heading">
          Why this plan
        </h2>
        {store.focus ? (
          <>
            <p className="text-body">{store.focus.reason}</p>
            <p className="text-label font-normal text-muted">Locked in {daysAgo(store.focus.lockedAt)}.</p>
          </>
        ) : lastRound ? (
          <p className="text-body">
            You haven&rsquo;t locked in a focus.{" "}
            <Link href={`/round/${lastRound.id}/summary`} className="font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px]">
              See what your last round at {lastRound.courseName} points to
            </Link>
            .
          </p>
        ) : (
          <p className="text-body">A balanced bucket: iron distances, tee shots, and lag putting. Log it afterwards and you&rsquo;ll have your first practice note.</p>
        )}
        {changing ? (
          <ChoiceGroup
            legend="Practice focus"
            name="focus"
            columns={2}
            value={focus}
            onChange={(v) => {
              if (v === "mixed") clearFocus();
              else lockFocus(v as Category, "You picked this focus yourself.");
              setChanging(false);
            }}
            options={[
              { value: "driving", label: "Driving" },
              { value: "approach", label: "Approach" },
              { value: "shortGame", label: "Short game" },
              { value: "putting", label: "Putting" },
              { value: "mixed", label: "Mixed bucket" },
            ]}
          />
        ) : (
          <button type="button" onClick={() => setChanging(true)} className="w-fit rounded-sm text-body font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green">
            Change focus
          </button>
        )}
      </Card>

      <ChoiceGroup
        legend="How long do you have?"
        name="minutes"
        value={String(minutes)}
        onChange={(v) => setMinutes(Number(v) as Minutes)}
        options={[
          { value: "15", label: "15 min" },
          { value: "30", label: "30 min" },
          { value: "60", label: "60 min" },
        ]}
      />

      <section aria-labelledby="plan-title" className="flex flex-col gap-3">
        <h2 id="plan-title" className="text-heading">
          Your {minutes}-minute plan{plan.balls ? ` · about ${plan.balls} balls` : ""}
        </h2>
        <ol className="flex flex-col gap-3">
          {plan.blocks.map((b, i) => (
            <li key={`${b.kind}-${b.title}`}>
              <Card className="flex flex-col gap-2">
                <p className="text-label text-muted">
                  {i + 1} · {kindLabel[b.kind]} · {b.minutes} min{b.where ? ` · ${b.where}` : ""}
                  {b.balls ? ` · ${b.balls} balls` : ""}
                </p>
                <h3 className="text-heading">{b.title}</h3>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-body">
                  {b.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {b.kind === "challenge" && history && history.count > 0 && (
                  <p className="text-body font-semibold">
                    Your best: {history.best} of {b.challenge!.outOf} · Last time: {history.last}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <ButtonLink href={`/practice/log?focus=${focus}&minutes=${minutes}`} size="lg" block>
        Done? Log this session
      </ButtonLink>
    </div>
  );
}
