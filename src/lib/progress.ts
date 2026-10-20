import { challengeById, levelFor, levelOrder, type Level } from "@/data/drills";
import { startOfWeek } from "./format";
import { hitGreen, leaks, playedHoles, roughStrokes, roundStats, type Leak } from "./recommend";
import { categoryLabel, type Category, type Round, type Store } from "./types";

// Everything that keeps people coming back is worked out from what they've already
// logged: streaks, challenge levels, the practice → round payoff, and the bucket list.

const finished = (store: Store) => store.rounds.filter((r) => r.finishedAt && playedHoles(r).length > 0);

// ---- Weekly streak, with one mulligan a month ----

export type WeekDot = { start: Date; sessions: number; state: "met" | "mulligan" | "missed" | "in-progress" | "before" };

export type Streak = {
  weeks: number; // weeks in a row the goal was met (mulligan weeks keep it alive but don't add)
  thisWeek: number;
  goal: number;
  metThisWeek: boolean;
  mulliganUsedThisMonth: boolean;
  dots: WeekDot[]; // the last 8 weeks, oldest first
};

const WEEK = 7 * 24 * 60 * 60 * 1000;
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export function streak(store: Store, today = new Date()): Streak {
  const goal = store.weeklyGoal;
  const thisMonday = startOfWeek(today).getTime();
  const count = (start: number) =>
    store.practice.filter((p) => {
      const t = new Date(p.date).getTime();
      return t >= start && t < start + WEEK;
    }).length;
  const firstPractice = store.practice.length ? Math.min(...store.practice.map((p) => new Date(p.date).getTime())) : null;
  const firstMonday = firstPractice === null ? null : startOfWeek(new Date(firstPractice)).getTime();

  const thisWeek = count(thisMonday);
  const metThisWeek = thisWeek >= goal;
  const states = new Map<number, WeekDot["state"]>();
  const mulligans = new Set<string>();
  let weeks = metThisWeek ? 1 : 0;
  states.set(thisMonday, metThisWeek ? "met" : "in-progress");

  // Walk back from last week. A missed week is forgiven once per calendar month.
  for (let start = thisMonday - WEEK; firstMonday !== null && start >= firstMonday; start -= WEEK) {
    if (count(start) >= goal) {
      weeks++;
      states.set(start, "met");
      continue;
    }
    const month = monthKey(new Date(start));
    if (!mulligans.has(month)) {
      mulligans.add(month);
      states.set(start, "mulligan");
      continue;
    }
    break;
  }
  // A mulligan only counts if a met week sits before it; otherwise it's just a miss.
  const sorted = [...states.keys()].sort((a, b) => a - b);
  for (const start of sorted) {
    if (states.get(start) === "mulligan") states.set(start, "missed");
    else break;
  }
  for (const [start, state] of states) if (state === "missed") mulligans.delete(monthKey(new Date(start)));

  const dots: WeekDot[] = Array.from({ length: 8 }, (_, i) => {
    const start = thisMonday - (7 - i) * WEEK;
    const state = states.get(start) ?? (firstMonday === null || start < firstMonday ? "before" : "missed");
    return { start: new Date(start), sessions: count(start), state };
  });
  return { weeks, thisWeek, goal, metThisWeek, mulliganUsedThisMonth: mulligans.has(monthKey(today)), dots };
}

// ---- Challenge levels ----

export function challengeBest(store: Store, challengeId: string) {
  const scores = store.practice.filter((p) => p.challengeId === challengeId && p.challengeScore !== undefined).map((p) => p.challengeScore!);
  const best = scores.length ? Math.max(...scores) : undefined;
  const challenge = challengeById(challengeId);
  return { best, last: scores[0], count: scores.length, level: challenge && best !== undefined ? levelFor(challenge, best) : null };
}

// Best level reached on every challenge, for celebrating level-ups.
export function bestLevels(store: Store): Record<string, Level> {
  const out: Record<string, Level> = {};
  for (const p of store.practice) {
    const c = p.challengeId ? challengeById(p.challengeId) : undefined;
    if (!c || p.challengeScore === undefined) continue;
    const l = levelFor(c, p.challengeScore);
    if (l && (!out[c.id] || levelOrder.indexOf(l) > levelOrder.indexOf(out[c.id]))) out[c.id] = l;
  }
  return out;
}

