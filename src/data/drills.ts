import type { Category } from "@/lib/types";

// Drill library. Every plan is warm-up → drill(s) → a scored challenge with a target,
// so each practice session ends with a number to compare against next time.

export type Drill = {
  id: string;
  category: Category;
  name: string;
  where: string;
  balls?: number;
  steps: string[];
};

export type Challenge = {
  id: string;
  category: Category | "mixed";
  name: string;
  how: string;
  outOf: number;
  target: number;
  balls?: number;
};

export const drills: Drill[] = [
  {
    id: "fairway-gates",
    category: "driving",
    name: "Fairway gates",
    where: "Range",
    balls: 15,
    steps: [
      "Pick two flags or signs about 30 yards apart as your fairway.",
      "Alternate driver and your next-longest club, full routine every ball.",
      "Say out loud where it finished: in, left, or right.",
    ],
  },
  {
    id: "stock-shot",
    category: "driving",
    name: "Stock shot",
    where: "Range",
    balls: 10,
    steps: ["Pick one club you trust off the tee.", "Hit the same shot shape at one target, 10 times.", "Only change your aim, never your swing, between balls."],
  },
  {
    id: "distance-ladder",
    category: "approach",
    name: "Distance ladder",
    where: "Range",
    balls: 16,
    steps: ["Pick targets at roughly 75, 100, 125 and 150 yards.", "Hit 4 balls at each, changing club every ball, as on the course.", "Note which distances finish short or long."],
  },
  {
    id: "back-of-green",
    category: "approach",
    name: "Back-of-the-green",
    where: "Range",
    balls: 12,
    steps: ["Pick a target and aim for 5 yards past it.", "Take one more club than feels right.", "Count how many carry the target; most golfers come up short."],
  },
  {
    id: "landing-spot",
    category: "shortGame",
    name: "Landing spot",
    where: "Short-game area",
    balls: 15,
    steps: ["Put a towel a third of the way to the hole.", "Chip so the ball lands on the towel and rolls out.", "Move the towel after 5 balls."],
  },
  {
    id: "up-and-down-nine",
    category: "shortGame",
    name: "Up-and-down nine",
    where: "Short-game area",
    balls: 9,
    steps: ["Drop 9 balls around a green: 3 easy, 3 medium, 3 hard lies.", "Chip, then putt each one out.", "A save is getting down in 2."],
  },
  {
    id: "lag-ladder",
    category: "putting",
    name: "Lag ladder",
    where: "Putting green",
    balls: 9,
    steps: ["Putt 3 balls each from 20, 30 and 40 feet.", "The goal is to finish inside a putter-length of the hole.", "Watch the whole roll so your eyes learn the speed."],
  },
  {
    id: "circle-drill",
    category: "putting",
    name: "Circle drill",
    where: "Putting green",
    balls: 6,
    steps: ["Place 6 balls in a circle 3 feet from the hole.", "Make all 6 in a row; start over if you miss.", "Then move to 4 feet."],
  },
];

export const challenges: Record<Category | "mixed", Challenge> = {
  driving: { id: "fairway-finder", category: "driving", name: "Fairway finder", how: "10 drives at your fairway gates. Count how many finish inside.", outOf: 10, target: 6, balls: 10 },
  approach: {
    id: "green-circle",
    category: "approach",
    name: "Green circle",
    how: "10 shots from mixed distances. Count how many finish within about 15 yards of the target, roughly a green.",
    outOf: 10,
    target: 5,
    balls: 10,
  },
  shortGame: { id: "save-nine", category: "shortGame", name: "Save nine", how: "Play the up-and-down nine. Count your saves.", outOf: 9, target: 3, balls: 9 },
  putting: { id: "twenty-threes", category: "putting", name: "Twenty threes", how: "20 putts from 3 feet, moving around the hole. Count the makes.", outOf: 20, target: 15, balls: 20 },
  mixed: {
    id: "nine-hole-range",
    category: "mixed",
    name: "Nine-hole range round",
    how: "Play 9 imaginary holes: tee shot, then the approach that hole would leave. Count the greens you'd have hit.",
    outOf: 9,
    target: 3,
    balls: 18,
  },
};

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
  where?: string;
  balls?: number;
  steps: string[];
  drillId?: string;
  challenge?: Challenge;
};

export type PracticePlan = {
  focus: Category | "mixed";
  also: Category[];
  minutes: 15 | 30 | 60;
  blocks: PlanBlock[];
  balls: number;
};

const split = { 15: { warmup: 3, drills: 7, challenge: 5 }, 30: { warmup: 5, drills: 15, challenge: 10 }, 60: { warmup: 10, drills: 35, challenge: 15 } } as const;

function warmup(focus: Category | "mixed", minutes: number): PlanBlock {
  if (focus === "putting") {
    return { kind: "warmup", title: "Warm up", minutes, where: "Putting green", steps: ["A few long putts to feel the green speed.", "Then 5 short ones to see the ball go in."] };
  }
  return {
    kind: "warmup",
    title: "Warm up",
    minutes,
    where: "Range",
    balls: minutes >= 10 ? 15 : 8,
    steps: ["Half swings with a wedge.", "Work up to a mid-iron at three-quarter speed.", "No targets yet, just contact."],
  };
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
  const each = Math.round(time.drills / chosen.length);

  const challenge = challenges[focus];
  const blocks: PlanBlock[] = [
    warmup(extra.length ? "mixed" : focus, time.warmup),
    ...chosen.map((d) => ({ kind: "drill" as const, title: d.name, minutes: each, where: d.where, balls: d.balls, steps: d.steps, drillId: d.id })),
    { kind: "challenge", title: challenge.name, minutes: time.challenge, balls: challenge.balls, steps: [challenge.how, `Target: ${challenge.target} of ${challenge.outOf}.`], challenge },
  ];
  return { focus, also: extra, minutes, blocks, balls: blocks.reduce((sum, b) => sum + (b.balls ?? 0), 0) };
}
