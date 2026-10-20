"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { buildPlan, levelLabel, nextLevel, type Challenge, type PlanBlock, type PracticePlan } from "@/data/drills";
import { challengeBest, focusCheck, sessionsSinceFocus } from "@/lib/progress";
import { FocusLatest, FocusSuggestion } from "@/components/focus-progress";
import { clearFocus, lockFocus } from "@/lib/actions";
import { daysAgo } from "@/lib/format";
import { lastFinishedRound } from "@/lib/recommend";
import { useStore } from "@/lib/storage";
import { categoryLabel, type Category } from "@/lib/types";
import { Badge, Button, ButtonLink, ChoiceGroup, Column, Columns, LoadingCard, MultiChoiceGroup, Page, PageHeader, TextLink, Tip, useFocusSwap } from "@/components/ui";

type Minutes = 15 | 30 | 60;

const kindLabel: Record<PlanBlock["kind"], string> = { warmup: "Warm-up", drill: "Drill", challenge: "Challenge" };

const areas: Category[] = ["driving", "approach", "shortGame", "putting"];

function listNames(list: Category[]) {
  const names = list.map((c) => categoryLabel[c].toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
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
    if (autoFocus) (box.current?.querySelector<HTMLInputElement>("input:checked") ?? box.current?.querySelector<HTMLInputElement>("input"))?.focus();
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

// Where you stand on this challenge and what the next level needs.
function LevelLine({ challenge, history }: { challenge: Challenge; history: ReturnType<typeof challengeBest> }) {
  const next = nextLevel(challenge, history.best);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {history.level ? <Badge tone="brass">{levelLabel[history.level]}</Badge> : <Badge>No level yet</Badge>}
      <p className="text-body font-semibold">
        {history.count === 0
          ? `First time: ${challenge.levels.bronze} gets you Bronze.`
          : next
            ? `Best ${history.best} of ${challenge.outOf}. ${levelLabel[next.level]} at ${next.score}.`
            : `Best ${history.best} of ${challenge.outOf}. Gold reached; beat your best.`}
      </p>
    </div>
  );
}

// One block of the plan, folded by default so the plan reads at a glance: what's next and
// for how long. Opening it shows the steps and how to fill the time. Native <details>, so
// keyboards and screen readers get expand/collapse for free.
function BlockCard({ block, index, history, open, onToggle }: { block: PlanBlock; index: number; history?: ReturnType<typeof challengeBest>; open: boolean; onToggle: (open: boolean) => void }) {
  return (
    <details open={open} onToggle={(e) => onToggle(e.currentTarget.open)} className="group rounded-lg border border-rule bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none flex-col gap-1 rounded-lg p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-label text-muted">
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
          </span>
          <span className="shrink-0 font-display text-xl font-semibold">{block.minutes} min</span>
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="text-heading">{block.title}</span>
          <span className="flex shrink-0 items-center gap-1 text-label text-green">
            <span className="group-open:hidden">How to</span>
            <span className="hidden group-open:inline">Hide</span>
            <svg viewBox="0 0 16 16" className="size-4 transition-transform group-open:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6 L8 10 L12 6" />
            </svg>
          </span>
        </span>
        {block.kind === "challenge" && history && <LevelLine challenge={block.challenge!} history={history} />}
      </summary>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <ul className="flex list-disc flex-col gap-1 pl-5 text-body">
          {block.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <p className="flex items-start gap-2 rounded-md bg-cream px-3 py-2 text-body font-semibold">
          <svg viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-green" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M13.5 8 A5.5 5.5 0 1 1 11.8 4" />
            <path d="M13.5 2.5 V5 H11" />
          </svg>
          {block.repeat}
        </p>
      </div>
    </details>
  );
}

export function PracticePlanScreen() {
  const store = useStore();
  const [minutes, setMinutes] = useState<Minutes>(30);
  // Which plan cards are open (by title). Everything starts folded.
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const planListId = useId();
  const [changing, setChanging] = useState(false);
  // "Change focus" on other pages links here with ?change=1, which opens the picker.
  const params = useSearchParams();
  const router = useRouter();
  const wantsChange = params.get("change") === "1";
  const [changeLink, setChangeLink] = useState(false);
  if (wantsChange !== changeLink) {
    setChangeLink(wantsChange);
    if (wantsChange) setChanging(true);
  }
  const stopChanging = () => {
    setChanging(false);
    if (wantsChange) router.replace("/practice", { scroll: false });
  };
  // Only after the golfer changes the time, so nothing is announced on load.
  const [planNews, setPlanNews] = useState("");
  const { whenClosed: changeButton } = useFocusSwap(changing);
  if (!store) return <LoadingCard label="Loading your plan…" />;

  const focus: Category | "mixed" = store.focus?.category ?? "mixed";
  const also = store.focus?.also ?? [];
  const chosen = store.focus ? [store.focus.category, ...also] : [];
  const plan = buildPlan(focus, minutes, also);
  const allStepsOpen = plan.blocks.every((b) => openCards[b.title]);
  const challenge = plan.blocks.find((b) => b.kind === "challenge")?.challenge;
  const history = challenge ? challengeBest(store, challenge.id) : undefined;
  const lastRound = lastFinishedRound(store);
  const fromRound = store.focus?.fromRoundId ? store.rounds.find((r) => r.id === store.focus!.fromRoundId) : undefined;
  const check = focusCheck(store);
  const sinceLock = sessionsSinceFocus(store);
  const source = check ? `latest round at ${check.round.courseName}` : fromRound ? `based on your round at ${fromRound.courseName}` : "your pick";
  const logHref = `/practice/log?focus=${focus}&minutes=${minutes}${also.length ? `&also=${also.join(",")}` : ""}`;

  return (
    <Page>
      <Columns>
        <Column span={5} className="gap-4">
          <PageHeader title={store.focus ? `${chosen.map((c) => categoryLabel[c]).join(" + ")} practice` : "Practice plan"} />

          {store.focus ? (
            <>
              <details className="group rounded-lg border border-cream-deep bg-cream px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-body">
                  <span>
                    <span className="font-semibold">{chosen.map((c) => categoryLabel[c]).join(" + ")}</span> · {source}
                  </span>
                  <span className="shrink-0 text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px]">Why this plan</span>
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {check && <FocusLatest check={check} />}
                  <p className="text-body">
                    {check && <span className="font-semibold">When you locked it in: </span>}
                    {store.focus.reason}
                  </p>
                  <p className="text-label font-normal text-muted">
                    Locked in {daysAgo(store.focus.lockedAt)} · {sinceLock} practice {sinceLock === 1 ? "session" : "sessions"} since.
                  </p>
                </div>
              </details>
              {check && !changing && <FocusSuggestion check={check} focus={store.focus.category} headingId="plan-title" />}
              {changing ? (
                <div className="rounded-lg border border-rule p-4">
                  <FocusPicker autoFocus initialMain={store.focus.category} initialAlso={also} onDone={stopChanging} onCancel={stopChanging} />
                </div>
              ) : (
                <Button ref={changeButton} variant="secondary" size="sm" className="w-fit" onClick={() => setChanging(true)}>
                  Change focus
                </Button>
              )}
            </>
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
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="plan-title" tabIndex={-1} className="text-heading">
                {store.focus ? "Your" : "Starter"} {minutes}-minute plan
              </h2>
              <button
                type="button"
                // Opens or closes every card in the plan list below.
                aria-expanded={allStepsOpen}
                aria-controls={planListId}
                onClick={() => setOpenCards(Object.fromEntries(plan.blocks.map((b) => [b.title, !allStepsOpen])))}
                className="shrink-0 rounded-sm text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green"
              >
                {allStepsOpen ? "Hide all steps" : "Show all steps"}
              </button>
            </div>
            <ol id={planListId} className="grid items-start gap-3 xl:grid-cols-2">
              {plan.blocks.map((b, i) => (
                <li key={`${b.kind}-${b.title}`} className={b.kind === "challenge" || (plan.blocks.length % 2 === 0 && b.kind === "warmup") ? "xl:col-span-2" : undefined}>
                  <BlockCard
                    block={b}
                    index={i}
                    history={b.kind === "challenge" ? history : undefined}
                    open={Boolean(openCards[b.title])}
                    onToggle={(open) => setOpenCards((cards) => (cards[b.title] === open ? cards : { ...cards, [b.title]: open }))}
                  />
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
