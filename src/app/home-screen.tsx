"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { inProgressRound, setChecklistDismissed } from "@/lib/actions";
import { daysAgo, sessionsThisWeek } from "@/lib/format";
import { lastFinishedRound, playedHoles, recommend, roundStats } from "@/lib/recommend";
import { isSavingToMemoryOnly, useStore } from "@/lib/storage";
import { categoryLabel, type Store } from "@/lib/types";
import { Alert, Badge, ButtonLink, Card, Column, Columns, cx, LoadingCard, Page, TextLink, Toast, ToPar } from "@/components/ui";
import { BucketListCard, StreakCard } from "@/components/progress-cards";
import { FocusLatest, FocusSuggestion } from "@/components/focus-progress";
import { focusCheck, sessionsSinceFocus } from "@/lib/progress";
import { Onboarding } from "./onboarding";

const feelWord = ["", "Rough", "Meh", "OK", "Good", "Great"];

export function HomeScreen() {
  const store = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const clearSaved = useCallback(() => router.replace("/", { scroll: false }), [router]);

  if (!store) return <LoadingCard />;
  const fresh = store.rounds.length === 0 && store.practice.length === 0 && !store.focus;
  const saved = params.get("saved") === "practice" ? `Practice saved · ${sessionsThisWeek(store.practice)} of ${store.weeklyGoal} this week` : null;

  return (
    <Page>
      {isSavingToMemoryOnly() && (
        <Alert tone="warning" title="This browser isn't saving">
          Your notes will last until you close this tab. Turn off private browsing to keep them.
        </Alert>
      )}
      {fresh ? <FirstVisit /> : <WelcomeBack store={store} />}
      <Toast message={saved} onDone={clearSaved} />
    </Page>
  );
}

function FirstVisit() {
  return (
    <Columns>
      <Column span={7}>
        <div className="flex flex-col gap-3">
          <p className="text-label text-muted">Golf notes that remember for you</p>
          <h1 className="text-display">Track a round. Get a practice plan.</h1>
          <p className="max-w-2xl text-body text-muted">Tap in each hole as you play. Bucket List finds what cost you the most strokes and turns it into your next range session.</p>
        </div>
        <Onboarding />
      </Column>

      <Column span={5} sticky>
        <Card tone="cream" as="section" labelledBy="example" className="flex flex-col gap-3">
          <Badge tone="brass">Example · after a round</Badge>
          <h2 id="example" className="text-heading">
            Where to focus: Putting
          </h2>
          <p className="text-body">36 putts over 18 holes, with 4 three-putts. A bogey golfer takes about 34, so that cost you roughly 2 strokes.</p>
          <div className="rounded-md border border-brass/50 bg-surface p-3">
            <p className="text-label text-muted">Your 30-minute plan</p>
            <p className="text-body">Warm up → Lag ladder → Twenty threes challenge (target 15 of 20)</p>
          </div>
          <p className="text-label font-normal text-muted">One thing to work on, with the reason, after every round.</p>
        </Card>
        <ul className="flex flex-col gap-2 text-body">
          {[
            "No account. Everything is saved on this device.",
            "Five Chicago public courses are built in, so there's no scorecard to type. Anywhere else, add your own.",
            "Comes back to where you left off, mid-round or mid-week.",
            "Cross things off your golf bucket list as you play and practice.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <svg viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-green" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
              </svg>
              {t}
            </li>
          ))}
        </ul>
      </Column>
    </Columns>
  );
}

