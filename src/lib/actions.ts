"use client";

import { newId, update } from "./storage";
import type { Category, Course, HoleScore, Par, PracticeSession, Round, RoundTotals, Store } from "./types";

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
    customCourses: s.customCourses.map((c) =>
      c.id === courseId ? { ...c, holes: c.holes.map((h) => (h.number === number ? { ...h, par } : h)) } : c,
    ),
  }));
}

export function renameCustomCourse(courseId: string, name: string) {
  update((s) => ({ ...s, customCourses: s.customCourses.map((c) => (c.id === courseId ? { ...c, name: name.trim() } : c)) }));
}

export function deleteCustomCourse(courseId: string) {
  update((s) => ({ ...s, customCourses: s.customCourses.filter((c) => c.id !== courseId) }));
}

// ---- Focus and practice ----

export function lockFocus(category: Category, reason: string, fromRoundId?: string) {
  update((s) => ({ ...s, focus: { category, reason, lockedAt: now(), fromRoundId } }));
}

export function clearFocus() {
  update((s) => ({ ...s, focus: null }));
}

export function logPractice(session: Omit<PracticeSession, "id">): string {
  const id = newId();
  update((s) => ({ ...s, practice: [{ ...session, id }, ...s.practice] }));
  return id;
}

export function setWeeklyGoal(goal: number) {
  update((s) => ({ ...s, weeklyGoal: goal }));
}
