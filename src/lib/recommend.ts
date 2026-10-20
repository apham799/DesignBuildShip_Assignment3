import { missTips } from "@/data/drills";
import { categoryLabel, type Category, type HoleScore, type Round, type Store } from "./types";

// Turns a round into "what cost you the most strokes". Without shot distances this
// is an estimate against a bogey golfer, not Strokes Gained, and the UI says so.

const BENCH = {
  fairwayRate: 0.4, // fairways hit
  greenRate: 0.2, // greens in regulation
  puttsPerHole: 1.9, // about 34 a round
  scrambleRate: 0.15, // par or better after missing a green
  penaltiesPerHole: 0.08, // about 1.5 a round
};

export function hitGreen(h: HoleScore) {
  if (h.green) return h.green === "hit";
  return h.strokes - h.putts <= h.par - 2;
}

export type RoundStats = {
  holes: number;
  strokes: number;
  par: number;
  putts: number;
  fairwaysHit: number;
  fairwaysPossible: number;
  greensHit: number;
  penalties: number;
  threePutts?: number;
  scrambles?: number;
  scrambleChances?: number;
  fairwayMisses: Record<string, number>;
  greenMisses: Record<string, number>;
};

export function playedHoles(round: Round) {
  return round.mode === "totals" ? round.holes : round.holes.filter((h) => h.played);
}

export function roundStats(round: Round): RoundStats {
  const holes = playedHoles(round);
  const par = holes.reduce((s, h) => s + h.par, 0);
  const fairwaysPossible = holes.filter((h) => h.par !== 3).length;

  if (round.mode === "totals" && round.totals) {
    const t = round.totals;
    return {
      holes: holes.length,
      strokes: t.strokes,
      par,
      putts: t.putts,
      fairwaysHit: t.fairwaysHit,
      fairwaysPossible,
      greensHit: t.greensHit,
      penalties: t.penalties,
      fairwayMisses: {},
      greenMisses: {},
    };
  }

  const fairwayMisses: Record<string, number> = {};
  const greenMisses: Record<string, number> = {};
  let fairwaysHit = 0;
  let greensHit = 0;
  let scrambles = 0;
  let scrambleChances = 0;
  for (const h of holes) {
    if (h.par !== 3 && h.fairway) {
      if (h.fairway === "hit") fairwaysHit++;
      else fairwayMisses[h.fairway] = (fairwayMisses[h.fairway] ?? 0) + 1;
    }
    if (hitGreen(h)) greensHit++;
    else {
      scrambleChances++;
      if (h.strokes <= h.par) scrambles++;
      if (h.green && h.green !== "hit") greenMisses[h.green] = (greenMisses[h.green] ?? 0) + 1;
    }
  }
  return {
    holes: holes.length,
    strokes: holes.reduce((s, h) => s + h.strokes, 0),
    par,
    putts: holes.reduce((s, h) => s + h.putts, 0),
    fairwaysHit,
    fairwaysPossible,
    greensHit,
    penalties: holes.reduce((s, h) => s + h.penalties, 0),
    threePutts: holes.filter((h) => h.putts >= 3).length,
    scrambles,
    scrambleChances,
    fairwayMisses,
    greenMisses,
  };
}

export type Leak = { category: Category; strokes: number; reason: string; tip?: string };

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
// "so that cost you about 2.1 strokes" or, when ahead of the benchmark, a compliment.
// Estimates, so say them like estimates: "less than a stroke", "about a stroke", "roughly 5 strokes".
export function roughStrokes(n: number) {
  if (n < 0.75) return "less than a stroke";
  if (n < 1.5) return "about a stroke";
  return `roughly ${Math.round(n)} strokes`;
}
const costText = (n: number) => (round1(n) > 0 ? `so that cost you ${roughStrokes(n)}` : "so you're ahead of a bogey golfer here");

