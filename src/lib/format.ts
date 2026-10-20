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

// "just now", "12 minutes ago", "3 hours ago", then falls back to daysAgo.
export function timeAgo(iso: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return daysAgo(iso, now);
}

// The same score, for screen readers: "even par", "2 over par", "1 under par".
export function toParWords(strokes: number, par: number) {
  const d = strokes - par;
  if (d === 0) return "even par";
  return `${Math.abs(d)} ${d > 0 ? "over" : "under"} par`;
}

// "Blue tees", but a custom course's tee is already called "Your tees".
export function teeLabel(name: string) {
  return /tees?$/i.test(name.trim()) ? name : `${name} tees`;
}