// ---- Practice → round payoff ----

export type Payoff = { category: Category; before: string; after: string; strokes: number; verdict: "better" | "same" | "worse"; text: string; baseline: Round };

function measure(category: Category, round: Round) {
  const s = roundStats(round);
  const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 100) : 0}%`;
  switch (category) {
    case "putting":
      return `${(s.putts / s.holes).toFixed(1)} putts a hole`;
    case "approach":
      return `${pct(s.greensHit, s.holes)} of greens`;
    case "driving":
      return `${pct(s.fairwaysHit, s.fairwaysPossible)} of fairways`;
    case "shortGame":
      return s.scrambleChances ? `${pct(s.scrambles ?? 0, s.scrambleChances)} saved` : null;
  }
}

// Did the focus improve from the round that set it (or the last one before) to this one?
export function payoff(store: Store, round: Round): Payoff | null {
  const focus = store.focus;
  if (!focus || !round.finishedAt || new Date(focus.lockedAt) > new Date(round.startedAt)) return null;
  const earlier = finished(store).filter((r) => r.id !== round.id && new Date(r.startedAt) < new Date(round.startedAt));
  const baseline = earlier.find((r) => r.id === focus.fromRoundId) ?? earlier[0];
  if (!baseline) return null;
  const leakOf = (r: Round) => leaks(roundStats(r)).find((l) => l.category === focus.category);
  const a = leakOf(baseline);
  const b = leakOf(round);
  const before = measure(focus.category, baseline);
  const after = measure(focus.category, round);
  if (!a || !b || !before || !after) return null;
  // Strokes lost per hole, then scaled to this round's length.
  const holes = roundStats(round).holes;
  const strokes = (a.strokes / roundStats(baseline).holes - b.strokes / holes) * holes;
  const verdict = strokes >= 0.4 ? "better" : strokes <= -0.4 ? "worse" : "same";
  const name = categoryLabel[focus.category];
  const text =
    verdict === "better"
      ? `${name} is paying off: ${before} → ${after}, ${roughStrokes(strokes)} back.`
      : verdict === "worse"
        ? `${name} slipped this time: ${before} → ${after}. One round is noisy; keep at the plan.`
        : `${name} held steady: ${before} → ${after}. Keep going; it usually takes a few sessions.`;
  return { category: focus.category, before, after, strokes, verdict, text, baseline };
}

// ---- How the focus is going, from the latest round since it was locked in ----

export type FocusCheck = {
  round: Round; // the latest finished round played after the focus was locked in
  pay: Payoff | null;
  now: Leak | undefined; // the focus area in that round
  // The focus costs less than a stroke now: time to move on.
  beaten: boolean;
  // The area the latest round points to instead, when it's worth switching.
  next?: Leak;
};

export function focusCheck(store: Store): FocusCheck | null {
  const focus = store.focus;
  if (!focus) return null;
  const round = finished(store)[0];
  if (!round || round.id === focus.fromRoundId || new Date(round.startedAt) < new Date(focus.lockedAt)) return null;
  const all = leaks(roundStats(round));
  const now = all.find((l) => l.category === focus.category);
  const beaten = Boolean(now && now.strokes <= 0.5);
  const other = all.find((l) => l.category !== focus.category && l.strokes > 0.5);
  const next = other && (beaten || !now || other.strokes > now.strokes + 0.5) ? other : undefined;
  return { round, pay: payoff(store, round), now, beaten, next };
}

// Practice logged since the focus was locked in.
export function sessionsSinceFocus(store: Store) {
  const focus = store.focus;
  return focus ? store.practice.filter((p) => new Date(p.date) >= new Date(focus.lockedAt)).length : 0;
}

// ---- The bucket list ----

export type Achievement = { id: string; group: "Rounds" | "Practice" | "Habits"; title: string; how: string; done: (s: Store) => boolean };

const anyHole = (s: Store, test: (h: Round["holes"][number]) => boolean) => finished(s).some((r) => r.mode === "holes" && playedHoles(r).some(test));

export const achievements: Achievement[] = [
  { id: "first-round", group: "Rounds", title: "Tee it up", how: "Log your first round.", done: (s) => finished(s).length > 0 },
  { id: "first-par", group: "Rounds", title: "Par for the course", how: "Make a par.", done: (s) => anyHole(s, (h) => h.strokes === h.par) },
  { id: "first-birdie", group: "Rounds", title: "Birdie!", how: "Make a birdie or better.", done: (s) => anyHole(s, (h) => h.strokes < h.par) },
  { id: "up-and-down", group: "Rounds", title: "Up and down", how: "Save par after missing a green.", done: (s) => anyHole(s, (h) => !hitGreen(h) && h.strokes <= h.par) },
  {
    id: "no-three-putts",
    group: "Rounds",
    title: "Two-putt territory",
    how: "Play 9 or more holes without a three-putt.",
    done: (s) => finished(s).some((r) => r.mode === "holes" && playedHoles(r).length >= 9 && playedHoles(r).every((h) => h.putts < 3)),
  },
  {
    id: "fairway-finder",
    group: "Rounds",
    title: "Fairway finder",
    how: "Hit half your fairways in a round (at least 5 tee shots).",
    done: (s) =>
      finished(s).some((r) => {
        const st = roundStats(r);
        return st.fairwaysPossible >= 5 && st.fairwaysHit / st.fairwaysPossible >= 0.5;
      }),
  },
  { id: "three-greens", group: "Rounds", title: "On in regulation", how: "Hit 3 greens in regulation in one round.", done: (s) => finished(s).some((r) => roundStats(r).greensHit >= 3) },
  {
    id: "bogey-golf",
    group: "Rounds",
    title: "Bogey golf",
    how: "Play 9 holes at bogey or better (par + 9).",
    done: (s) =>
      finished(s).some((r) => {
        const st = roundStats(r);
        return st.holes >= 9 && st.strokes <= st.par + st.holes;
      }),
  },
  { id: "full-18", group: "Rounds", title: "The full 18", how: "Finish an 18-hole round.", done: (s) => finished(s).some((r) => playedHoles(r).length === 18) },
  { id: "course-collector", group: "Rounds", title: "Course collector", how: "Play 3 different courses.", done: (s) => new Set(finished(s).map((r) => r.courseId)).size >= 3 },
  { id: "first-practice", group: "Practice", title: "First bucket", how: "Log a practice session.", done: (s) => s.practice.length > 0 },
  { id: "range-rat", group: "Practice", title: "Range rat", how: "Log 5 practice sessions.", done: (s) => s.practice.length >= 5 },
  { id: "hour-of-power", group: "Practice", title: "Hour of power", how: "Practice for 60 minutes or more in one session.", done: (s) => s.practice.some((p) => p.minutes >= 60) },
  { id: "on-target", group: "Practice", title: "On target", how: "Hit a challenge target (Silver).", done: (s) => Object.values(bestLevels(s)).some((l) => l !== "bronze") },
  { id: "gold-standard", group: "Practice", title: "Gold standard", how: "Reach Gold on any challenge.", done: (s) => Object.values(bestLevels(s)).includes("gold") },
  {
    id: "well-rounded",
    group: "Practice",
    title: "Well rounded",
    how: "Practice all four areas: driving, approach, short game, putting.",
    done: (s) => (["driving", "approach", "shortGame", "putting"] as Category[]).every((c) => s.practice.some((p) => p.focus === c)),
  },
  { id: "its-working", group: "Habits", title: "It's working", how: "Improve your focus area in the next round.", done: (s) => finished(s).some((r) => payoff(s, r)?.verdict === "better") },
  { id: "yardage-book", group: "Habits", title: "Yardage book", how: "Leave notes on 5 holes.", done: (s) => Object.values(s.holeNotes).reduce((n, c) => n + Object.keys(c).length, 0) >= 5 },
  { id: "off-the-map", group: "Habits", title: "Off the map", how: "Add your own course.", done: (s) => s.customCourses.length > 0 },
  { id: "month-of-practice", group: "Habits", title: "Month of practice", how: "Hit your weekly goal 4 weeks in a row.", done: (s) => streak(s).weeks >= 4 },
];

export const achievementById = (id: string) => achievements.find((a) => a.id === id);

export function crossedOff(store: Store) {
  return achievements.filter((a) => store.unlocked[a.id] || a.done(store));
}

// The next few to go for, easiest-first by list order, so Home always has a target.
export function upNext(store: Store, n = 3) {
  return achievements.filter((a) => !store.unlocked[a.id] && !a.done(store)).slice(0, n);
}
