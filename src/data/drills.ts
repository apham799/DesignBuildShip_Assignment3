import type { Category } from "@/lib/types";

// Drill library. Every plan is warm-up → drill(s) → a scored challenge with a target,
// so each practice session ends with a number to compare against next time.

export type Drill = {
  id: string;
  category: Category;
  name: string;
  where: string;
  steps: string[];
  // How to fill the drill's time, e.g. "Repeat the ladder until time is up."
  repeat: string;
  // Balls to bring for drills that reuse the same balls (putting, chipping).
  // Range drills use up balls instead; the plan estimates those from the time.
  carry?: number;
};

export type Challenge = {
  id: string;
  category: Category | "mixed";
  name: string;
  how: string;
  outOf: number;
  // The usual target is Silver; Bronze and Gold sit either side so there's always a next level.
  target: number;
  levels: Record<Level, number>;
  // Range challenges use one ball per attempt; green challenges reuse `carry` balls.
  carry?: number;
};

export type Level = "bronze" | "silver" | "gold";
export const levelOrder: Level[] = ["bronze", "silver", "gold"];
export const levelLabel: Record<Level, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };

export const drills: Drill[] = [
  {
    id: "fairway-gates",
    category: "driving",
    name: "Fairway gates",
    where: "Range",
    steps: [
      "Pick two flags or signs about 30 yards apart as your fairway.",
      "Alternate driver and your next-longest club, full routine every ball.",
      "Say out loud where it finished: in, left, or right.",
    ],
    repeat: "Keep alternating clubs until time is up.",
  },
  {
    id: "stock-shot",
    category: "driving",
    name: "Stock shot",
    where: "Range",
    steps: ["Pick one club you trust off the tee.", "Hit the same shot shape at one target.", "Only change your aim, never your swing, between balls."],
    repeat: "Hit sets of 10 until time is up, resting briefly between sets.",
  },
  {
    id: "distance-ladder",
    category: "approach",
    name: "Distance ladder",
    where: "Range",
    steps: ["Pick targets at roughly 75, 100, 125 and 150 yards.", "Hit one ball at each, changing club every ball, as on the course.", "Note which distances finish short or long."],
    repeat: "One ladder is 4 balls. Climb it again until time is up.",
  },
  {
    id: "back-of-green",
    category: "approach",
    name: "Back-of-the-green",
    where: "Range",
    steps: ["Pick a target and aim for 5 yards past it.", "Take one more club than feels right.", "Count how many carry the target; most golfers come up short."],
    repeat: "Switch targets every 4 balls until time is up.",
  },
  {
    id: "landing-spot",
    category: "shortGame",
    name: "Landing spot",
    where: "Short-game area",
    carry: 5,
    steps: ["Put a towel a third of the way to the hole.", "Chip so the ball lands on the towel and rolls out.", "Collect the balls and move the towel to a new spot."],
    repeat: "Chip all 5 balls, collect them, move the towel, and go again until time is up.",
  },
  {
    id: "up-and-down-nine",
    category: "shortGame",
    name: "Up-and-down nine",
    where: "Short-game area",
    carry: 9,
    steps: ["Drop 9 balls around a green: 3 easy, 3 medium, 3 hard lies.", "Chip, then putt each one out.", "A save is getting down in 2."],
    repeat: "Play the nine, pick the balls up, and play new lies until time is up.",
  },
  {
    id: "lag-ladder",
    category: "putting",
    name: "Lag ladder",
    where: "Putting green",
    carry: 3,
    steps: ["Putt all 3 balls from 20 feet, then 30, then 40.", "The goal is to finish inside a putter-length of the hole.", "Watch the whole roll so your eyes learn the speed."],
    repeat: "One ladder is 9 putts. Repeat the ladder until time is up.",
  },
  {
    id: "circle-drill",
    category: "putting",
    name: "Circle drill",
    where: "Putting green",
    carry: 6,
    steps: ["Place 6 balls in a circle 3 feet from the hole.", "Make all 6 in a row; start over if you miss.", "Clear the circle, then move back to 4 feet."],
    repeat: "Keep going until time is up. A miss means starting that circle again.",
  },
];

