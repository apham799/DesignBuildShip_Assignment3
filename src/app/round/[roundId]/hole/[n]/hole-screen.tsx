"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { finishRound, goToHole, saveHoleNote, setCustomPar, updateHole } from "@/lib/actions";
import { toPar } from "@/lib/format";
import { playedHoles, roundStats } from "@/lib/recommend";
import type { FairwayResult, GreenResult, HoleScore, Par, Round } from "@/lib/types";
import { Alert, Badge, Button, Card, ChoiceGroup, cx, PageHeader, Stepper, TextArea, TextLink } from "@/components/ui";
import { RoundGate } from "../../round-gate";

const FINISH_EARLY_AFTER = 6;

export function HoleScreen() {
  const { n } = useParams<{ n: string }>();
  const number = Number(n);
  return (
    <RoundGate>
      {(round) => {
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

function Scorecard({ round, current }: { round: Round; current: number }) {
  return (
    <nav aria-label="Holes in this round">
      <ol className="grid grid-cols-9 gap-1.5">
        {round.holes.map((h) => {
          const here = h.number === current;
          const diff = h.strokes - h.par;
          return (
            <li key={h.number}>
              <Link
                href={`/round/${round.id}/hole/${h.number}`}
                aria-current={here ? "step" : undefined}
                aria-label={`Hole ${h.number}${h.played ? `, ${h.strokes} strokes` : ", not played yet"}`}
                className={cx(
                  "flex h-11 flex-col items-center justify-center rounded-md border text-label leading-none transition-colors",
                  here ? "border-green bg-green text-on-green" : h.played ? "border-rule bg-surface text-ink hover:border-ink" : "border-dashed border-edge bg-surface text-muted hover:border-ink",
                )}
              >
                <span className="text-[0.7rem] font-normal opacity-90">{h.number}</span>
                <span className={cx("font-display text-base", !here && h.played && diff < 0 && "text-green")}>
                  {h.played ? h.strokes : "·"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function HoleForm({ round, hole }: { round: Round; hole: HoleScore }) {
  const router = useRouter();
  const total = round.holes.length;
  const isLast = hole.number === total;
  const custom = round.courseId.startsWith("custom-");
  const set = (patch: Partial<HoleScore>) => updateHole(round.id, hole.number, patch);

  const stats = roundStats(round);
  const played = playedHoles(round);
  // Counting this hole too, since finishing marks it played.
  const playedWithThis = played.some((h) => h.number === hole.number) ? played.length : played.length + 1;
  const canFinishEarly = !isLast && playedWithThis >= FINISH_EARLY_AFTER;

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hole ${hole.number}`}
        step={`${round.courseName} · ${hole.number} of ${total}`}
        back={hole.number > 1 ? { href: `/round/${round.id}/hole/${hole.number - 1}`, label: `Hole ${hole.number - 1}` } : { href: "/", label: "Home" }}
        action={
          played.length > 0 ? (
            <p className="text-right text-label text-muted">
              Thru {played.length}
              <span className="block font-display text-2xl text-ink">{toPar(stats.strokes, stats.par)}</span>
            </p>
          ) : undefined
        }
      />

      <Scorecard round={round} current={hole.number} />

      <Card tone="cream" className="flex flex-col gap-4">
        {custom ? (
          <ChoiceGroup
            legend="Par for this hole"
            name="par"
            value={String(hole.par)}
            onChange={(v) => setCustomPar(round.courseId, round.id, hole.number, Number(v) as Par)}
            options={[
              { value: "3", label: "Par 3" },
              { value: "4", label: "Par 4" },
              { value: "5", label: "Par 5" },
            ]}
            hint="Saved to your course for next time."
          />
        ) : (
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-label text-muted">Par</dt>
              <dd className="text-display">{hole.par}</dd>
            </div>
            <div>
              <dt className="text-label text-muted">Yards</dt>
              <dd className="text-display">{hole.yards ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label text-muted">Handicap</dt>
              <dd className="text-display">{hole.handicap}</dd>
            </div>
          </dl>
        )}
        {hole.lastNote && (
          <div className="rounded-md border border-brass/50 bg-surface p-3">
            <p className="text-label text-muted">Your note from last time</p>
            <p className="text-body">{hole.lastNote}</p>
          </div>
        )}
      </Card>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) finish();
          else next();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label="Score"
            unit="score"
            value={hole.strokes}
            min={1}
            max={15}
            onChange={(v) => set({ strokes: v, putts: Math.min(hole.putts, v - 1) })}
            hint={hole.played ? undefined : "Starts at par"}
          />
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
        ) : (
          <p className="text-body text-muted">Par 3: no fairway to track.</p>
        )}

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
          hint={!hole.green && inferredHit ? "Filled in from your score and putts." : !hole.green ? "Missed it? Tap where your approach finished." : undefined}
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

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" block>
            {isLast ? "Finish round" : `Next: hole ${hole.number + 1}`}
          </Button>
          <p className="flex items-center justify-center gap-2 text-label font-normal text-muted">
            <Badge tone="green">Saved</Badge> Every tap is saved on this device.
          </p>
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-rule pt-6">
        {!isLast &&
          (canFinishEarly ? (
            <Button variant="secondary" onClick={finish}>
              Finish after this hole
            </Button>
          ) : (
            <p className="text-label font-normal text-muted">You can finish early once you&rsquo;ve played {FINISH_EARLY_AFTER} holes.</p>
          ))}
        <p className="text-body">
          Didn&rsquo;t track every hole? <TextLink href={`/round/${round.id}/totals`}>Enter totals instead</TextLink>
        </p>
      </div>
    </div>
  );
}
