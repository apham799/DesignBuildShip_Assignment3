"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { inProgressRound } from "@/lib/actions";
import { daysAgo, sessionsThisWeek, toPar } from "@/lib/format";
import { lastFinishedRound, playedHoles, recommend, roundStats } from "@/lib/recommend";
import { isSavingToMemoryOnly, useStore } from "@/lib/storage";
import { categoryLabel, type Store } from "@/lib/types";
import { Alert, Badge, ButtonLink, Card, LoadingCard, Ornament, TextLink, Toast } from "@/components/ui";

const feelWord = ["", "Rough", "Meh", "OK", "Good", "Great"];

export function HomeScreen() {
  const store = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const clearSaved = useCallback(() => router.replace("/", { scroll: false }), [router]);

  if (!store) return <LoadingCard />;
  const fresh = store.rounds.length === 0 && store.practice.length === 0;
  const saved = params.get("saved") === "practice" ? `Practice saved · ${sessionsThisWeek(store.practice)} of ${store.weeklyGoal} this week` : null;

  return (
    <>
      {isSavingToMemoryOnly() && (
        <div className="mb-6">
          <Alert tone="warning" title="This browser isn't saving">
            Your notes will last until you close this tab. Turn off private browsing to keep them.
          </Alert>
        </div>
      )}
      {fresh ? <FirstVisit /> : <WelcomeBack store={store} />}
      <Toast message={saved} onDone={clearSaved} />
    </>
  );
}

function FirstVisit() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-label text-muted">Golf notes that remember for you</p>
        <h1 className="text-display">Track a round. Get a practice plan.</h1>
        <p className="text-body text-muted">Tap in each hole as you play. Bucket List finds what cost you the most strokes and turns it into your next range session.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card tone="green" as="section" labelledBy="playing" className="flex flex-col gap-3">
          <h2 id="playing" className="text-heading">
            Playing today?
          </h2>
          <p className="text-body opacity-95">Pick your course. Par, yards and handicap for every hole fill in for you.</p>
          <ButtonLink href="/play" variant="secondary" className="mt-auto w-full border-white">
            Start a round
          </ButtonLink>
        </Card>
        <Card as="section" labelledBy="range" className="flex flex-col gap-3">
          <h2 id="range" className="text-heading">
            At the range?
          </h2>
          <p className="text-body text-muted">A starter bucket of drills with a scored challenge at the end. No round needed.</p>
          <ButtonLink href="/practice" className="mt-auto w-full">
            Practice now
          </ButtonLink>
        </Card>
      </div>

      <Ornament />

      <section aria-labelledby="how" className="flex flex-col gap-3">
        <h2 id="how" className="text-heading">
          How it works
        </h2>
        <ol className="flex flex-col gap-3 text-body">
          {[
            ["Play", "Score, putts, fairway and green on each hole: four taps."],
            ["Focus", "The summary names the one area that cost you the most."],
            ["Practice", "Take a 15, 30 or 60-minute plan to the range and log how it went."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-cream font-display font-semibold text-green">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold">{title}.</span> {body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-label font-normal text-muted">Saved on this device. No account needed.</p>
    </div>
  );
}

function WelcomeBack({ store }: { store: Store }) {
  const current = inProgressRound(store);
  const lastRound = lastFinishedRound(store);
  const lastPractice = store.practice[0];
  const thisWeek = sessionsThisWeek(store.practice);
  const goal = store.weeklyGoal;
  const suggestion = !store.focus && lastRound ? recommend(lastRound) : null;

  const since = [lastRound && `last round ${daysAgo(lastRound.startedAt)}`, lastPractice && `last practice ${daysAgo(lastPractice.date)}`].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display">Welcome back.</h1>
        {since && <p className="text-body text-muted">{since.charAt(0).toUpperCase() + since.slice(1)}.</p>}
      </div>

      {current && (
        <Card tone="green" as="section" labelledBy="resume" className="flex flex-col gap-3">
          <h2 id="resume" className="text-heading">
            Round in progress
          </h2>
          <p className="text-body">
            {current.courseName}, hole {current.currentHole} of {current.holes.length}
            {playedHoles(current).length > 0 && ` · ${toPar(roundStats(current).strokes, roundStats(current).par)} through ${playedHoles(current).length}`}
          </p>
          <ButtonLink href={`/round/${current.id}/hole/${current.currentHole}`} variant="secondary" className="w-fit border-white">
            Resume on hole {current.currentHole}
          </ButtonLink>
        </Card>
      )}

      {store.focus ? (
        <Card tone="cream" as="section" labelledBy="focus" className="flex flex-col gap-3">
          <Badge tone="brass">Your focus</Badge>
          <h2 id="focus" className="text-display">
            {categoryLabel[store.focus.category]}
          </h2>
          <p className="text-body">{store.focus.reason}</p>
          <ButtonLink href="/practice" className="w-fit">
            Today&rsquo;s practice plan
          </ButtonLink>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card as="section" labelledBy="week" className="flex flex-col gap-3">
          <h2 id="week" className="text-heading">
            This week
          </h2>
          <p className="text-body">
            <span className="font-display text-2xl font-semibold">{thisWeek}</span> of {goal} practice sessions
          </p>
          <div aria-hidden className="flex gap-1.5">
            {Array.from({ length: Math.max(goal, thisWeek) }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < thisWeek ? "bg-green" : "bg-cream-deep"}`} />
            ))}
          </div>
          <p className="text-label font-normal text-muted">{thisWeek >= goal ? "Goal met. Anything more is a bonus." : "Weeks start on Monday."}</p>
        </Card>

        <Card as="section" labelledBy="last-practice" className="flex flex-col gap-2">
          <h2 id="last-practice" className="text-heading">
            Last practice
          </h2>
          {lastPractice ? (
            <>
              <p className="text-label font-normal text-muted">
                {daysAgo(lastPractice.date)} · {lastPractice.focus === "mixed" ? "Mixed bucket" : categoryLabel[lastPractice.focus]} · {lastPractice.minutes} min · felt {feelWord[lastPractice.feel].toLowerCase()}
              </p>
              {lastPractice.notes ? <blockquote className="border-l-4 border-brass pl-3 text-body">{lastPractice.notes}</blockquote> : <p className="text-body text-muted">No notes that time.</p>}
              {lastPractice.challengeScore !== undefined && (
                <p className="text-body">
                  Challenge: <span className="font-semibold">{lastPractice.challengeScore} of {lastPractice.challengeOutOf}</span>
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
      </div>

      <div className="flex flex-wrap gap-3">
        {!current && <ButtonLink href="/play">Start a round</ButtonLink>}
        <ButtonLink href="/practice/log" variant="secondary">
          Log practice
        </ButtonLink>
        <ButtonLink href="/history" variant="ghost">
          History
        </ButtonLink>
      </div>
    </div>
  );
}
