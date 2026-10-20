"use client";

import { challenges, drills } from "@/data/drills";
import { recommend } from "./recommend";
import { newId, update } from "./storage";
import type { Category, Course, HoleScore, Par, PracticeDraft, PracticeSession, Round, RoundTotals, Store } from "./types";

// Every change to saved data goes through here.

const now = () => new Date().toISOString();

function mapRound(store: Store, roundId: string, change: (r: Round) => Round): Store {
  return { ...store, rounds: store.rounds.map((r) => (r.id === roundId ? change(r) : r)) };
}

export function inProgressRound(store: Store): Round | undefined {
  return store.rounds.find((r) => !r.finishedAt);
}

// ---- Rounds ----

export function startRound(course: Course, teeId: string, holeCount: number): string {
  const id = newId();
  const tee = course.tees.find((t) => t.id === teeId) ?? course.tees[0];
  update((s) => {
    const notes = s.holeNotes[course.id] ?? {};
    const holes: HoleScore[] = course.holes.slice(0, holeCount).map((h) => ({
      number: h.number,
      par: h.par,
      handicap: h.handicap,
      yards: h.yards[tee.id] || undefined,
      strokes: h.par,
      putts: 2,
      penalties: 0,
      lastNote: notes[h.number]?.text,
      played: false,
    }));
    const round: Round = {
      id,
      courseId: course.id,
      courseName: course.name,
      teeId: tee.id,
      teeName: tee.name,
      startedAt: now(),
      mode: "holes",
      holes,
      currentHole: 1,
    };
    // Only one round is in progress at a time; an older unfinished one is closed as-is.
    return { ...s, rounds: [round, ...s.rounds.map((r) => (r.finishedAt ? r : { ...r, finishedAt: now() }))] };
  });
  return id;
}

export function updateHole(roundId: string, number: number, patch: Partial<Omit<HoleScore, "number">>) {
  update((s) =>
    mapRound(s, roundId, (r) => ({
      ...r,
      currentHole: number,
      holes: r.holes.map((h) => (h.number === number ? { ...h, ...patch, played: true } : h)),
    })),
  );
}

export function goToHole(roundId: string, number: number) {
  update((s) => mapRound(s, roundId, (r) => ({ ...r, currentHole: number })));
}

export function finishRound(roundId: string) {
  update((s) => mapRound(s, roundId, (r) => ({ ...r, finishedAt: now() })));
}

// Totals replace hole-by-hole entry. holeCount lets an 18-hole round be saved as 9.
export function saveTotals(roundId: string, totals: RoundTotals, holeCount: number) {
  update((s) => mapRound(s, roundId, (r) => ({ ...r, mode: "totals", totals, holes: r.holes.slice(0, holeCount), finishedAt: now() })));
}

export function deleteRound(roundId: string) {
  update((s) => ({ ...s, rounds: s.rounds.filter((r) => r.id !== roundId) }));
}

// ---- Notes kept per course hole ----

export function saveHoleNote(courseId: string, number: number, text: string, roundId: string) {
  update((s) => {
    const course = { ...(s.holeNotes[courseId] ?? {}) };
    if (text.trim()) course[number] = { text: text.trim(), roundId, updatedAt: now() };
    else delete course[number];
    return { ...s, holeNotes: { ...s.holeNotes, [courseId]: course } };
  });
}

// ---- Custom courses ----

export function createCustomCourse(name: string, holeCount: 9 | 18): Course {
  const course: Course = {
    id: `custom-${newId()}`,
    name: name.trim(),
    area: `Your course · ${holeCount} holes`,
    source: "custom",
    tees: [{ id: "default", name: "Your tees" }],
    holes: Array.from({ length: holeCount }, (_, i) => ({ number: i + 1, par: 4, handicap: i + 1, yards: {} })),
  };
  update((s) => ({ ...s, customCourses: [course, ...s.customCourses] }));
  return course;
}

// Changing par on a custom course updates the course (for next time) and this round.
export function setCustomPar(courseId: string, roundId: string, number: number, par: Par) {
  update((s) => ({
    ...mapRound(s, roundId, (r) => ({
      ...r,
      holes: r.holes.map((h) => (h.number === number ? { ...h, par, strokes: h.played ? h.strokes : par, fairway: par === 3 ? undefined : h.fairway } : h)),
    })),
    customCourses: s.customCourses.map((c) => (c.id === courseId ? { ...c, holes: c.holes.map((h) => (h.number === number ? { ...h, par } : h)) } : c)),
  }));
}

export function renameCustomCourse(courseId: string, name: string) {
  update((s) => ({ ...s, customCourses: s.customCourses.map((c) => (c.id === courseId ? { ...c, name: name.trim() } : c)) }));
}

export function deleteCustomCourse(courseId: string) {
  update((s) => ({ ...s, customCourses: s.customCourses.filter((c) => c.id !== courseId) }));
}

// ---- Focus and practice ----

export function lockFocus(category: Category, reason: string, fromRoundId?: string, also?: Category[]) {
  update((s) => ({ ...s, focus: { category, also: also?.length ? also : undefined, reason, lockedAt: now(), fromRoundId } }));
}

export function clearFocus() {
  update((s) => ({ ...s, focus: null }));
}

