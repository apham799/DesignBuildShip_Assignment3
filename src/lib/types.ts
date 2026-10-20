// Shapes of everything Bucket List saves on this device.

export type Category = "driving" | "approach" | "shortGame" | "putting";

export const categoryLabel: Record<Category, string> = {
  driving: "Driving",
  approach: "Approach",
  shortGame: "Short game",
  putting: "Putting",
};

// ---- Courses (from the sample "database", or made by the golfer) ----

export type Par = 3 | 4 | 5;

export type CourseHole = {
  number: number;
  par: Par;
  handicap: number;
  // Yards from each tee, keyed by tee id. Custom courses may not know yardage.
  yards: Record<string, number>;
};

export type Tee = { id: string; name: string };

export type Course = {
  id: string;
  name: string;
  area: string;
  source: "sample" | "custom";
  tees: Tee[];
  holes: CourseHole[];
};

// ---- Rounds ----

export type FairwayResult = "hit" | "left" | "right";
export type GreenResult = "hit" | "left" | "right" | "short" | "long";

// One hole as played. The course facts are copied in when the round starts, so a
// round still makes sense later even if a custom course is edited or deleted.
export type HoleScore = {
  number: number;
  par: Par;
  yards?: number;
  handicap: number;
  strokes: number;
  putts: number;
  fairway?: FairwayResult; // never set on par 3s
  green?: GreenResult; // when left blank, worked out from strokes − putts
  penalties: number;
  note?: string;
  // The note saved on this course hole in an earlier round, shown as "last time".
  lastNote?: string;
  // True once the golfer has moved past this hole (or touched it), so the summary
  // only counts holes that were actually played.
  played: boolean;
};

export type RoundTotals = {
  strokes: number;
  putts: number;
  fairwaysHit: number;
  greensHit: number;
  penalties: number;
};

export type Round = {
  id: string;
  courseId: string;
  courseName: string;
  teeId: string;
  teeName: string;
  startedAt: string; // ISO
  finishedAt?: string; // ISO; missing means the round is in progress
  mode: "holes" | "totals";
  holes: HoleScore[];
  totals?: RoundTotals; // only for mode "totals"
  currentHole: number; // where Resume takes you
};

// ---- Practice ----

export type Focus = {
  category: Category;
  // Other areas the golfer picked; the plan mixes in a drill from each.
  also?: Category[];
  reason: string;
  lockedAt: string; // ISO
  fromRoundId?: string;
};

export type PracticeSession = {
  id: string;
  date: string; // ISO
  focus: Category | "mixed";
  minutes: number;
  balls?: number;
  drillIds: string[];
  challengeId?: string;
  challengeScore?: number;
  challengeOutOf?: number;
  feel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

// An unfinished practice log, saved as you type so leaving the form loses nothing.
// Field values are kept exactly as typed.
export type PracticeDraft = {
  focus?: Category | "mixed";
  also: Category[];
  plannedMinutes?: number; // the plan it was started from, if any
  // The log link (its query string) this draft was started on. A draft started on the
  // current link is the one being edited, never an "unfinished log" to choose from.
  startedFrom?: string;
  minutes: string;
  balls: string;
  drillIds: string[];
  challenge: string;
  feel?: string;
  notes: string;
  savedAt: string; // ISO
};

// ---- Notes kept per course hole ("club down on 4") ----

export type HoleNote = { text: string; roundId: string; updatedAt: string };

export type Store = {
  version: 1;
  rounds: Round[];
  practice: PracticeSession[];
  focus: Focus | null;
  // holeNotes[courseId][holeNumber]
  holeNotes: Record<string, Record<number, HoleNote>>;
  customCourses: Course[];
  weeklyGoal: number; // practice sessions per week
  // Onboarding: one-time tips already dismissed, and whether the getting-started
  // checklist was hidden.
  seenTips: string[];
  checklistDismissed: boolean;
  practiceDraft: PracticeDraft | null;
  // Achievements crossed off (id → when), and the best challenge level reached
  // (challenge id → level). "seen" is false until the celebration is dismissed.
  unlocked: Record<string, { at: string; seen: boolean }>;
  levels: Record<string, { level: "bronze" | "silver" | "gold"; at: string; seen: boolean }>;
  // Where the streak putt was last shown (week start + sessions), so the ball only
  // rolls for new progress.
  streakSeen: { week: string; sessions: number } | null;
  // Last time the trophy case was opened: badges earned after it unlock there with a "New" tag.
  trophyCaseViewedAt: string | null;
};