// A clear miss pattern: at least 2 misses, and 60%+ of them the same way.
function pattern(misses: Record<string, number>) {
  const total = Object.values(misses).reduce((a, b) => a + b, 0);
  const [dir, count] = Object.entries(misses).sort((a, b) => b[1] - a[1])[0] ?? [];
  return dir && count >= 2 && count / total >= 0.6 ? dir : undefined;
}

export function leaks(stats: RoundStats): Leak[] {
  const n = stats.holes;
  if (n === 0) return [];
  const out: Leak[] = [];

  const extraPutts = stats.putts - BENCH.puttsPerHole * n;
  out.push({
    category: "putting",
    strokes: extraPutts,
    reason: `${stats.putts} putts over ${n} holes${stats.threePutts ? `, with ${stats.threePutts} three-putt${stats.threePutts === 1 ? "" : "s"}` : ""}. A bogey golfer takes about ${Math.round(BENCH.puttsPerHole * n)}, ${costText(extraPutts)}.`,
  });

  const greenGap = (BENCH.greenRate - stats.greensHit / n) * n * 0.5;
  const approachDir = pattern(stats.greenMisses);
  out.push({
    category: "approach",
    strokes: greenGap,
    reason: `You hit ${stats.greensHit} of ${n} greens in regulation (${pct(stats.greensHit, n)}%). A bogey golfer hits about ${pct(BENCH.greenRate, 1)}%, ${costText(greenGap)}.`,
    tip: approachDir ? missTips.approach?.[approachDir] : undefined,
  });

  const extraPenalties = Math.max(0, stats.penalties - BENCH.penaltiesPerHole * n);
  const fairwayGap = stats.fairwaysPossible ? (BENCH.fairwayRate - stats.fairwaysHit / stats.fairwaysPossible) * stats.fairwaysPossible * 0.35 : 0;
  const drivingDir = pattern(stats.fairwayMisses);
  out.push({
    category: "driving",
    strokes: fairwayGap + extraPenalties,
    reason: `You hit ${stats.fairwaysHit} of ${stats.fairwaysPossible} fairways (${pct(stats.fairwaysHit, stats.fairwaysPossible)}%)${stats.penalties ? ` and took ${stats.penalties} penalty stroke${stats.penalties === 1 ? "" : "s"}` : ""}. A bogey golfer hits about ${pct(BENCH.fairwayRate, 1)}%, ${costText(fairwayGap + extraPenalties)}.`,
    tip: drivingDir ? missTips.driving?.[drivingDir] : undefined,
  });

  // Short game needs hole-by-hole data (did you save par after missing the green?).
  if (stats.scrambleChances !== undefined && stats.scrambles !== undefined && stats.scrambleChances > 0) {
    const gap = (BENCH.scrambleRate - stats.scrambles / stats.scrambleChances) * stats.scrambleChances * 0.6;
    out.push({
      category: "shortGame",
      strokes: gap,
      reason: `After missing a green, you saved par ${stats.scrambles} of ${stats.scrambleChances} times (${pct(stats.scrambles, stats.scrambleChances)}%). A bogey golfer saves about ${pct(BENCH.scrambleRate, 1)}%, ${costText(gap)}.`,
    });
  }

  return out.map((l) => ({ ...l, strokes: round1(l.strokes) })).sort((a, b) => b.strokes - a.strokes);
}

export type Recommendation = { top: Leak; runnerUp?: Leak; standsOut: boolean };

export function recommend(round: Round): Recommendation | null {
  const all = leaks(roundStats(round));
  if (!all.length) return null;
  return { top: all[0], runnerUp: all[1], standsOut: all[0].strokes > 0.5 };
}

// The most recent finished round, for the home screen and the practice page.
export function lastFinishedRound(store: Store): Round | undefined {
  return store.rounds.find((r) => r.finishedAt && playedHoles(r).length > 0);
}

export function focusHeadline(category: Category) {
  return categoryLabel[category];
}
