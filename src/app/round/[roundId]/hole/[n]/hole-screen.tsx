"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { finishRound, goToHole, saveHoleNote, setCustomPar, updateHole } from "@/lib/actions";

import { playedHoles, roundStats } from "@/lib/recommend";
import type { FairwayResult, GreenResult, HoleScore, Par, Round } from "@/lib/types";
import { Alert, Button, ChoiceGroup, Column, Columns, cx, Page, PageHeader, Stepper, TextArea, TextLink, Tip, ToPar, useFocusSwap } from "@/components/ui";
import { RoundGate } from "../../round-gate";

export function HoleScreen() {
  const { n } = useParams<{ n: string }>();
  const number = Number(n);
  return (
    <RoundGate>
      {(round) => {
        // A round saved as totals has no hole-by-hole data to show or edit.
        if (round.mode === "totals") {
          return (
            <div className="flex flex-col gap-6">
              <PageHeader title="Saved as totals" step={round.courseName} back={{ href: `/round/${round.id}/summary`, label: "Back to the summary" }} />
              <Alert title={`This round was saved as totals for ${round.holes.length} holes`}>There are no single holes to edit. Change the totals instead.</Alert>
              <TextLink href={`/round/${round.id}/totals`}>Edit totals</TextLink>
            </div>
          );
        }
        const hole = round.holes.find((h) => h.number === number);
        if (!hole) {
          return (
            <div className="flex flex-col gap-6">
              <PageHeader title={`No hole ${n}`} back={{ href: `/round/${round.id}/hole/${round.currentHole}`, label: `Hole ${round.currentHole}` }} />
              <Alert title={`This round has ${round.holes.length} holes`}>Go back to the hole you were on.</Alert>
            </div>
          );
        }
        // key: a fresh form for each hole, so nothing carries over by accident.
        return <HoleForm key={`${round.id}-${number}`} round={round} hole={hole} />;
      }}
    </RoundGate>
  );
}

