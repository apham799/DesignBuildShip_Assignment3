"use client";

import { useEffect, useState } from "react";
import { update } from "@/lib/storage";

// The weekly streak as a putt: each practice session rolls the ball closer, and the
// session that meets the goal holes it. The ball only rolls for progress made since it
// was last shown (remembered in the store), so a refresh doesn't replay it. Decorative:
// the card's text says the same thing, and reduced motion skips the movement.

const START = 34;
const HOLE = 280;
const ROLL_MS = 1100;
// Drop (700ms) plus the flag wave that follows it, before the putt is remembered as seen.
const HOLE_OUT_MS = 1200;

const xFor = (sessions: number, goal: number) => START + (Math.min(sessions, goal) / goal) * (HOLE - START);

export function PuttingGreen({ sessions, goal, week, seen }: { sessions: number; goal: number; week: string; seen: number }) {
  // Where the ball was last shown this week; it rolls from there to today's spot.
  const from = Math.min(seen, sessions);
  const [shown, setShown] = useState(from);
  const justHoled = from < goal && shown >= goal;
  const holed = shown >= goal;

  useEffect(() => {
    if (from === sessions) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => setShown(sessions));
    const done = setTimeout(() => update((s) => ({ ...s, streakSeen: { week, sessions } })), reduce ? 0 : ROLL_MS + (sessions >= goal ? HOLE_OUT_MS : 0));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [from, sessions, goal, week]);

  const x = xFor(shown, goal);
  return (
    <svg viewBox="0 0 320 84" className="h-auto w-full" aria-hidden>
      {/* the green */}
      <ellipse cx="160" cy="50" rx="156" ry="30" fill="#e2eddb" stroke="#2f6b4f" strokeOpacity="0.35" strokeWidth="1.5" />
      <ellipse cx="160" cy="50" rx="120" ry="20" fill="#d3e4c8" opacity="0.6" />
      {/* where earlier putts this week stopped */}
      {Array.from({ length: Math.min(shown, goal) }, (_, i) => i).map((i) => (
        <circle key={i} cx={xFor(i, goal)} cy="50" r="2.2" fill="#4f4a41" opacity="0.35" />
      ))}
      <line x1={START} y1="50" x2={x} y2="50" stroke="#4f4a41" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 4" />
      {/* the cup, a ripple when the ball drops, and the flag */}
      <ellipse cx={HOLE} cy="51" rx="8" ry="4" fill="#2b2a28" />
      {/* already holed on an earlier visit: the ball sits in the cup */}
      {holed && !justHoled && <ellipse cx={HOLE} cy="50" rx="4.5" ry="2.2" fill="#ffffff" />}
      {justHoled && (
        <ellipse cx={HOLE} cy="51" rx="8" ry="4" fill="none" stroke="#2f6b4f" strokeWidth="1.5" className="origin-[280px_51px] motion-safe:animate-[cup-ripple_700ms_ease-out_1100ms_both]" />
      )}
      <g className={justHoled ? "origin-[281px_50px] motion-safe:animate-[flag-wave_900ms_ease-in-out_1300ms_both]" : undefined}>
        <line x1={HOLE + 1} y1="50" x2={HOLE + 1} y2="8" stroke="#2b2a28" strokeWidth="1.8" />
        <path d={`M${HOLE + 2} 9 L${HOLE + 26} 15 L${HOLE + 2} 21 Z`} fill="#b8893b" />
      </g>
      {/* the ball: rolls along, then drops into the cup */}
      <g style={{ transform: `translateX(${x - START}px)` }} className="transition-transform duration-[1100ms] ease-[cubic-bezier(0.15,0.6,0.25,1)] motion-reduce:transition-none">
        <g className={justHoled ? "origin-[34px_50px] motion-safe:animate-[ball-drop_700ms_ease-in_1100ms_both]" : undefined} style={holed && !justHoled ? { opacity: 0 } : undefined}>
          <circle cx={START} cy="50" r="6" fill="#ffffff" stroke="#4f4a41" strokeWidth="1.5" />
          <circle cx={START - 1.5} cy="48.5" r="0.9" fill="#4f4a41" opacity="0.5" />
          <circle cx={START + 1.5} cy="51" r="0.9" fill="#4f4a41" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}
