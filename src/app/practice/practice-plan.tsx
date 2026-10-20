"use client";

import { useState } from "react";
import { buildPlan, type PlanBlock } from "@/data/drills";
import { clearFocus, lockFocus } from "@/lib/actions";
import { daysAgo } from "@/lib/format";
import { lastFinishedRound } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Category, type Store } from "@/lib/types";
import { Badge, Button, ButtonLink, Card, ChoiceGroup, Column, Columns, LoadingCard, MultiChoiceGroup, Page, PageHeader, TextLink, Tip } from "@/components/ui";

type Minutes = 15 | 30 | 60;

const kindLabel: Record<PlanBlock["kind"], string> = { warmup: "Warm-up", drill: "Drill", challenge: "Challenge" };

const areaOptions: { value: Category | "mixed"; label: string }[] = [
  { value: "driving", label: "Driving" },
  { value: "approach", label: "Approach" },
  { value: "shortGame", label: "Short game" },
  { value: "putting", label: "Putting" },
  { value: "mixed", label: "A bit of everything" },
];

const ordinal = ["1st", "2nd", "3rd", "4th"];

function listNames(areas: Category[]) {
  const names = areas.map((c) => categoryLabel[c].toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
}

function challengeHistory(store: Store, challengeId: string) {
  const scores = store.practice.filter((p) => p.challengeScore !== undefined && p.challengeId === challengeId).map((p) => p.challengeScore!);
  return { best: scores.length ? Math.max(...scores) : undefined, last: scores[0], count: scores.length };
}

// Pick one or more areas to practice. The first one picked leads the plan.
function FocusPicker({ initial, onDone, onCancel }: { initial: string[]; onDone: () => void; onCancel?: () => void }) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [error, setError] = useState<string>();
  const areas = picked.filter((v): v is Category => v !== "mixed");

  return (
    <div className="flex flex-col gap-3">
      <MultiChoiceGroup
        legend="What do you want to work on?"
        name="focus"
        columns={2}
        value={picked}
        onChange={(v) => {
          setPicked(v);
          setError(undefined);
        }}
        exclusive={["mixed"]}
        error={error}
        hint="Pick all that apply. Your first pick leads the plan."
        options={areaOptions.map((o) => {
          const i = areas.indexOf(o.value as Category);
          return { ...o, description: i >= 0 && areas.length > 1 ? `${ordinal[i]} priority` : undefined };
        })}
      />
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            if (!picked.length) return setError("Choose at least one area, or a bit of everything.");
            if (picked.includes("mixed")) clearFocus();
            else lockFocus(areas[0], `You picked ${listNames(areas)} yourself. Play a round and Bucket List will check it against your stats.`, undefined, areas.slice(1));
            onDone();
          }}
        >
          Build my plan
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function PracticePlanScreen() {
  const store = useStore();
  const [minutes, setMinutes] = useState<Minutes>(30);
  const [changing, setChanging] = useState(false);
  if (!store) return <LoadingCard label="Loading your plan…" />;

  const focus: Category | "mixed" = store.focus?.category ?? "mixed";
  const also = store.focus?.also ?? [];
  const areas = store.focus ? [store.focus.category, ...also] : [];
  const plan = buildPlan(focus, minutes, also);
  const challenge = plan.blocks.find((b) => b.kind === "challenge")?.challenge;
  const history = challenge ? challengeHistory(store, challenge.id) : undefined;
  const lastRound = lastFinishedRound(store);
  const logHref = `/practice/log?focus=${focus}&minutes=${minutes}${also.length ? `&also=${also.join(",")}` : ""}`;

  return (
    <Page>
      <Columns>
        <Column span={5}>
          <PageHeader
            title={store.focus ? `${areas.map((c) => categoryLabel[c]).join(" + ")} practice` : "Starter bucket"}
            description={
              store.focus
                ? "Built from your focus. Warm up, work the drills, then finish with a scored challenge."
                : "A bit of everything while you decide what to work on. It still ends with a scored challenge."
            }
          />

          <Tip id="practice" title="Finish with the challenge">
            Work through the plan in order. The last block is scored: log that number and next time you&rsquo;ll see your best and your last score right here.
          </Tip>

          {store.focus ? (
            <Card tone="cream" as="section" labelledBy="why" className="flex flex-col gap-3">
              <Badge tone="brass">Your focus</Badge>
              <h2 id="why" className="text-heading">
                Why this plan
              </h2>
              <p className="text-body">{store.focus.reason}</p>
              <p className="text-label font-normal text-muted">Locked in {daysAgo(store.focus.lockedAt)}.</p>
              {changing ? (
                <FocusPicker initial={areas} onDone={() => setChanging(false)} onCancel={() => setChanging(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setChanging(true)}
                  className="w-fit rounded-sm text-body font-semibold text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
                >
                  Change focus
                </button>
              )}
            </Card>
          ) : (
            <Card tone="cream" as="section" labelledBy="pick" className="flex flex-col gap-3">
              <Badge tone="brass">No focus yet</Badge>
              <h2 id="pick" className="text-heading">
                Want a plan built for your game?
              </h2>
              <p className="text-body">Pick what you&rsquo;d like to work on and the drills and challenge will follow it.</p>
              <FocusPicker initial={[]} onDone={() => undefined} />
              {lastRound ? (
                <p className="text-body">
                  Or <TextLink href={`/round/${lastRound.id}/summary`}>see what your last round at {lastRound.courseName} points to</TextLink>.
                </p>
              ) : (
                <p className="text-label font-normal text-muted">Not sure? Play a round and Bucket List will pick for you.</p>
              )}
            </Card>
          )}

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
        </Column>

        <Column span={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <section aria-labelledby="plan-title" className="flex flex-col gap-3">
            <h2 id="plan-title" className="text-heading">
              {store.focus ? "Your" : "Starter"} {minutes}-minute plan{plan.balls ? ` · about ${plan.balls} balls` : ""}
            </h2>
            <ol className="grid gap-3 xl:grid-cols-2">
              {plan.blocks.map((b, i) => (
                <li key={`${b.kind}-${b.title}`} className={b.kind === "challenge" || (plan.blocks.length % 2 === 0 && b.kind === "warmup") ? "xl:col-span-2" : undefined}>
                  <Card className="flex h-full flex-col gap-2">
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
        </Column>

        <Column span={5} className="lg:col-start-1 lg:row-start-2">
          <ButtonLink href={logHref} size="lg" block>
            Done? Log this session
          </ButtonLink>
        </Column>
      </Columns>
    </Page>
  );
}