export const challenges: Record<Category | "mixed", Challenge> = {
  driving: {
    id: "fairway-finder",
    category: "driving",
    name: "Fairway finder",
    how: "10 drives at your fairway gates. Count how many finish inside.",
    outOf: 10,
    target: 6,
    levels: { bronze: 4, silver: 6, gold: 8 },
  },
  approach: {
    id: "green-circle",
    category: "approach",
    name: "Green circle",
    how: "10 shots from mixed distances. Count how many finish within about 15 yards of the target, roughly a green.",
    outOf: 10,
    target: 5,
    levels: { bronze: 3, silver: 5, gold: 7 },
  },
  shortGame: {
    id: "save-nine",
    category: "shortGame",
    name: "Save nine",
    how: "Play the up-and-down nine once. Count your saves.",
    outOf: 9,
    target: 3,
    levels: { bronze: 2, silver: 3, gold: 5 },
    carry: 9,
  },
  putting: {
    id: "twenty-threes",
    category: "putting",
    name: "Twenty threes",
    how: "20 putts from 3 feet with 3 balls, moving around the hole. Count the makes.",
    outOf: 20,
    target: 15,
    levels: { bronze: 12, silver: 15, gold: 18 },
    carry: 3,
  },
  mixed: {
    id: "nine-hole-range",
    category: "mixed",
    name: "Nine-hole range round",
    how: "Play 9 imaginary holes: tee shot, then the approach that hole would leave. Count the greens you'd have hit.",
    outOf: 9,
    target: 3,
    levels: { bronze: 2, silver: 3, gold: 5 },
  },
};

export const challengeById = (id: string) => Object.values(challenges).find((c) => c.id === id);

// The highest level a score reaches, if any.
export function levelFor(challenge: Challenge, score: number): Level | null {
  return [...levelOrder].reverse().find((l) => score >= challenge.levels[l]) ?? null;
}

// The next level up from a best score, and the score it needs.
export function nextLevel(challenge: Challenge, best: number | undefined): { level: Level; score: number } | null {
  const next = levelOrder.find((l) => best === undefined || best < challenge.levels[l]);
  return next ? { level: next, score: challenge.levels[next] } : null;
}

// Extra advice when the round showed a clear miss pattern.
export const missTips: Partial<Record<Category, Partial<Record<string, string>>>> = {
  driving: {
    right: "Most of your tee misses went right. Put an alignment stick a few feet ahead, just left of your target, and start the ball over it.",
    left: "Most of your tee misses went left. Check your aim first: set a club on the ground along your feet and look behind the ball.",
  },
  approach: {
    short: "Most missed greens came up short. Take one more club than you think and aim past the pin.",
    long: "Most missed greens went long. Club down, and check your distances with the ladder drill.",
    right: "Most missed greens went right. Pick an intermediate target a foot in front of the ball on your start line.",
    left: "Most missed greens went left. Hold your finish facing the target and watch the start line.",
  },
};

export const drillById = (id: string) => drills.find((d) => d.id === id);

// ---- Building a plan ----

export type PlanBlock = {
  kind: "warmup" | "drill" | "challenge";
  title: string;
  minutes: number;
  where: string;
  steps: string[];
  // How to use the block's time; challenges are played once.
  repeat: string;
  // Range: balls hit (used up). Green: balls to bring (reused).
  rangeBalls?: number;
  carry?: number;
  drillId?: string;
  challenge?: Challenge;
};

export type PracticePlan = {
  focus: Category | "mixed";
  also: Category[];
  minutes: 15 | 30 | 60;
  blocks: PlanBlock[];
  // What to bring: a range bucket (balls used up) and balls for the green (reused).
  bring: { rangeBalls: number; greenBalls: number };
};

