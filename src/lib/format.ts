import type { PracticeSession } from "./types";

export function toPar(strokes: number, par: number) {
  const d = strokes - par;
  if (d === 0) return "E";
  return d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysAgo(iso: string, today = new Date()) {
  const days = Math.round((startOfDay(today) - startOfDay(new Date(iso))) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Weeks start on Monday.
export function startOfWeek(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function sessionsThisWeek(practice: PracticeSession[], today = new Date()) {
  const start = startOfWeek(today).getTime();
  return practice.filter((p) => new Date(p.date).getTime() >= start).length;
}
