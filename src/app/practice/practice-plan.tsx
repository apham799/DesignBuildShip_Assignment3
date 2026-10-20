"use client";

import { useEffect, useRef, useState } from "react";
import { buildPlan, type PlanBlock, type PracticePlan } from "@/data/drills";
import { clearFocus, lockFocus } from "@/lib/actions";
import { daysAgo } from "@/lib/format";
import { lastFinishedRound } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Category, type Store } from "@/lib/types";
import { Button, ButtonLink, Card, ChoiceGroup, Column, Columns, LoadingCard, MultiChoiceGroup, Page, PageHeader, TextLink, Tip, useFocusSwap } from "@/components/ui";

type Minutes = 15 | 30 | 60;

const kindLabel: Record<PlanBlock["kind"], string> = { warmup: "Warm-up", drill: "Drill", challenge: "Challenge" };

const areas: Category[] = ["driving", "approach", "shortGame", "putting"];

function listNames(list: Category[]) {
  const names = list.map((c) => categoryLabel[c].toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
}

function challengeHistory(store: Store, challengeId: string) {
  const scores = store.practice.filter((p) => p.challengeScore !== undefined && p.challengeId === challengeId).map((p) => p.challengeScore!);
  return { best: scores.length ? Math.max(...scores) : undefined, last: scores[0], count: scores.length };
}

function bringText({ rangeBalls, greenBalls }: PracticePlan["bring"]) {
  const parts = [rangeBalls ? `a bucket of about ${rangeBalls} range balls` : "", greenBalls ? `${greenBalls} of your own balls for the green` : ""].filter(Boolean);
  return parts.join(" and ");
}

// One main focus, then any extras. Easier to read and revise than pick order.
function FocusPicker({
  initialMain,
  initialAlso,
  onDone,
  onCancel,
  autoFocus,
}: {
  initialMain?: Category | "mixed";
  initialAlso: Category[];
  onDone: () => void;
  onCancel?: () => void;
  // Opened by "Change focus": move focus to the current main choice.
  autoFocus?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) box.current?.querySelector<HTMLInputElement>("input:checked, input")?.focus();
  }, [autoFocus]);
  const [main, setMain] = useState<Category | "mixed" | undefined>(initialMain);
  const [also, setAlso] = useState<string[]>(initialAlso);
  const [error, setError] = useState<string>();

  return (
    <div ref={box} className="flex flex-col gap-4">
      <ChoiceGroup
        legend="Main focus"
        required
        name="main-focus"
        columns={2}
        value={main}
        error={error}
        onChange={(v) => {
          setMain(v as Category | "mixed");
          setAlso((list) => list.filter((c) => c !== v));
          setError(undefined);
        }}
        options={[...areas.map((c) => ({ value: c, label: categoryLabel[c] })), { value: "mixed", label: "A bit of everything" }]}
      />
      {main && main !== "mixed" && (
        <MultiChoiceGroup
          legend="Also include"
          optional
          name="also-focus"
          columns={3}
          value={also}
          onChange={setAlso}
          hint="Adds a drill from each. The challenge stays on your main focus."
          options={areas.filter((c) => c !== main).map((c) => ({ value: c, label: categoryLabel[c] }))}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            if (!main) return setError("Choose a main focus, or a bit of everything.");
            if (main === "mixed") clearFocus();
            else {
              const extras = also as Category[];
              lockFocus(main, `You picked ${listNames([main, ...extras])} yourself. Play a round and Bucket List will check it against your stats.`, undefined, extras);
            }
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

function BlockCard({ block, index, history }: { block: PlanBlock; index: number; history?: { best?: number; last?: number; count: number } }) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-label text-muted">
          {index + 1} · {kindLabel[block.kind]} · {block.where}
          {block.rangeBalls ? (
            <>
              {" · "}
              <span aria-hidden>~</span>
              <span className="sr-only">about </span>
              {block.rangeBalls} balls
            </>
          ) : block.carry ? (
            ` · ${block.carry} balls`
          ) : (
            ""
          )}
        </p>
        <p className="shrink-0 font-display text-xl font-semibold">{block.minutes} min</p>
      </div>
      <h3 className="text-heading">{block.title}</h3>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body">
        {block.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="flex items-start gap-2 rounded-md bg-cream px-3 py-2 text-body font-semibold">
        <svg viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-green" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M13.5 8 A5.5 5.5 0 1 1 11.8 4" />
          <path d="M13.5 2.5 V5 H11" />
        </svg>
        {block.repeat}
      </p>
      {block.kind === "challenge" && history && history.count > 0 && (
        <p className="text-body font-semibold">
          Your best: {history.best} of {block.challenge!.outOf} · Last time: {history.last}
        </p>
      )}
    </Card>
  );
}

export function PracticePlanScreen() {
  const store = useStore();
  const [minutes, setMinutes] = useState<Minutes>(30);
  const [changing, setChanging] = useState(false);
  // Open/closed is the golfer's choice; cancelling a focus change leaves it open, so
  // focus can return to the Change focus button.
  const [whyOpen, setWhyOpen] = useState(false);
  // Only after the golfer changes the time, so nothing is announced on load.
  const [planNews, setPlanNews] = useState("");
  const { whenClosed: changeButton } = useFocusSwap(changing);
  if (!store) return <LoadingCard label="Loading your plan…" />;

  const focus: Category | "mixed" = store.focus?.category ?? "mixed";
  const also = store.focus?.also ?? [];
  const chosen = store.focus ? [store.focus.category, ...also] : [];
  const plan = buildPlan(focus, minutes, also);
  const challenge = plan.blocks.find((b) => b.kind === "challenge")?.challenge;
  const history = challenge ? challengeHistory(store, challenge.id) : undefined;
  const lastRound = lastFinishedRound(store);
  const fromRound = store.focus?.fromRoundId ? store.rounds.find((r) => r.id === store.focus!.fromRoundId) : undefined;
  const source = fromRound ? `based on your round at ${fromRound.courseName}` : "your pick";
  const logHref = `/practice/log?focus=${focus}&minutes=${minutes}${also.length ? `&also=${also.join(",")}` : ""}`;

  return (
    <Page>
      <Columns>
        <Column span={5} className="gap-4">
          <PageHeader title={store.focus ? `${chosen.map((c) => categoryLabel[c]).join(" + ")} practice` : "Practice plan"} />

          {store.focus ? (
            <details className="group rounded-lg border border-cream-deep bg-cream px-4 py-3" open={whyOpen || changing} onToggle={(e) => setWhyOpen(e.currentTarget.open)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-body">
                <span>
                  <span className="font-semibold">{chosen.map((c) => categoryLabel[c]).join(" + ")}</span> · {source}
                </span>
                <span className="shrink-0 text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px]">Why this plan</span>
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-body">{store.focus.reason}</p>
                <p className="text-label font-normal text-muted">Locked in {daysAgo(store.focus.lockedAt)}.</p>
                {changing ? (
                  <FocusPicker autoFocus initialMain={store.focus.category} initialAlso={also} onDone={() => setChanging(false)} onCancel={() => setChanging(false)} />
                ) : (
                  <Button ref={changeButton} variant="secondary" size="sm" className="w-fit" onClick={() => setChanging(true)}>
                    Change focus
                  </Button>
                )}
              </div>
            </details>
          ) : (
            <details className="group rounded-lg border border-cream-deep bg-cream px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-body">
                <span>
                  <span className="font-semibold">Starter bucket</span> · a bit of everything
                </span>
                <span className="shrink-0 text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px]">Tailor it to your game</span>
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <FocusPicker initialAlso={[]} onDone={() => undefined} />
                {lastRound ? (
                  <p className="text-body">
                    Or <TextLink href={`/round/${lastRound.id}/summary`}>see what your last round at {lastRound.courseName} points to</TextLink>.
                  </p>
                ) : (
                  <p className="text-label font-normal text-muted">Not sure? Play a round and Bucket List will pick for you.</p>
                )}
              </div>
            </details>
          )}

          <ChoiceGroup
            legend="How long do you have?"
            name="minutes"
            value={String(minutes)}
            onChange={(v) => {
              const m = Number(v) as Minutes;
              setMinutes(m);
              const next = buildPlan(focus, m, also);
              setPlanNews(`Plan updated: ${m} minutes, ${next.blocks.map((b) => b.title).join(", ")}.`);
            }}
            options={[
              { value: "15", label: "15 min" },
              { value: "30", label: "30 min" },
              { value: "60", label: "60 min" },
            ]}
          />
          <p role="status" className="sr-only">
            {planNews}
          </p>
          <p className="text-body">
            <span className="font-semibold">Bring:</span> {bringText(plan.bring)}.
          </p>
        </Column>

        <Column span={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <section aria-labelledby="plan-title" className="flex flex-col gap-3">
            <h2 id="plan-title" className="text-heading">
              {store.focus ? "Your" : "Starter"} {minutes}-minute plan
            </h2>
            <ol className="grid gap-3 xl:grid-cols-2">
              {plan.blocks.map((b, i) => (
                <li key={`${b.kind}-${b.title}`} className={b.kind === "challenge" || (plan.blocks.length % 2 === 0 && b.kind === "warmup") ? "xl:col-span-2" : undefined}>
                  <BlockCard block={b} index={i} history={b.kind === "challenge" ? history : undefined} />
                </li>
              ))}
            </ol>
          </section>
        </Column>

        <Column span={5} className="gap-4 lg:col-start-1 lg:row-start-2">
          <Tip id="practice" title="Finish with the challenge">
            Log the challenge score and next time you&rsquo;ll see your best and your last score on that card.
          </Tip>
          <ButtonLink href={logHref} size="lg" block>
            Done? Log this session
          </ButtonLink>
        </Column>
      </Columns>
    </Page>
  );
}