// Saving a session also clears the unfinished draft it came from.
export function logPractice(session: Omit<PracticeSession, "id">): string {
  const id = newId();
  update((s) => ({ ...s, practice: [{ ...session, id }, ...s.practice], practiceDraft: null }));
  return id;
}

export function updatePractice(id: string, session: Omit<PracticeSession, "id">) {
  update((s) => ({ ...s, practice: s.practice.map((p) => (p.id === id ? { ...session, id } : p)) }));
}

export function deletePractice(id: string) {
  update((s) => ({ ...s, practice: s.practice.filter((p) => p.id !== id) }));
}

export function savePracticeDraft(draft: PracticeDraft) {
  update((s) => ({ ...s, practiceDraft: draft }));
}

export function clearPracticeDraft() {
  update((s) => ({ ...s, practiceDraft: null }));
}

export function setWeeklyGoal(goal: number) {
  update((s) => ({ ...s, weeklyGoal: goal }));
}

// ---- Onboarding ----

export function dismissTip(id: string) {
  update((s) => (s.seenTips.includes(id) ? s : { ...s, seenTips: [...s.seenTips, id] }));
}

export function setChecklistDismissed(dismissed: boolean) {
  update((s) => ({ ...s, checklistDismissed: dismissed }));
}

// ---- Sample data, to preview the welcome-back experience without playing ----

const daysBefore = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Two weeks of believable use: a round that sets a focus, practice that climbs a
// challenge level, and a better round after it, so every return-visit feature shows.
export function loadSampleWeek(course: Course) {
  const tee = course.tees[0];
  const nine = course.holes.slice(0, 9);
  const makeRound = (
    daysAgo: number,
    extra: number[],
    putts: number[],
    fairway: (HoleScore["fairway"] | undefined)[],
    green: (HoleScore["green"] | undefined)[],
    notes: Record<number, string> = {},
  ): Round => ({
    id: newId(),
    courseId: course.id,
    courseName: course.name,
    teeId: tee.id,
    teeName: tee.name,
    startedAt: daysBefore(daysAgo, 8),
    finishedAt: daysBefore(daysAgo, 10),
    mode: "holes",
    currentHole: 9,
    holes: nine.map((h, i) => ({
      number: h.number,
      par: h.par,
      handicap: h.handicap,
      yards: h.yards[tee.id] || undefined,
      strokes: h.par + extra[i],
      putts: putts[i],
      fairway: h.par === 3 ? undefined : fairway[i],
      green: green[i],
      penalties: 0,
      note: notes[i + 1],
      played: true,
    })),
  });

  // First round: three-putts and approaches short, which points to putting.
  const first = makeRound(
    10,
    [1, 2, 0, 1, 2, 1, 0, 2, 1],
    [2, 3, 2, 2, 3, 2, 1, 3, 2],
    ["hit", "right", undefined, "hit", "right", "hit", undefined, "left", "hit"],
    [undefined, "short", "hit", "short", undefined, "short", "hit", undefined, "left"],
    { 2: "Tee shot drifts right; aim at the left bunker." },
  );
  // After a week of putting practice: fewer putts, first birdie.
  const second = makeRound(
    2,
    [0, 1, -1, 1, 1, 0, 0, 1, 1],
    [2, 2, 1, 2, 2, 2, 1, 2, 2],
    ["hit", "hit", undefined, "right", "hit", "hit", undefined, "left", "hit"],
    [undefined, "short", "hit", "short", undefined, undefined, "hit", "short", "left"],
    { 4: "Green slopes back to front; stay below the hole." },
  );
  const top = recommend(first)?.top;
  const category = top?.category ?? "putting";
  const challenge = challenges[category];
  const drillId = drills.find((d) => d.category === category)?.id;
  const session = (daysAgo: number, score: number, feel: PracticeSession["feel"], notes: string): PracticeSession => ({
    id: newId(),
    date: daysBefore(daysAgo, 18),
    focus: category,
    minutes: 30,
    drillIds: drillId ? [drillId] : [],
    challengeId: challenge.id,
    challengeScore: score,
    challengeOutOf: challenge.outOf,
    feel,
    notes,
  });

  update((s) => ({
    ...s,
    rounds: [second, first, ...s.rounds],
    focus: top ? { category, reason: top.reason, lockedAt: daysBefore(10, 11), fromRoundId: first.id } : s.focus,
    practice: [
      session(1, challenge.levels.silver, 4, "Short ones are going in. Kept my head still through impact."),
      session(5, challenge.levels.bronze + 1, 3, "Lag putts felt good. Short ones pushed right."),
      session(8, challenge.levels.bronze, 3, "First session on putting. Speed all over the place."),
      ...s.practice,
    ],
    holeNotes: {
      ...s.holeNotes,
      [course.id]: {
        ...(s.holeNotes[course.id] ?? {}),
        2: { text: "Tee shot drifts right; aim at the left bunker.", roundId: first.id, updatedAt: daysBefore(10, 9) },
        4: { text: "Green slopes back to front; stay below the hole.", roundId: second.id, updatedAt: daysBefore(2, 9) },
      },
    },
    seenTips: Array.from(new Set([...s.seenTips, "hole", "summary", "practice"])),
  }));
}