// One scrollable row on phones (kept scrolled to the current hole), two rows of 9 on desktop.
function Scorecard({ round, current }: { round: Round; current: number }) {
  const currentRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current]);
  return (
    <nav aria-label="Holes in this round" className="relative -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:overflow-visible">
      <ol className="flex gap-1 lg:grid lg:grid-cols-9">
        {round.holes.map((h) => {
          const here = h.number === current;
          const diff = h.strokes - h.par;
          return (
            <li key={h.number}>
              <Link
                ref={here ? currentRef : undefined}
                href={`/round/${round.id}/hole/${h.number}`}
                aria-current={here ? "step" : undefined}
                className={cx(
                  "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border text-label leading-none transition-colors lg:w-auto",
                  here ? "border-green bg-green text-on-green" : h.played ? "border-rule bg-surface text-ink hover:border-ink" : "border-dashed border-edge bg-surface text-muted hover:border-ink",
                )}
              >
                {/* Read as "Hole 3: 5 strokes" while keeping the visible "3" and "5" in the name (WCAG 2.5.3). */}
                <span className="text-[0.7rem] font-normal opacity-90">
                  <span className="sr-only">Hole </span>
                  {h.number}
                  <span className="sr-only">: </span>
                </span>
                <span className={cx("font-display text-base", !here && h.played && diff < 0 && "text-green")}>
                  {h.played ? (
                    <>
                      {h.strokes}
                      <span className="sr-only"> strokes</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden>·</span>
                      <span className="sr-only">not played yet</span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Rounds get cut short (weather, daylight, a call from work). Any hole can end the round,
// with one confirm step so a stray tap doesn't.
function EndRound({ holeNumber, holesPlayed, onEnd }: { holeNumber: number; holesPlayed: number; onEnd: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const { whenOpen, whenClosed } = useFocusSwap(confirming);
  const questionId = useId();
  if (confirming) {
    return (
      <div role="group" aria-labelledby={questionId} className="flex flex-col gap-3 rounded-lg border border-rule p-4">
        <p id={questionId} className="text-body">
          End the round after hole {holeNumber}? You&rsquo;ll get a summary for the {holesPlayed} {holesPlayed === 1 ? "hole" : "holes"} you played, and you can still edit them later.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onEnd}>End and log round</Button>
          <Button ref={whenOpen} variant="ghost" onClick={() => setConfirming(false)}>
            Keep playing
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Button ref={whenClosed} variant="secondary" onClick={() => setConfirming(true)}>
      End round after this hole
    </Button>
  );
}

function HoleForm({ round, hole }: { round: Round; hole: HoleScore }) {
  // A specific tab title, so screen readers hear which hole after each navigation. Set
  // again on the next frame, after Next.js applies the page's static "Hole" title.
  useEffect(() => {
    const title = `Hole ${hole.number} of ${round.holes.length}, ${round.courseName} · Bucket List`;
    document.title = title;
    const frame = requestAnimationFrame(() => (document.title = title));
    return () => cancelAnimationFrame(frame);
  }, [hole.number, round.holes.length, round.courseName]);
  const router = useRouter();
  const total = round.holes.length;
  const isLast = hole.number === total;
  const custom = round.courseId.startsWith("custom-");
  const set = (patch: Partial<HoleScore>) => updateHole(round.id, hole.number, patch);

  const stats = roundStats(round);
  const played = playedHoles(round);
  // Counting this hole too, since finishing marks it played.
  const playedWithThis = played.some((h) => h.number === hole.number) ? played.length : played.length + 1;

  const inferredHit = hole.strokes - hole.putts <= hole.par - 2;
  const greenValue = hole.green ?? (inferredHit ? "hit" : undefined);

  const next = () => {
    set({});
    goToHole(round.id, hole.number + 1);
    router.push(`/round/${round.id}/hole/${hole.number + 1}`);
  };
  const finish = () => {
    set({});
    finishRound(round.id);
    router.push(`/round/${round.id}/summary`);
  };

  return (
    <Page>
      <Columns>
        <Column span={5} className="gap-4">
          <PageHeader
            title={`Hole ${hole.number}`}
            step={`${round.courseName} · ${hole.number} of ${total}`}
            description={
              <span className="font-semibold text-ink">
                Par {hole.par}
                {hole.yards ? ` · ${hole.yards} yds` : ""}
                {/* Custom courses have no real stroke index, so none is shown. */}
                {custom ? "" : ` · Handicap ${hole.handicap}`}
              </span>
            }
            // No back link: the hole strip below shows where you are and goes to any hole.
            action={
              played.length > 0 ? (
                <p className="text-right text-label text-muted">
                  Thru {played.length}
                  <span className="block font-display text-2xl text-ink">
                    <ToPar strokes={stats.strokes} par={stats.par} />
                  </span>
                </p>
              ) : undefined
            }
          />

          <Scorecard round={round} current={hole.number} />

          {hole.lastNote && (
            <p className="rounded-md border-l-4 border-brass bg-cream px-3 py-2 text-body">
              <span className="font-semibold">Last time here:</span> {hole.lastNote}
            </p>
          )}
          {custom && (
            <ChoiceGroup
              legend="Par for this hole"
              name="par"
              value={String(hole.par)}
              onChange={(v) => setCustomPar(round.courseId, round.id, hole.number, Number(v) as Par)}
              options={[
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
              ]}
              hint="Saved to your course for next time."
            />
          )}
        </Column>

        <Column span={7} className="gap-4 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <Tip id="hole" title="Four taps a hole">
            Set score and putts, then tap where your shots went. It saves as you go.
          </Tip>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (isLast) finish();
              else next();
            }}
          >
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <Stepper label="Score" unit="score" value={hole.strokes} min={1} max={15} onChange={(v) => set({ strokes: v, putts: Math.min(hole.putts, v - 1) })} />
              <Stepper label="Putts" unit="putts" value={hole.putts} min={0} max={Math.max(0, hole.strokes - 1)} onChange={(v) => set({ putts: v })} />
            </div>

            {hole.par !== 3 ? (
              <ChoiceGroup
                legend="Tee shot"
                name="fairway"
                value={hole.fairway}
                onChange={(v) => set({ fairway: v as FairwayResult })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "hit", label: "Fairway" },
                  { value: "right", label: "Right" },
                ]}
              />
            ) : null}

            <ChoiceGroup
              legend="Green in regulation"
              name="green"
              columns={5}
              value={greenValue}
              onChange={(v) => set({ green: v as GreenResult })}
              options={[
                { value: "hit", label: "Hit" },
                { value: "short", label: "Short" },
                { value: "long", label: "Long" },
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
              hint={!hole.green && inferredHit ? "Filled in from your score and putts." : undefined}
            />

            <details className="group rounded-lg border border-rule p-4" open={hole.penalties > 0 || Boolean(hole.note)}>
              <summary className="cursor-pointer list-none text-body font-semibold text-ink">
                <span className="flex items-center justify-between">
                  Penalties and notes
                  <svg viewBox="0 0 16 16" className="size-4 transition-transform group-open:rotate-180" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6 L8 10 L12 6" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 flex flex-col gap-5">
                <Stepper label="Penalty strokes" unit="penalty strokes" value={hole.penalties} min={0} max={6} onChange={(v) => set({ penalties: v })} hint="Out of bounds, water, lost ball." />
                <TextArea
                  label="Note for next time"
                  optional
                  value={hole.note ?? ""}
                  onChange={(e) => {
                    set({ note: e.target.value });
                    saveHoleNote(round.courseId, hole.number, e.target.value, round.id);
                  }}
                  placeholder="e.g. Club down, green runs long"
                  hint="Shows on this hole the next time you play here."
                  maxLength={200}
                />
              </div>
            </details>

            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" block>
                {isLast ? "Finish round" : `Next: hole ${hole.number + 1}`}
              </Button>
              <p className="text-center text-label font-normal text-muted">Saved on this device as you go.</p>
            </div>
          </form>
        </Column>

        <Column span={5} className="lg:col-start-1 lg:row-start-2">
          <div className="flex flex-col gap-3 border-t border-rule pt-4">
            {!isLast && !round.finishedAt && <EndRound holeNumber={hole.number} holesPlayed={playedWithThis} onEnd={finish} />}
            {round.finishedAt ? (
              <p className="text-body">
                Editing a finished round. <TextLink href={`/round/${round.id}/summary`}>Back to the summary</TextLink>
              </p>
            ) : (
              <p className="text-body">
                Didn&rsquo;t track every hole? <TextLink href={`/round/${round.id}/totals`}>Enter totals instead</TextLink>
              </p>
            )}
          </div>
        </Column>
      </Columns>
    </Page>
  );
}