function GettingStarted({ store }: { store: Store }) {
  const lastRound = lastFinishedRound(store);
  const steps = [
    { label: "Play your first holes", done: store.rounds.some((r) => playedHoles(r).length > 0), href: "/play", action: "Start a round" },
    { label: "Lock in a practice focus", done: Boolean(store.focus), href: lastRound ? `/round/${lastRound.id}/summary` : "/practice", action: lastRound ? "See your summary" : "Pick one" },
    { label: "Log a practice session", done: store.practice.length > 0, href: "/practice", action: "Get a plan" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (store.checklistDismissed || doneCount === steps.length) return null;

  return (
    <Card as="section" labelledBy="getting-started" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="getting-started" className="text-heading">
          Getting started
        </h2>
        <p className="text-label text-muted">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span
                aria-hidden
                className={cx("grid size-7 shrink-0 place-items-center rounded-full border-2 font-display text-sm", s.done ? "border-green bg-green text-on-green" : "border-edge text-ink")}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={cx("text-body", s.done && "text-muted line-through")}>
                {s.label}
                <span className="sr-only">{s.done ? " (done)" : " (to do)"}</span>
              </span>
            </span>
            {!s.done && (
              <Link href={s.href} className="shrink-0 text-label text-green underline decoration-green/40 decoration-2 underline-offset-[3px] hover:decoration-green">
                {s.action}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setChecklistDismissed(true)} className="w-fit rounded-sm text-label font-normal text-muted underline underline-offset-[3px] hover:text-ink">
        Hide this
      </button>
    </Card>
  );
}

function WelcomeBack({ store }: { store: Store }) {
  const current = inProgressRound(store);
  const lastRound = lastFinishedRound(store);
  const lastPractice = store.practice[0];
  const suggestion = !store.focus && lastRound ? recommend(lastRound) : null;
  const check = focusCheck(store);
  const sinceLock = sessionsSinceFocus(store);

  const since = [lastRound && `last round ${daysAgo(lastRound.startedAt)}`, lastPractice && `last practice ${daysAgo(lastPractice.date)}`].filter(Boolean).join(" · ");

  return (
    <Columns>
      <Column span={7}>
        <div className="flex flex-col gap-1">
          <h1 className="text-display">Welcome back.</h1>
          {since && <p className="text-body text-muted">{since.charAt(0).toUpperCase() + since.slice(1)}.</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          {current ? <ButtonLink href={`/round/${current.id}/hole/${current.currentHole}`}>Resume on hole {current.currentHole}</ButtonLink> : <ButtonLink href="/play">Start a round</ButtonLink>}
          <ButtonLink href="/practice/log" variant="secondary">
            Log practice
          </ButtonLink>
        </div>

        {current && (
          <Card tone="green" as="section" labelledBy="resume" className="flex flex-col gap-3">
            <h2 id="resume" className="text-heading">
              Round in progress
            </h2>
            <p className="text-body">
              {current.courseName}, hole {current.currentHole} of {current.holes.length}
              {playedHoles(current).length > 0 && (
                <>
                  {" · "}
                  <ToPar strokes={roundStats(current).strokes} par={roundStats(current).par} /> through {playedHoles(current).length}
                </>
              )}
            </p>
          </Card>
        )}

        {store.focus ? (
          <Card tone="cream" as="section" labelledBy="focus" className="flex flex-col gap-3">
            <Badge tone="brass">Your focus</Badge>
            <h2 id="focus" tabIndex={-1} className="text-display">
              {[store.focus.category, ...(store.focus.also ?? [])].map((c) => categoryLabel[c]).join(" + ")}
            </h2>
            {check ? <FocusLatest check={check} /> : <p className="text-body">{store.focus.reason}</p>}
            <p className="text-label font-normal text-muted">
              Locked in {daysAgo(store.focus.lockedAt)} · {sinceLock} practice {sinceLock === 1 ? "session" : "sessions"} since
            </p>
            {check && <FocusSuggestion check={check} focus={store.focus.category} headingId="focus" />}
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/practice">Today&rsquo;s practice plan</ButtonLink>
              <ButtonLink href="/practice?change=1" variant="secondary">
                Change focus
              </ButtonLink>
            </div>
          </Card>
        ) : suggestion ? (
          <Card tone="cream" as="section" labelledBy="focus" className="flex flex-col gap-3">
            <Badge tone="brass">From your last round</Badge>
            <h2 id="focus" className="text-display">
              {categoryLabel[suggestion.top.category]}
            </h2>
            <p className="text-body">{suggestion.top.reason}</p>
            <ButtonLink href={`/round/${lastRound!.id}/summary`} className="w-fit">
              See the summary and lock it in
            </ButtonLink>
          </Card>
        ) : (
          <Card tone="cream" as="section" labelledBy="focus" className="flex flex-col gap-3">
            <h2 id="focus" className="text-heading">
              Play a round to find your focus
            </h2>
            <p className="text-body">Until then, the starter bucket covers a bit of everything.</p>
            <ButtonLink href="/play" className="w-fit">
              Start a round
            </ButtonLink>
          </Card>
        )}

        <Card as="section" labelledBy="last-practice" className="flex flex-col gap-2">
          <h2 id="last-practice" className="text-heading">
            Last practice
          </h2>
          {lastPractice ? (
            <>
              <p className="text-label font-normal text-muted">
                {daysAgo(lastPractice.date)} · {lastPractice.focus === "mixed" ? "Mixed bucket" : categoryLabel[lastPractice.focus]} · {lastPractice.minutes} min · felt{" "}
                {feelWord[lastPractice.feel].toLowerCase()}
              </p>
              {lastPractice.notes ? <blockquote className="border-l-4 border-brass pl-3 text-body">{lastPractice.notes}</blockquote> : <p className="text-body text-muted">No notes that time.</p>}
              {lastPractice.challengeScore !== undefined && (
                <p className="text-body">
                  Challenge:{" "}
                  <span className="font-semibold">
                    {lastPractice.challengeScore} of {lastPractice.challengeOutOf}
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-body text-muted">Nothing logged yet. Your notes from the range will show up here.</p>
              <TextLink href="/practice">Get a practice plan</TextLink>
            </>
          )}
        </Card>
        <GettingStarted store={store} />
      </Column>

      <Column span={5} className="lg:pt-2">
        <StreakCard store={store} />
        <BucketListCard store={store} />
      </Column>
    </Columns>
  );
}
