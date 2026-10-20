"use client";

import { useEffect } from "react";
import { finishRound, lockFocus } from "@/lib/actions";
import { shortDate, teeLabel } from "@/lib/format";
import { payoff } from "@/lib/progress";
import { hitGreen, playedHoles, recommend, roughStrokes, roundStats } from "@/lib/recommend";
import { categoryLabel, type Round, type Store } from "@/lib/types";
import { Alert, Badge, Button, ButtonLink, Card, Column, Columns, cx, Page, PageHeader, Ratio, Stat, Tip, ToPar } from "@/components/ui";
import { RoundGate } from "../round-gate";

export function SummaryScreen() {
  return <RoundGate>{(round, store) => <Summary round={round} store={store} />}</RoundGate>;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function Summary({ round, store }: { round: Round; store: Store }) {
  useEffect(() => {
    document.title = `${round.courseName} round summary · Bucket List`;
  }, [round.courseName]);
  const played = playedHoles(round);

  if (!round.finishedAt) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Round in progress" step={round.courseName} back={{ href: `/round/${round.id}/hole/${round.currentHole}`, label: `Hole ${round.currentHole}` }} />
        <Alert title="Finish the round to see your summary">
          You&rsquo;ve played {played.length} of {round.holes.length} holes.
        </Alert>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/round/${round.id}/hole/${round.currentHole}`}>Back to hole {round.currentHole}</ButtonLink>
          {played.length > 0 && (
            <Button variant="secondary" onClick={() => finishRound(round.id)}>
              Finish now
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (played.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="No holes recorded" step={round.courseName} back={{ href: "/history", label: "History" }} />
        <Alert title="This round finished before any holes were played">Start a new round to get a practice focus.</Alert>
        <ButtonLink href="/play" className="w-fit">
          Start a round
        </ButtonLink>
      </div>
    );
  }

  const stats = roundStats(round);
  const rec = recommend(round);
  // Did practice on the focus show up in this round?
  const pay = payoff(store, round);
  const lockedHere = store.focus?.fromRoundId === round.id;
  const sameFocus = rec && store.focus?.category === rec.top.category;

  return (
    <Page>
      <Columns>
        <Column span={7}>
          <PageHeader title={round.courseName} step={`${shortDate(round.startedAt)} · ${teeLabel(round.teeName)} · ${stats.holes} holes`} back={{ href: "/history", label: "History" }} />

          <Card>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              <Stat
                label="Score"
                value={stats.strokes}
                detail={
                  <>
                    <ToPar strokes={stats.strokes} par={stats.par} /> · par {stats.par}
                  </>
                }
              />
              <Stat label="Putts" value={stats.putts} detail={`${(stats.putts / stats.holes).toFixed(1)} a hole`} />
              <Stat label="Fairways" value={<Ratio n={stats.fairwaysHit} of={stats.fairwaysPossible} />} detail={pct(stats.fairwaysHit, stats.fairwaysPossible)} />
              <Stat label="Greens" value={<Ratio n={stats.greensHit} of={stats.holes} />} detail={pct(stats.greensHit, stats.holes)} />
            </dl>
            {stats.penalties > 0 && (
              <p className="mt-4 text-body text-muted">
                Plus {stats.penalties} penalty {stats.penalties === 1 ? "stroke" : "strokes"}.
              </p>
            )}
          </Card>

          {pay && (
            <Card as="section" labelledBy="payoff-title" className={cx("flex flex-col gap-2 border-2", pay.verdict === "better" ? "border-green" : "border-rule")}>
              <div className="flex items-center gap-2">
                <Badge tone={pay.verdict === "better" ? "green" : "neutral"}>{pay.verdict === "better" ? "Practice payoff" : "Practice check-in"}</Badge>
              </div>
              <h2 id="payoff-title" className="text-heading">
                {categoryLabel[pay.category]} since you started working on it
              </h2>
              <p className="text-body">{pay.text}</p>
              <p className="text-label font-normal text-muted">
                Compared with your round at {pay.baseline.courseName} on {shortDate(pay.baseline.startedAt)}.
              </p>
            </Card>
          )}
        </Column>

        {rec && (
          <Column span={5} sticky className="lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <Tip id="summary" title="One thing to work on">
              Every round ends with the single area that cost you the most strokes. Lock it in and your practice plan follows it until you change it.
            </Tip>
            <Card tone="cream" as="section" labelledBy="focus-title" className="flex flex-col gap-3">
              <Badge tone="brass">Where to focus</Badge>
              <h2 id="focus-title" className="text-display">
                {categoryLabel[rec.top.category]}
              </h2>
              {rec.standsOut ? (
                <p className="text-body">{rec.top.reason}</p>
              ) : (
                <p className="text-body">
                  Nothing stood out this round: you were at or ahead of a bogey golfer everywhere. {categoryLabel[rec.top.category]} came closest to costing you strokes.
                  {sameFocus && " It's already your focus, so this is a good time to pick a new area or keep sharpening it."}
                </p>
              )}
              {rec.top.tip && <p className="rounded-md border border-brass/50 bg-surface p-3 text-body">{rec.top.tip}</p>}
              {rec.runnerUp && rec.runnerUp.strokes > 0 && (
                <p className="text-label font-normal text-muted">
                  Next closest: {categoryLabel[rec.runnerUp.category]} ({roughStrokes(rec.runnerUp.strokes)}).
                </p>
              )}
              <p className="text-label font-normal text-muted">
                {stats.holes < 6 && `Based on ${stats.holes} ${stats.holes === 1 ? "hole" : "holes"}, so treat this focus as a first hint. `}
                Estimated from your score, putts and hits compared with a bogey golfer. Not shot-by-shot data.
              </p>
              <div className="mt-1 flex flex-col gap-3">
                {lockedHere || sameFocus ? (
                  <>
                    <p className="flex items-center gap-2 text-body font-semibold text-success" role="status">
                      <svg viewBox="0 0 16 16" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                      </svg>
                      {categoryLabel[rec.top.category]} is your practice focus
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <ButtonLink href="/practice">See your practice plan</ButtonLink>
                      <ButtonLink href="/practice?change=1" variant="secondary">
                        {rec.standsOut ? "Change focus" : "Pick a new focus"}
                      </ButtonLink>
                    </div>
                  </>
                ) : (
                  <Button className="w-fit" onClick={() => lockFocus(rec.top.category, rec.top.reason, round.id)}>
                    Lock in {categoryLabel[rec.top.category].toLowerCase()} as my focus
                  </Button>
                )}
              </div>
              {store.focus && !sameFocus && !lockedHere && (
                <p className="text-label font-normal text-muted">Your current focus is {categoryLabel[store.focus.category].toLowerCase()}. Locking this in replaces it.</p>
              )}
            </Card>
          </Column>
        )}

        <Column span={7} className="lg:col-start-1 lg:row-start-2">
          {round.mode === "holes" ? (
            <section aria-labelledby="card-title" className="flex flex-col gap-3">
              <h2 id="card-title" className="text-heading">
                Scorecard
              </h2>
              <div className="overflow-x-auto rounded-lg border border-rule shadow-card">
                <table className="w-full border-collapse text-center text-body">
                  <caption className="sr-only">Score, putts, tee shot and green for each hole played. Left, right, short and long are misses.</caption>
                  <thead className="bg-cream text-label">
                    <tr>
                      <th scope="col" className="px-2 py-2 text-left">
                        Hole
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Par
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Score
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Putts
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Fairway
                      </th>
                      <th scope="col" className="px-2 py-2">
                        Green
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {played.map((h) => (
                      <tr key={h.number} className="border-t border-rule">
                        <th scope="row" className="px-2 py-2 text-left font-semibold">
                          {h.number}
                        </th>
                        <td className="px-2 py-2">{h.par}</td>
                        <td className="px-2 py-2 font-display text-lg font-semibold">{h.strokes}</td>
                        <td className="px-2 py-2">{h.putts}</td>
                        <td className="px-2 py-2">{h.par === 3 ? "—" : h.fairway ? capital(h.fairway) : "—"}</td>
                        <td className="px-2 py-2">{hitGreen(h) ? "Hit" : h.green ? capital(h.green) : "Missed"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <p className="text-body text-muted">Entered as totals, so there&rsquo;s no scorecard or short-game estimate. Track hole by hole next time for both.</p>
          )}
        </Column>
      </Columns>
    </Page>
  );
}