const split = { 15: { warmup: 3, drills: 7, challenge: 5 }, 30: { warmup: 5, drills: 15, challenge: 10 }, 60: { warmup: 10, drills: 35, challenge: 15 } } as const;

// About 1.5 balls a minute with a full routine, rounded to the nearest 5.
const rangeBallsFor = (minutes: number) => Math.max(5, Math.round((minutes * 1.5) / 5) * 5);

function warmup(focus: Category | "mixed", minutes: number): PlanBlock {
  if (focus === "putting") {
    return {
      kind: "warmup",
      title: "Warm up",
      minutes,
      where: "Putting green",
      carry: 3,
      steps: ["A few long putts to feel the green speed.", "Then a few short ones to see the ball go in."],
      repeat: "Stop when the time is up.",
    };
  }
  return {
    kind: "warmup",
    title: "Warm up",
    minutes,
    where: "Range",
    rangeBalls: rangeBallsFor(minutes),
    steps: ["Half swings with a wedge.", "Work up to a mid-iron at three-quarter speed.", "No targets yet, just contact."],
    repeat: "Stop when the time is up.",
  };
}

// Splits minutes across n drills so the parts add up exactly (35 → 18 + 17).
function splitMinutes(total: number, n: number) {
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => base + (i < total - base * n ? 1 : 0));
}

// `also`: extra areas to mix in. The first drill of each comes right after the
// lead area's first drill; the challenge always belongs to the lead area.
export function buildPlan(focus: Category | "mixed", minutes: 15 | 30 | 60, also: Category[] = []): PracticePlan {
  const time = split[minutes];
  const extra = focus === "mixed" ? [] : also.filter((c) => c !== focus);
  const firstOf = (c: Category) => drills.find((d) => d.category === c)!;
  const pool =
    focus === "mixed"
      ? [drills.find((d) => d.id === "distance-ladder")!, drills.find((d) => d.id === "fairway-gates")!, drills.find((d) => d.id === "lag-ladder")!]
      : [firstOf(focus), ...extra.map(firstOf), ...drills.filter((d) => d.category === focus).slice(1)];
  // Short sessions get one drill; longer ones get more, especially when mixing areas.
  const count = minutes === 15 ? 1 : minutes === 30 ? (extra.length ? 2 : 1) : focus === "mixed" || extra.length ? 3 : 2;
  const chosen = pool.slice(0, count);
  const drillMinutes = splitMinutes(time.drills, chosen.length);

  const challenge = challenges[focus];
  const blocks: PlanBlock[] = [
    warmup(extra.length ? "mixed" : focus, time.warmup),
    ...chosen.map((d, i) => ({
      kind: "drill" as const,
      title: d.name,
      minutes: drillMinutes[i],
      where: d.where,
      steps: d.steps,
      repeat: d.repeat,
      rangeBalls: d.where === "Range" ? rangeBallsFor(drillMinutes[i]) : undefined,
      carry: d.carry,
      drillId: d.id,
    })),
    {
      kind: "challenge",
      title: challenge.name,
      minutes: time.challenge,
      where: challenge.carry ? (focus === "shortGame" ? "Short-game area" : "Putting green") : "Range",
      steps: [challenge.how, `Levels (out of ${challenge.outOf}): Bronze ${challenge.levels.bronze} · Silver ${challenge.levels.silver} · Gold ${challenge.levels.gold}.`],
      repeat: "Play it once and log your score.",
      // The nine-hole range round is two shots a hole.
      rangeBalls: challenge.carry ? undefined : challenge.outOf * (focus === "mixed" ? 2 : 1),
      carry: challenge.carry,
      challenge,
    },
  ];
  return {
    focus,
    also: extra,
    minutes,
    blocks,
    bring: {
      rangeBalls: Math.round(blocks.reduce((sum, b) => sum + (b.rangeBalls ?? 0), 0) / 5) * 5,
      greenBalls: Math.max(0, ...blocks.map((b) => b.carry ?? 0)),
    },
  };
}
